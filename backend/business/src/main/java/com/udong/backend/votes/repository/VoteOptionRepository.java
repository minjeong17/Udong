package com.udong.backend.votes.repository;

import com.udong.backend.votes.dto.VoteOptionWithCount;
import com.udong.backend.votes.entity.VoteOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteOptionRepository extends JpaRepository<VoteOption, Integer> {

    // 특정 투표의 옵션들 조회
    List<VoteOption> findByVoteIdOrderByCreatedAt(Integer voteId);

    // VoteOptionRepository.java에 추가
    @Query("SELECT new com.udong.backend.votes.dto.VoteOptionWithCount(vo, COALESCE(SUM(vs.optionCount), 0)) " +
            "FROM VoteOption vo " +
            "LEFT JOIN VoteSelection vs ON vo.id = vs.voteOption.id " +
            "WHERE vo.vote.id = :voteId " +
            "GROUP BY vo.id " +
            "ORDER BY vo.createdAt")
    List<VoteOptionWithCount> findOptionsWithVoteCount(@Param("voteId") Integer voteId);
}