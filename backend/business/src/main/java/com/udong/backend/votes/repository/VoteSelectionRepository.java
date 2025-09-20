package com.udong.backend.votes.repository;

import com.udong.backend.votes.entity.VoteSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteSelectionRepository extends JpaRepository<VoteSelection, Integer> {

    // 특정 사용자가 특정 투표에서 한 선택들 조회
    List<VoteSelection> findByVoteIdAndUserId(Integer voteId, Integer userId);

    // 특정 사용자가 특정 옵션을 선택했는지 확인
    Optional<VoteSelection> findByVoteIdAndUserIdAndVoteOptionId(
            Integer voteId, Integer userId, Integer voteOptionId);

    // 특정 투표의 전체 선택 조회
    @Query("SELECT vs FROM VoteSelection vs " +
            "LEFT JOIN FETCH vs.voteOption " +
            "WHERE vs.vote.id = :voteId " +
            "ORDER BY vs.createdAt")
    List<VoteSelection> findByVoteIdWithOptions(@Param("voteId") Integer voteId);

    // 투표별 총 참여자 수 조회
    @Query("SELECT COUNT(DISTINCT vs.userId) FROM VoteSelection vs WHERE vs.vote.id = :voteId")
    Long countDistinctUsersByVoteId(@Param("voteId") Integer voteId);

    // 옵션별 총 투표 수 (optionCount 합계)
    @Query("SELECT SUM(vs.optionCount) FROM VoteSelection vs WHERE vs.voteOption.id = :optionId")
    Long sumOptionCountByOptionId(@Param("optionId") Integer optionId);

    // 사용자가 투표에 참여했는지 확인
    boolean existsByVoteIdAndUserId(Integer voteId, Integer userId);

    // 특정 투표의 총 투표 수 (모든 optionCount의 합)
    @Query("SELECT SUM(vs.optionCount) FROM VoteSelection vs WHERE vs.vote.id = :voteId")
    Long sumTotalOptionCountByVoteId(@Param("voteId") Integer voteId);
}