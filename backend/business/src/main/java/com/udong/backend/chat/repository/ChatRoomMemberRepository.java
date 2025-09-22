package com.udong.backend.chat.repository;

import com.udong.backend.chat.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatRoomMemberRepository extends JpaRepository<ChatMember, Integer> {
    boolean existsByChat_IdAndUser_Id(Integer chatId, Integer userId);
    // 특정 채팅방의 멤버 수 조회
    Long countByChatId(Integer chatId);
    // 특정 채팅방의 모든 멤버 조회
    List<ChatMember> findByChatId(Integer chatId);

    /** JPQL Projection: chat_id에 속한 모든 멤버의 userId와 name을 가져온다. */
    interface MemberView {
        Integer getUserId();
        String getName();
    }

    @Query("""
        select u.id as userId, u.name as name
        from ChatMember m
          join m.user u
        where m.chat.id = :chatId
        order by m.joinedAt asc
    """)
    List<MemberView> findMemberViewsByChatId(Integer chatId);
}
