package com.udong.backend.clubdues.repository;

import com.udong.backend.clubdues.entity.ClubDues;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClubDuesRepository extends JpaRepository<ClubDues, Integer> {

    // 특정 동아리의 모든 회비 요청 조회 (드롭다운용)
    List<ClubDues> findByClubIdOrderByDuesNoDesc(Integer clubId);

    // 특정 동아리의 특정 차수 회비 요청 조회
    Optional<ClubDues> findByClubIdAndDuesNo(Integer clubId, Integer duesNo);

    // 특정 동아리의 최대 차수 조회 (현재 차수 확인용)
    @Query("SELECT COALESCE(MAX(cd.duesNo), 0) FROM ClubDues cd WHERE cd.club.id = :clubId")
    Integer findMaxDuesNoByClubId(@Param("clubId") Integer clubId);
}