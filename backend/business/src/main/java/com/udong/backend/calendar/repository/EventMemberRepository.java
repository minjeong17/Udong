package com.udong.backend.calendar.repository;

import com.udong.backend.calendar.entity.EventMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

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

    Optional<EventMember> findByEvent_IdAndUser_Id(Integer eventId, Integer userId);

    int countByEvent_IdAndIsParticipatedTrue(Integer eventId);

    @Query("select em from EventMember em " +
            "join fetch em.user u " +
            "where em.event.id = :eventId " +
            "order by em.joinedAt asc")
    List<EventMember> findAllWithUserByEventId(@Param("eventId") Integer eventId);

    // 정원 체크 시 동시성 줄이려면 (선택) 비관적 락
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select count(em) from EventMember em where em.event.id = :eventId and em.isParticipated = true")
    long lockAndCountParticipated(@Param("eventId") Integer eventId);

    /** event_members 에서 (event_id, user_id)로 삭제 */
    int deleteByEvent_IdAndUser_Id(Integer eventId, Integer userId);
}