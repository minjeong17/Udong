package com.udong.backend.clubs.authz;

import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberAuthz {
    private final ClubRepository clubs;
    private final MembershipRepository memberships;

    public void requireLeader(Long rawClubId, Integer userId) {
        Integer clubId = Math.toIntExact(rawClubId);

        var club = clubs.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 디버그 로그(필수)
        log.info("AUTHZ check clubId={}, tokenUserId={}, club.leader={}",
                clubId, userId, club.getLeaderUserId());
        memberships.findByClub_IdAndUserId(clubId, userId)
                .ifPresent(m -> log.info("AUTHZ membership role_code={}", m.getRoleCode()));

        // 1) 클럽의 공식 회장
        if (Objects.equals(club.getLeaderUserId(), userId)) return;

        // 2) 멤버십이 LEADER면 역시 통과
        boolean isLeaderByRole = memberships.findByClub_IdAndUserId(clubId, userId)
                .map(m -> "LEADER".equals(m.getRoleCode()))
                .orElse(false);
        if (isLeaderByRole) return;

        // 둘 다 아니면 금지
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "회장 전용 기능입니다.");
    }
}
