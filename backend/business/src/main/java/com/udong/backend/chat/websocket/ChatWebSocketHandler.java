package com.udong.backend.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.udong.backend.chat.dto.ChatMessageDto;
import com.udong.backend.chat.entity.ChatMessage;
import com.udong.backend.chat.service.ChatMessageService;
import com.udong.backend.global.config.JwtTokenProvider; // 네 프로젝트 경로에 맞게
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper om = new ObjectMapper();
    private final ChatMessageService chatMessageService;
    private final JwtTokenProvider jwtTokenProvider; // 토큰 검증용

    private final ConcurrentMap<Integer, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Integer roomId = extractRoomId(session);
        if (roomId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }
        session.getAttributes().put("roomId", roomId);

        // ★ 토큰에서 userId 뽑아 세션에 저장 (임시; 나중에 HandshakeInterceptor 쓰면 더 깔끔)
        Integer userId = extractUserIdFromToken(session);
        if (userId != null) {
            session.getAttributes().put("userId", userId);
        }

        roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WS connected: room={}, session={}, user={}", roomId, session.getId(), userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Integer roomId = (Integer) session.getAttributes().get("roomId");
        Integer userId = (Integer) session.getAttributes().get("userId");
        if (roomId == null) { session.close(CloseStatus.BAD_DATA); return; }
        if (userId == null) { session.close(CloseStatus.POLICY_VIOLATION); return; }

        JsonNode in = om.readTree(message.getPayload());
        String type = in.path("type").asText();
        if (!"CHAT".equals(type)) return;

        String content = in.path("content").asText("");

        // 1) DB 저장
        ChatMessage saved = chatMessageService.saveMessage(roomId, userId, content);
        ChatMessageDto dto = ChatMessageDto.from(saved);

        // 2) 브로드캐스트 payload (프론트 타입 WsChatIn과 매칭)
        var out = om.createObjectNode();
        out.put("type", "CHAT");
        out.put("roomId", dto.getRoomId());
        out.put("messageId", dto.getMessageId());
        out.put("senderUserId", dto.getSenderUserId());
        out.put("senderName", dto.getSenderName() == null ? "익명" : dto.getSenderName());
        out.put("content", dto.getContent());
        out.put("createdAt", dto.getCreatedAt().toString());

        broadcast(roomId, new TextMessage(om.writeValueAsString(out)));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Integer roomId = (Integer) session.getAttributes().get("roomId");
        if (roomId == null) return;

        Set<WebSocketSession> set = roomSessions.get(roomId);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) roomSessions.remove(roomId);
        }
        log.info("WS closed: room={}, session={}, code={}", roomId, session.getId(), status.getCode());
    }

    /**
     * 시스템 메시지 브로드캐스트 (외부에서 호출용)
     */
    public void broadcastSystemMessage(ChatMessage systemMessage) {
        try {
            Integer roomId = systemMessage.getChat().getId();
            System.out.println("📡 브로드캐스트 시작: roomId=" + roomId + ", 연결된 세션 수=" + roomSessions.getOrDefault(roomId, Collections.emptySet()).size());

            // 기존 채팅 메시지와 동일한 형식으로 브로드캐스트
            var out = om.createObjectNode();
            out.put("type", "CHAT");
            out.put("roomId", roomId);
            out.put("messageId", systemMessage.getId());
            out.put("senderUserId", systemMessage.getSender().getId());
            out.put("senderName", systemMessage.getSender().getName() == null ? "익명" : systemMessage.getSender().getName());
            out.put("content", systemMessage.getContent());
            out.put("createdAt", systemMessage.getCreatedAt().toString());

            String jsonMessage = om.writeValueAsString(out);
            System.out.println("📤 전송할 JSON: " + jsonMessage);

            broadcast(roomId, new TextMessage(jsonMessage));
            System.out.println("✅ broadcast() 호출 완료");
        } catch (Exception e) {
            System.err.println("❌ 시스템 메시지 브로드캐스트 실패: " + e.getMessage());
            log.error("시스템 메시지 브로드캐스트 실패", e);
        }
    }

    /* helpers */

    private void broadcast(Integer roomId, TextMessage text) {
        for (WebSocketSession s : roomSessions.getOrDefault(roomId, Collections.emptySet())) {
            if (s.isOpen()) {
                try { s.sendMessage(text); } catch (IOException ignore) {}
            }
        }
    }

    private Integer extractRoomId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        MultiValueMap<String, String> q = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
        String v = q.getFirst("roomId");
        return v != null ? Integer.valueOf(v) : null;
    }

    private Integer extractUserIdFromToken(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        var q = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
        String token = q.getFirst("token");
        if (token == null) return null;
        try {
            if (!jwtTokenProvider.validate(token)) return null;
            String userIdStr = jwtTokenProvider.getUserId(token);
            return Integer.valueOf(userIdStr);
        } catch (Exception e) {
            return null;
        }
    }
}
