package com.udong.backend.calendar.authz;

import com.udong.backend.calendar.entity.Event;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EventAuthz {

    private final MembershipRepository memberships;
    private final ClubRepository clubs;

    public boolean canCreate(Long rawClubId, Long userId, String eventType) {
        Integer clubId = Math.toIntExact(rawClubId);
        Integer userIdInt = Math.toIntExact(userId);

        // 1) 먼저 '해당 동아리 회원'인지 확인 (비회원이면 무조건 불가)
        boolean isMember = memberships.existsByUserIdAndClub_Id(userIdInt, clubId);
        if (!isMember) return false;

        // 2) LIGHTNING은 '회원이면' 가능
        if ("LIGHTNING".equalsIgnoreCase(eventType)) return true;

        // 3) REGULAR/MT는 OWNER(=club.leader_user_id) 또는 LEADER만
        boolean isOwner = clubs.findById(clubId)
                .map(c -> Long.valueOf(c.getLeaderUserId()).equals(userId))
                .orElse(false);

        boolean isLeader = memberships.findByClub_IdAndUserId(clubId, userIdInt)
                .map(m -> "LEADER".equalsIgnoreCase(m.getRoleCode()))
                .orElse(false);

        return isOwner || isLeader;
    }

    public boolean canEdit(Event e, Long userId) {
        return e.getCreatedBy() != null
                && userId != null
                && userId.equals(e.getCreatedBy().getId());
    }

    public boolean canView(Long rawClubId, Long userId) {
        Integer clubId = Math.toIntExact(rawClubId);
        Integer userIdInt = Math.toIntExact(userId);
        return memberships.existsByUserIdAndClub_Id(userIdInt, clubId);
    }
}
