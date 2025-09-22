package com.udong.backend.clubdues.repository;

import com.udong.backend.clubdues.dto.ClubDuesDtos;
import com.udong.backend.clubdues.entity.ClubDuesStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClubDuesStatusRepository extends JpaRepository<ClubDuesStatus, Integer> {

    // 특정 회비 요청의 모든 회원 납부 상태 조회
    List<ClubDuesStatus> findByDuesId(Integer duesId);

    // 특정 회비 요청의 특정 회원 납부 상태 조회
    Optional<ClubDuesStatus> findByDuesIdAndUserId(Integer duesId, Integer userId);

    // JOIN 쿼리로 회원 정보와 납부 상태 한번에 조회
    @Query("SELECT new com.udong.backend.clubdues.dto.ClubDuesDtos$MemberPaymentInfo(" +
           "cds.userId, u.name, u.email, cds.duesStatus, cds.createdAt) " +
           "FROM ClubDuesStatus cds " +
           "LEFT JOIN User u ON cds.userId = u.id " +
           "WHERE cds.dues.id = :duesId " +
           "ORDER BY cds.userId")
    List<ClubDuesDtos.MemberPaymentInfo> findMemberPaymentInfoByDuesId(@Param("duesId") Integer duesId);

    // 특정 회비 요청의 납부 완료자 수 조회
    @Query("SELECT COUNT(cds) FROM ClubDuesStatus cds WHERE cds.dues.id = :duesId AND cds.duesStatus = 1")
    Long countCompletedByDuesId(@Param("duesId") Integer duesId);

    // 특정 회비 요청의 미납자 수 조회
    @Query("SELECT COUNT(cds) FROM ClubDuesStatus cds WHERE cds.dues.id = :duesId AND cds.duesStatus = 0")
    Long countUnpaidByDuesId(@Param("duesId") Integer duesId);

    // 특정 회비 요청의 미납자 목록 조회
    @Query("SELECT cds FROM ClubDuesStatus cds WHERE cds.dues.id = :duesId AND cds.duesStatus = 0")
    List<ClubDuesStatus> findUnpaidByDuesId(@Param("duesId") Integer duesId);

    // 특정 사용자의 특정 동아리 미납 회비 목록 조회
    @Query("SELECT cds FROM ClubDuesStatus cds " +
           "JOIN FETCH cds.dues d " +
           "WHERE cds.userId = :userId AND d.club.id = :clubId AND cds.duesStatus = 0 " +
           "ORDER BY d.duesNo DESC")
    List<ClubDuesStatus> findUnpaidByUserIdAndClubId(@Param("userId") Integer userId, @Param("clubId") Integer clubId);
}