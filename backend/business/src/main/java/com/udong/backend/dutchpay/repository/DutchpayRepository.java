package com.udong.backend.dutchpay.repository;

import com.udong.backend.dutchpay.dto.DutchpayListResponse;
import com.udong.backend.dutchpay.entity.Dutchpay;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DutchpayRepository extends JpaRepository<Dutchpay, Integer> {

    @Query("""
    select new com.udong.backend.dutchpay.dto.DutchpayListResponse(
        d.id,
        d.createdAt,
        d.note,
        d.amount,
        (select count(p2) from DutchpayParticipant p2 where p2.dutchpay = d),
        e.id,
        e.title
    )
    from Dutchpay d
      join d.event e
    where d.isDone = :isDone
      and exists (
          select 1
          from DutchpayParticipant p
          where p.dutchpay = d
            and p.user.id = :userId
      )
    order by d.createdAt desc
    """)
    List<DutchpayListResponse> findSummaryByUserAndStatus(
            @Param("userId") Integer userId,
            @Param("isDone") boolean isDone);

    // 상세 조회 시 event, createdBy, participants.user 를 한 방에 가져오기
    @EntityGraph(attributePaths = {"event", "createdBy", "participants.user"})
    Optional<Dutchpay> findWithAllById(Integer id);
}
