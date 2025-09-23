package com.udong.backend.calendar.repository;

import com.udong.backend.calendar.entity.EventMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventMemberRepository extends JpaRepository<EventMember, Integer> {

    // 이벤트-유저 존재 여부
    boolean existsByEvent_IdAndUser_Id(Integer eventId, Integer userId);

    @Query("select count(em) from EventMember em where em.event.id = :eventId")
    int countByEventId(@Param("eventId") Integer eventId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EventMember em set em.isParticipated = false where em.event.id = :eventId")
    int markAllFalseByEventId(@Param("eventId") Integer eventId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EventMember em set em.isParticipated = true " +
            "where em.event.id = :eventId and em.user.id in :userIds")
    int markTrueByEventIdAndUserIds(@Param("eventId") Integer eventId,
                                    @Param("userIds") List<Integer> userIds);

    /** event_members 에서 (event_id, user_id)로 삭제 */
    int deleteByEvent_IdAndUser_Id(Integer eventId, Integer userId);
}