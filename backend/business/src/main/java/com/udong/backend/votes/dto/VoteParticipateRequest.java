package com.udong.backend.votes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteParticipateRequest {

    @Valid
    @NotEmpty(message = "선택한 옵션이 없습니다")
    private List<VoteSelectionRequest> selections;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteSelectionRequest {
        @NotNull(message = "투표 옵션 ID는 필수입니다")
        private Integer voteOptionId;

        @NotNull(message = "투표 수량은 필수입니다")
        @Positive(message = "투표 수량은 1 이상이어야 합니다")
        private Integer optionCount;
    }
}