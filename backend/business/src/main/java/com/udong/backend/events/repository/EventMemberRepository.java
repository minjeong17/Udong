package com.udong.backend.events.repository;

import com.udong.backend.events.entity.EventMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventMemberRepository extends JpaRepository<EventMember, Integer> {

    // 이벤트-유저 존재 여부
    boolean existsByEvent_IdAndUser_Id(Integer eventId, Integer userId);
}