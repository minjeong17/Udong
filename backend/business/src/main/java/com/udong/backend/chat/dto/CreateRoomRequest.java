package com.udong.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateRoomRequest {
    /** "GLOBAL" | "EVENT" (code_detail.code_name) */
    @NotBlank private String typeCode;

    /** GLOBAL이면 club_id, EVENT면 event_id */
    @NotNull private Integer targetId;

    /** 채팅방 이름 (필요 시 null 허용) */
    @NotBlank private String name;
}