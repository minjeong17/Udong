package com.udong.backend.chat.repository;

import com.udong.backend.chat.dto.ChatMessageDto;
import com.udong.backend.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    // DTO 프로젝션으로 바로 뽑아서 Lazy 문제 제거
    @Query("""
        select new com.udong.backend.chat.dto.ChatMessageDto(
            m.id,
            r.id,
            u.id,
            u.name,
            m.content,
            m.createdAt
        )
        from ChatMessage m
        join m.chat r
        join m.sender u
        where r.id = :roomId
        order by m.id desc
    """)
    List<ChatMessageDto> findRecentDtos(@Param("roomId") Integer roomId, Pageable pageable);
}
