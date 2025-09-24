package com.udong.backend.votes.repository;

import com.udong.backend.votes.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Integer> {

    // 동아리 내 사용자가 속한 채팅방의 투표 목록 조회
    @Query("SELECT v FROM Vote v JOIN v.chatRoom.members cm WHERE v.club.id = :clubId AND cm.user.id = :userId ORDER BY v.createdAt DESC")
    List<Vote> findByClubAndUserMembership(@Param("clubId") Integer clubId, @Param("userId") Integer userId);

    // 채팅방의 투표 목록 조회 (생성일시 내림차순)
    @Query("SELECT v FROM Vote v WHERE v.chatRoom.id = :chatRoomId ORDER BY v.createdAt DESC")
    List<Vote> findByChatRoomIdOrderByCreatedAtDesc(@Param("chatRoomId") Integer chatRoomId);

    // 활성 투표 목록 조회 (마감시간이 현재시간보다 이후인 것들)
    @Query("SELECT v FROM Vote v WHERE v.chatRoom.id = :chatRoomId AND v.endsAt > :now ORDER BY v.createdAt DESC")
    List<Vote> findActiveByChatRoomId(@Param("chatRoomId") Integer chatRoomId, @Param("now") LocalDateTime now);

    // 투표와 옵션을 함께 조회
    @Query("SELECT v FROM Vote v LEFT JOIN FETCH v.options WHERE v.id = :voteId")
    Optional<Vote> findByIdWithOptions(@Param("voteId") Integer voteId);

    // 특정 사용자가 생성한 투표 목록
    List<Vote> findByCreatedByOrderByCreatedAtDesc(Integer createdBy);

    // 마감된 투표인지 확인
    @Query("SELECT CASE WHEN v.endsAt <= :now THEN true ELSE false END FROM Vote v WHERE v.id = :voteId")
    Boolean isVoteExpired(@Param("voteId") Integer voteId, @Param("now") LocalDateTime now);
}
