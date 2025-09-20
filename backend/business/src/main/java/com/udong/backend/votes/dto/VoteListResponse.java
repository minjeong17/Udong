package com.udong.backend.votes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteListResponse {
    private Integer id;
    private String title;
    private LocalDateTime endsAt;
    private Boolean multiSelect;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private String createdByName;
    private Boolean isExpired;
    private Boolean canParticipate;
    private Boolean hasParticipated;
    private Long totalParticipants;
    private Integer optionCount; // 투표 옵션 개수
}