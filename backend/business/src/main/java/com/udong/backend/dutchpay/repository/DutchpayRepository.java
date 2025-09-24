package com.udong.backend.dutchpay.repository;

import com.udong.backend.dutchpay.dto.DutchpayListResponse;
import com.udong.backend.dutchpay.entity.Dutchpay;
import com.udong.backend.users.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DutchpayRepository extends JpaRepository<Dutchpay, Integer> {

    @Query("SELECT new com.udong.backend.dutchpay.dto.DutchpayListResponse(" +
            "d.id, d.createdAt, d.note, d.amount, COUNT(dp), d.event.id, e.title, d.isDone) " +
            "FROM Dutchpay d " +
            "JOIN d.participants dp " +
            "JOIN d.event e " +
            "WHERE dp.user.id = :userId " +
            "AND e.club.id = :clubId " +
            "GROUP BY d.id, d.createdAt, d.note, d.amount, d.event.id, e.title, d.isDone")
    List<DutchpayListResponse> findSummaryByUserIdAndClubId(@Param("userId") Integer userId, @Param("clubId") Integer clubId);


    // 상세 조회 시 event, createdBy, participants.user 를 한 방에 가져오기
    @EntityGraph(attributePaths = {"event", "createdBy", "participants.user"})
    Optional<Dutchpay> findWithAllById(Integer id);
}
