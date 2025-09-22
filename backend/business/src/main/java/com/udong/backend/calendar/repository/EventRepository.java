package com.udong.backend.calendar.repository;

import com.udong.backend.calendar.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Integer> {

    // 달별 조회 (type 파라미터 없음)
    @Query("""
      select e from Event e
      where e.club.id = :clubId
        and e.startAt >= :monthStart and e.startAt < :monthEnd
      order by e.startAt asc
    """)
    List<Event> findMonth(@Param("clubId") Integer clubId,
                          @Param("monthStart") LocalDateTime monthStart,
                          @Param("monthEnd") LocalDateTime monthEnd);

    // 일별 조회 (type 파라미터 없음)
    @Query("""
      select e from Event e
      where e.club.id = :clubId
        and e.startAt >= :dayStart and e.startAt < :dayEnd
      order by e.startAt asc
    """)
    List<Event> findDay(@Param("clubId") Integer clubId,
                        @Param("dayStart") LocalDateTime dayStart,
                        @Param("dayEnd") LocalDateTime dayEnd);

    // D-Day
    @Query("""
      select e from Event e
      where e.club.id = :clubId and e.startAt >= :now
      order by e.startAt asc
    """)
    Page<Event> findUpcoming(@Param("clubId") Integer clubId,
                             @Param("now") LocalDateTime now,
                             Pageable pageable);

    @Query("""
        select cr.targetId
        from ChatRoom cr
        where cr.id = :chatId
          and cr.type.codeName = 'EVENT'
    """)
    Optional<Integer> findEventIdByChatId(@Param("chatId") Integer chatId);

}


