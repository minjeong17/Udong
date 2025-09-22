package com.udong.backend.chat.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMemberItem {
    private Integer userId;
    private String name;      // users.name 기준
    private boolean owner;    // 방 개설자 여부 표시
}