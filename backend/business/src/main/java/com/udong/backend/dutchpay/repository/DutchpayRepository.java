package com.udong.backend.dutchpay.repository;

import com.udong.backend.dutchpay.dto.DutchpayListResponse;
import com.udong.backend.dutchpay.entity.Dutchpay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
            @Param("userId") Long userId,
            @Param("isDone") boolean isDone);


    // 유저가 '참여자'로 들어가 있고 isDone = false (열린 정산)
    @Query("""
           select distinct d
           from Dutchpay d
             join d.participants p
           where p.user.id = :userId
             and d.isDone = false
           order by d.createdAt desc
           """)
    List<Dutchpay> findOpenByParticipantUserId(@Param("userId") Long userId);

    // 유저가 '참여자'로 들어가 있고 isDone = true (완료 정산)
    @Query("""
           select distinct d
           from Dutchpay d
             join d.participants p
           where p.user.id = :userId
             and d.isDone = true
           order by d.createdAt desc
           """)
    List<Dutchpay> findCompletedByParticipantUserId(@Param("userId") Long userId);
}
