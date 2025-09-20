package com.udong.backend.votes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteStatsResponse {
    private Integer voteId;
    private Long totalParticipants; // 참여한 사람 수
    private Long totalChatMembers; // 채팅방 전체 멤버 수
    private Double participationRate; // 참여율
    private Long totalVotes; // 총 투표 수 (모든 옵션의 optionCount 합)
}
