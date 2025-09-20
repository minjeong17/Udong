package com.udong.backend.chat.controller;

import com.udong.backend.chat.dto.ChatMessageDto;
import com.udong.backend.chat.service.ChatMessageService;
import com.udong.backend.global.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/chats")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getRecent(
            @PathVariable Integer roomId,
            @RequestParam(name = "limit", required = false, defaultValue = "50") Integer limit
    ) {
        int lim = Math.max(1, Math.min(limit, 200)); // 1~200 사이로 가드
        var data = chatMessageService.getRecentMessages(roomId, lim);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}

