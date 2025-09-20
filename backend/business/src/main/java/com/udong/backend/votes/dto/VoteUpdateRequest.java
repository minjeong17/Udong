package com.udong.backend.votes.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteUpdateRequest {

    @Size(max = 100, message = "투표 제목은 100자를 초과할 수 없습니다")
    private String title;

    @Size(max = 300, message = "투표 설명은 300자를 초과할 수 없습니다")
    private String description;

    @Future(message = "투표 마감일시는 현재 시간보다 이후여야 합니다")
    private LocalDateTime endsAt;
}