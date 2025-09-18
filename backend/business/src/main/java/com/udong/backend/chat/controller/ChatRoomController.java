package com.udong.backend.chat.controller;

import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final SecurityUtils securityUtils;
    private final ChatRoomService chatRoomService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> create(@RequestBody @Valid CreateRoomRequest req) {
        Integer userId = securityUtils.currentUserId();
        chatRoomService.create(userId, req);
        return ResponseEntity.ok(ApiResponse.ok("채팅방 생성 완료"));
    }
}
