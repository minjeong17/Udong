package com.udong.backend.clubs.service;

import com.udong.backend.clubs.authz.MemberAuthz;
import com.udong.backend.clubs.dto.MemberDtos;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Membership;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.codes.repository.CodeDetailRepository;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberAdminService {
    private final MembershipRepository memberships;
    private final CodeDetailRepository codes;
    private final ClubRepository clubs;
    private final UserRepository users;
    private final MemberAuthz authz; // 신규 Authz

    @Transactional(readOnly = true)
    public List<MemberDtos.Row> listAll(Long rawClubId, Integer actorId, String q, String role) {
        authz.requireLeader(rawClubId, actorId);
        Integer clubId = Math.toIntExact(rawClubId);

        List<Membership> list = memberships.searchAllByClub(clubId, q, role); // 아래 레포 추가
        return list.stream().map(m -> {
            var u = users.findById(m.getUserId()).orElseThrow();
            return new MemberDtos.Row(
                    m.getId(), u.getId(), u.getName(), u.getPhone(), u.getEmail(),
                    u.getGender()==null?null:u.getGender().name(),
                    u.getUniversity(), u.getMajor(), u.getResidence(),
                    m.getRoleCode(), ClubService.toIsoKST(m.getCreatedAt())
            );
        }).toList();
    }

    public Page<MemberDtos.Row> list(Long rawClubId, Integer actorId,
                                     int page, int size, String q, String role) {
        authz.requireLeader(rawClubId, actorId);
        Integer clubId = Math.toIntExact(rawClubId);

        Page<Membership> pageRes =
                memberships.searchByClub(clubId, q, role, PageRequest.of(page, size));

        return pageRes.map(m -> {
            var u = users.findById(m.getUserId()).orElseThrow();
            return new MemberDtos.Row(
                    m.getId(), u.getId(), u.getName(), u.getPhone(), u.getEmail(),
                    u.getGender()==null?null:u.getGender().name(),
                    u.getUniversity(), u.getMajor(), u.getResidence(),
                    m.getRoleCode(),
                    ClubService.toIsoKST(m.getCreatedAt())
            );
        });
    }

    public void changeRole(Long rawClubId, Integer actorId, Integer memberId, String toRole) {
        authz.requireLeader(rawClubId, actorId);
        Integer clubId = Math.toIntExact(rawClubId);

        // 코드 존재 검증 (group 'memberships')
        codes.findByCodeGroup_GroupNameAndCodeNameAndIsUseTrue("memberships", toRole)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid role"));

        Membership target = memberships.findByIdAndClub_Id(memberId, clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 마지막 리더 보호
        if ("LEADER".equals(target.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "마지막 리더는 변경할 수 없습니다. 회장 위임을 사용하세요.");
        }
        target.setRoleCode(toRole);
    }

    public void kick(Long rawClubId, Integer actorId, Integer memberId, String reason) {
        authz.requireLeader(rawClubId, actorId);
        Integer clubId = Math.toIntExact(rawClubId);

        Membership target = memberships.findByIdAndClub_Id(memberId, clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if ("LEADER".equals(target.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "리더는 제명할 수 없습니다. 회장 위임 후 처리하세요.");
        }
        memberships.delete(target); // 현재 스키마는 상태필드가 없어 하드삭제
        // ⚠️ 추후 소프트삭제 필요 시 status/leftAt 필드 추가 권장
    }

    @Transactional
    public void transferLeaderByUserId(Long rawClubId, Integer actorId, Integer targetUserId) {
        authz.requireLeader(rawClubId, actorId);
        Integer clubId = Math.toIntExact(rawClubId);

        Club club = clubs.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Membership curLeader = memberships.findByClub_IdAndUserId(clubId, club.getLeaderUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "리더 멤버십 없음"));

        Membership target = memberships.findByClub_IdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "대상 멤버 없음"));

        if (Objects.equals(target.getUserId(), club.getLeaderUserId())) {
            return; // 이미 리더면 no-op
        }

        curLeader.setRoleCode("MANAGER");
        target.setRoleCode("LEADER");
        club.setLeaderUserId(targetUserId);
    }

}
