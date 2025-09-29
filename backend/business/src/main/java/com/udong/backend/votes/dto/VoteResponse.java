package com.udong.backend.votes.dto;

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
public class VoteResponse {
    private Integer id;
    private String title;
    private String description;
    private LocalDateTime endsAt;
    private Boolean multiSelect;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private String createdByName;
    private Integer chatRoomId;
    private String chatRoomName;
    private Integer clubId;
    private Boolean isExpired;
    private Boolean canParticipate;
    private Boolean hasParticipated; // 현재 사용자가 참여했는지 여부
    private Long totalParticipants; // 총 참여자 수 (4명)
    private Long totalChatMembers; // 채팅방 전체 멤버 수 (24명) - 추가 필요
    private Double participationRate; // 참여율 (17%) - 추가 필요
    private Long totalVotes; // 추가: 모든 옵션의 투표 수 합계
    private List<VoteOptionResponse> options;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoteOptionResponse {
        private Integer id;
        private String text;
        private Long voteCount; // 총 투표 수 (실제로는 optionCount의 합)
        private Double percentage; // 투표 비율
        private Boolean isSelected; // 현재 사용자가 선택했는지 여부
        private Integer myVoteCount; // 현재 사용자가 이 옵션에 투표한 수량
    }
}