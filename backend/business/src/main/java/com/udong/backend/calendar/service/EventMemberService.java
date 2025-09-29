package com.udong.backend.calendar.service;

import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.calendar.repository.EventRepository;
import com.udong.backend.chat.dto.ChatMemberItem;
import com.udong.backend.chat.dto.ChatParticipantsResponse;
import com.udong.backend.chat.entity.ChatMember;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatMemberRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventMemberService {

    private final EventRepository eventRepository;
    private final EventMemberRepository eventMemberRepository;
    private final ChatRoomService chatRoomService;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatRoomMemberRepository;

    @Transactional
    public ChatParticipantsResponse confirmParticipantsByChatId(Integer chatId, List<Integer> userIds) {
        // 1) 채팅방 조회 + 타입 검증
        ChatRoom room = chatRoomRepository.findWithCreatorById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + chatId));
        if (!"EVENT".equals(room.getType().getCodeName())) {
            throw new IllegalArgumentException("EVENT 채팅방이 아닙니다. chatId=" + chatId);
        }

        // 2) 멤버 목록 로딩 & 유효성 (선택)
        List<ChatMember> members = chatRoomMemberRepository.findByChatRoomId(chatId);
        Set<Integer> memberIds = members.stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());
        boolean allInside = userIds.stream().allMatch(memberIds::contains);
        if (!allInside) {
            throw new IllegalArgumentException("확정 대상 중 채팅방 멤버가 아닌 사용자가 포함됨");
        }

        // 3) ChatRoom 에 확정 상태/인원 저장 (JPA dirty checking)
        int count = userIds.size();
        room.confirmParticipants(count); // participants_confirmed=true, count 저장

        // 4) 응답 DTO 조립
        List<ChatMemberItem> items = members.stream()
                .map(m -> ChatMemberItem.builder()
                        .userId(m.getUser().getId())
                        .name(m.getUser().getName())
                        .owner(m.getUser().getId().equals(room.getCreatedBy().getId()))
                        .build())
                .toList();

        return ChatParticipantsResponse.builder()
                .chatId(room.getId())
                .participants(items)
                .confirmed(Boolean.TRUE)
                .confirmedCount(count)
                .build();
    }

    @Transactional
    public void confirmParticipants(Integer eventId, List<Integer> userIds) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("이벤트가 존재하지 않습니다. id=" + eventId));

        // 전체 false
        eventMemberRepository.markAllFalseByEventId(eventId);

        // 선택된 사람만 true
        if (userIds != null && !userIds.isEmpty()) {
            eventMemberRepository.markTrueByEventIdAndUserIds(eventId, userIds);
        }
    }

}
