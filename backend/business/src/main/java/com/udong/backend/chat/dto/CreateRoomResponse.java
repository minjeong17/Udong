package com.udong.backend.chat.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateRoomResponse {
    private Integer roomId;
    private String  typeCode;   // GLOBAL | EVENT
    private Integer targetId;
    private String  name;
}