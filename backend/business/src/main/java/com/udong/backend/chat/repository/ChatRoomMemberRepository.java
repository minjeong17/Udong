package com.udong.backend.chat.repository;

import com.udong.backend.chat.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomMemberRepository extends JpaRepository<ChatMember, Integer> {
    boolean existsByChat_IdAndUser_Id(Integer chatId, Integer userId);
}
