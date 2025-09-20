package com.udong.backend.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoomListItem {
    private Integer roomId;
    private String  name;
    private String  typeCode;   // GLOBAL | EVENT
    private Integer targetId;   // GLOBAL→club_id, EVENT→event_id
    private Long    memberCount;

    public ChatRoomListItem(Integer roomId, String name, String typeCode, Integer targetId, Long memberCount) {
        this.roomId = roomId;
        this.name = name;
        this.typeCode = typeCode;
        this.targetId = targetId;
        this.memberCount = memberCount;
    }
}
