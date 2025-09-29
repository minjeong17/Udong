package com.udong.backend.chat.repository;

import com.udong.backend.chat.dto.ChatRoomListItem;
import com.udong.backend.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {
    Optional<ChatRoom> findByType_CodeNameIgnoreCaseAndTargetId(String typeCode, Integer targetId);
    boolean existsByType_CodeNameIgnoreCaseAndTargetId(String typeCode, Integer targetId);


    @Query("""
        select new com.udong.backend.chat.dto.ChatRoomListItem(
          r.id,
          r.name,
          r.type.codeName,
          r.targetId,
          (select count(m.id) from ChatMember m where m.chat.id = r.id),
          r.createdBy.id
        )
        from ChatRoom r
        where
          exists (
            select 1 from ChatMember m2
            where m2.chat = r and m2.user.id = :userId
          )
          and (
            (r.type.codeName = 'GLOBAL' and r.targetId = :clubId)
            or
            (r.type.codeName = 'EVENT' and exists (
               select 1 from Event e
               where e.id = r.targetId and e.club.id = :clubId
            ))
          )
        order by r.id desc
    """)
    List<ChatRoomListItem> findMyRoomsInClub(@Param("userId") Integer userId,
                                             @Param("clubId") Integer clubId);



    @Query("select c from ChatRoom c join fetch c.type where c.id = :chatId")
    Optional<ChatRoom> findByIdWithType(@Param("chatId") Integer chatId);

    @Query("""
        select cr
        from ChatRoom cr
        join fetch cr.createdBy
        where cr.id = :chatId
    """)
    Optional<ChatRoom> findWithCreatorById(@Param("chatId") Integer chatId);

}

