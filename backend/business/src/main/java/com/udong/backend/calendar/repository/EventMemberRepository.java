package com.udong.backend.calendar.repository;

import com.udong.backend.calendar.entity.EventMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventMemberRepository extends JpaRepository<EventMember, Integer> {

    // 이벤트-유저 존재 여부
    boolean existsByEvent_IdAndUser_Id(Integer eventId, Integer userId);
}