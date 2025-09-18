package com.udong.backend.chat.repository;

import com.udong.backend.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {
    Optional<ChatRoom> findByType_CodeNameIgnoreCaseAndTargetId(String typeCode, Integer targetId);
    boolean existsByType_CodeNameIgnoreCaseAndTargetId(String typeCode, Integer targetId);
}

