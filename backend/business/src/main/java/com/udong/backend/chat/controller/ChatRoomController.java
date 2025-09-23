package com.udong.backend.chat.controller;

import com.udong.backend.chat.dto.ChatParticipantsResponse;
import com.udong.backend.chat.dto.ChatRoomListItem;
import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.swing.plaf.basic.BasicInternalFrameTitlePane;
import java.util.List;

@RestController
@RequestMapping("/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final SecurityUtils securityUtils;
    private final ChatRoomService chatRoomService;
    private final ChatRoomRepository chatRoomRepository;

    /** 채팅방 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<String>> create(@RequestBody @Valid CreateRoomRequest req) {
        Integer userId = securityUtils.currentUserId();
        chatRoomService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.ok("채팅방 생성 완료"));
    }

    /** 채팅방 멤버 추가 (typeCode + targetId) */
    @PostMapping("/{typeCode}/{targetId}/members")
    public ResponseEntity<ApiResponse<String>> addMember(
            @PathVariable String typeCode,
            @PathVariable Integer targetId
    ) {
        // 토큰에서 현재 로그인한 사용자 ID 가져오기
        Integer userId = securityUtils.currentUserId();

        chatRoomService.addMember(typeCode, targetId, userId);
        return ResponseEntity.ok(ApiResponse.ok("채팅방 멤버 추가 완료"));
    }

    /** 유저별 + clubId 필터 채팅방 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomListItem>>> myRoomsByClub(@RequestParam Integer clubId) {
        Integer userId = securityUtils.currentUserId();
        List<ChatRoomListItem> items = chatRoomService.listMyRoomsByClub(userId, clubId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    /** 채팅방 참여자 목록 (방장 포함, owner=true 표시) */
    @GetMapping("/{chatId}/participants")
    public ResponseEntity<ApiResponse<ChatParticipantsResponse>> getParticipants(
            @PathVariable Integer chatId
    ) {
        ChatParticipantsResponse resp = chatRoomService.getParticipants(chatId);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    /** 채팅방 나가기 */
    @DeleteMapping("/{chatId}/leave")
    public ResponseEntity<ApiResponse<?>> leave(@PathVariable Integer chatId) {
        System.out.println("leaveeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        Integer currentUserId = securityUtils.currentUserId(); // 토큰에서 userId
        chatRoomService.leave(chatId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("채팅방 나가기 완료"));
    }

}
