package com.udong.backend.chat.controller;

import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final SecurityUtils securityUtils;
    private final ChatRoomService chatRoomService;

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
}
