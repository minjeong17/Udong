package com.udong.backend.mypage.repository;

import com.udong.backend.mypage.dto.AvailabilityDto;
import com.udong.backend.mypage.dto.ItemDto;
import com.udong.backend.mypage.dto.MyPageResponse;
import com.udong.backend.users.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MyPageRepository extends Repository<User, Integer> {

    /** 클럽 이름 + 가입일 */
    interface ClubJoinProj {
        String getClubName();                  // ✅ getter
        java.time.LocalDateTime getJoinedAt(); // ✅ getter
    }

    interface ItemProjection {
        Integer getItemId();
        String  getItemName();
        String  getItemDescription();
        Integer getQty();
    }

    interface AvailabilityProjection {
        Integer getDayOfWeek();
        java.time.LocalTime getStartTime();
        java.time.LocalTime getEndTime();
    }

    @Query(value = """
        SELECT c.name AS clubName, m.created_at AS joinedAt
        FROM memberships m
        JOIN clubs c ON c.id = m.club_id
        WHERE m.user_id = :userId AND m.club_id = :clubId
        LIMIT 1
        """, nativeQuery = true)
    Optional<ClubJoinProj> findClubJoin(@Param("userId") Integer userId,
                                        @Param("clubId") Integer clubId);

    /** 포인트 잔액: ledger.delta 합(필요시 curr_point 최신값으로 바꿀 수 있음) */
    @Query(value = """
        SELECT COALESCE(SUM(l.delta), 0)
        FROM user_points_ledger l
        WHERE l.user_id = :userId AND l.club_id = :clubId
        """, nativeQuery = true)
    int findPointBalance(@Param("userId") Integer userId,
                         @Param("clubId") Integer clubId);

    /** 참여 모임 수: event_members 기준 (동아리 필터는 events.club_id로) */
    @Query(value = """
        SELECT COUNT(DISTINCT em.event_id)
        FROM event_members em
        JOIN events e ON e.id = em.event_id
        WHERE em.user_id = :userId
          AND e.club_id = :clubId
        """, nativeQuery = true)
    int countParticipatingEvents(@Param("userId") Integer userId,
                                 @Param("clubId") Integer clubId);

    /** 보유 아이템 목록 */
    @Query(value = """
    SELECT i.id          AS itemId,
           i.name        AS itemName,
           i.description AS itemDescription,
           inv.qty       AS qty
    FROM inventories inv
    JOIN items i ON i.id = inv.item_id
    WHERE inv.user_id = :userId
      AND inv.club_id = :clubId
      AND inv.qty > 0
    ORDER BY i.name ASC
    """, nativeQuery = true)
    List<ItemProjection> findMyItems(@Param("userId") Integer userId,
                                     @Param("clubId") Integer clubId);

    /** 활동 가능 시간 */
    @Query(value = """
        SELECT ua.day_of_week AS dayOfWeek,
               ua.start_time  AS startTime,
               ua.end_time    AS endTime
        FROM user_availability ua
        WHERE ua.user_id = :userId
        ORDER BY ua.day_of_week, ua.start_time
        """, nativeQuery = true)
    List<AvailabilityProjection> findAvailabilities(@Param("userId") Integer userId);
}

