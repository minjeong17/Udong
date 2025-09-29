package com.udong.backend.chat.dto;

import com.udong.backend.chat.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {

    private Integer messageId;
    private Integer roomId;
    private Integer senderUserId;
    private String senderName;
    private String content;
    private LocalDateTime createdAt;

    public static ChatMessageDto from(ChatMessage m) {
        return ChatMessageDto.builder()
                .messageId(m.getId())
                .roomId(m.getChat().getId())
                .senderUserId(m.getSender().getId().intValue())
                .senderName(m.getSender().getName())  // users.name 칼럼에 맞게
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
