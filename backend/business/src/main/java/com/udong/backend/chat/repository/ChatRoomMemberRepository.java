package com.udong.backend.chat.repository;

import com.udong.backend.chat.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomMemberRepository extends JpaRepository<ChatMember, Integer> {
    boolean existsByChat_IdAndUser_Id(Integer chatId, Integer userId);
    // 특정 채팅방의 멤버 수 조회
    Long countByChatId(Integer chatId);
    // 특정 채팅방의 모든 멤버 조회
    List<ChatMember> findByChatId(Integer chatId);
}
