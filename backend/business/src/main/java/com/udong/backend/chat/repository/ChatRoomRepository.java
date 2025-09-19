package com.udong.backend.chat.repository;

import com.udong.backend.chat.dto.ChatRoomListItem;
import com.udong.backend.chat.entity.ChatRoom;
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
        count(distinct mAll.id)
    )
    from ChatRoom r
        join ChatMember mMine on mMine.chat = r and mMine.user.id = :userId
        left join ChatMember mAll on mAll.chat = r
        left join Event e on (r.type.codeName = 'EVENT' and e.id = r.targetId)
    where
        (r.type.codeName = 'GLOBAL' and r.targetId = :clubId)
        or
        (r.type.codeName = 'EVENT' and e.club.id = :clubId)
    group by r.id, r.name, r.type.codeName, r.targetId
    order by r.createdAt desc
    """)
    List<ChatRoomListItem> findMyRoomsInClub(@Param("userId") Integer userId,
                                             @Param("clubId") Integer clubId);
}

