package com.udong.backend.chat.repository;

import com.udong.backend.chat.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Integer> {
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

    @Query("""
        select m
        from ChatMember m
        join fetch m.user u
        where m.chat.id = :chatId
        order by u.id asc
    """)
    List<ChatMember> findByChatRoomId(@Param("chatId") Integer chatId);

    /** 특정 채팅방의 모든 멤버 ID 조회 (알림 발송용) */
    @Query("""
        select u.id
        from ChatMember m
        join m.user u
        where m.chat.id = :chatId
    """)
    List<Long> findUserIdsByChatId(@Param("chatId") Integer chatId);

    /** chat_members 에서 (chat_id, user_id)로 삭제 */
    int deleteByChat_IdAndUser_Id(Integer chatId, Integer userId);

}
