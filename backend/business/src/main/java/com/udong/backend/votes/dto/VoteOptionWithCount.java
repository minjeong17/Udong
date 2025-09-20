package com.udong.backend.votes.dto;

import com.udong.backend.votes.entity.VoteOption;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteOptionWithCount {
    private VoteOption voteOption;
    private Long voteCount;
}
