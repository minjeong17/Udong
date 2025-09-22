package com.udong.backend.chat.dto;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ChatParticipantsResponse {
    private Integer chatId;
    /** 방 개설자 포함한 전체 멤버 리스트 (owner=true로 표시) */
    private List<ChatMemberItem> participants;
}