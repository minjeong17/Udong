package com.udong.backend.votes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteCreateRequest {

    @NotBlank(message = "투표 제목은 필수입니다")
    @Size(max = 100, message = "투표 제목은 100자를 초과할 수 없습니다")
    private String title;

    @Size(max = 300, message = "투표 설명은 300자를 초과할 수 없습니다")
    private String description;

    @NotNull(message = "투표 마감일시는 필수입니다")
    @Future(message = "투표 마감일시는 현재 시간보다 이후여야 합니다")
    private LocalDateTime endsAt;

    @NotNull(message = "다중 선택 여부는 필수입니다")
    private Boolean multiSelect;

    @Valid
    @NotEmpty(message = "투표 옵션은 최소 2개 이상이어야 합니다")
    @Size(min = 2, max = 10, message = "투표 옵션은 2개 이상 10개 이하여야 합니다")
    private List<VoteOptionRequest> options;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteOptionRequest {
        @NotBlank(message = "투표 옵션 내용은 필수입니다")
        @Size(max = 100, message = "투표 옵션 내용은 100자를 초과할 수 없습니다")
        private String text;
    }
}
