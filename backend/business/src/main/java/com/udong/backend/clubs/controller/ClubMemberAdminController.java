package com.udong.backend.clubs.controller;

import com.udong.backend.clubs.dto.MemberDtos;
import com.udong.backend.clubs.service.MemberAdminService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/clubs/{clubId}/members")
public class ClubMemberAdminController {
    private final MemberAdminService members; // 신규 서비스
    private final SecurityUtils securityUtils;

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MemberDtos.Row>>> listAll(
            @PathVariable Long clubId,
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String role) {
        Integer uid = securityUtils.currentUserId();
        List<MemberDtos.Row> rows = members.listAll(clubId, uid, q, role);
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MemberDtos.Row>>> list(@PathVariable Long clubId,
                                                  @RequestParam(defaultValue="0") int page,
                                                  @RequestParam(defaultValue="20") int size,
                                                  @RequestParam(required=false) String q,
                                                  @RequestParam(required=false) String role) {
        Integer userId = securityUtils.currentUserId();
        return ResponseEntity.ok(ApiResponse.ok(members.list(clubId, userId, page, size, q, role)));
    }

    // 역할 변경 (LEADER/ MANAGER/ MEMBER)
    @PostMapping("/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(@PathVariable Long clubId,
                                                        @RequestBody @Valid MemberDtos.ChangeRoleReq req) {
        Integer uid = securityUtils.currentUserId();
        members.changeRole(clubId, uid, req.memberId(), req.role());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // 제명(탈퇴 처리)
    @DeleteMapping("/{memberId}")
    public ResponseEntity<ApiResponse<Void>> kick(@PathVariable Long clubId, @PathVariable Integer memberId,
                                  @RequestBody(required=false) MemberDtos.ReasonReq body) {
        Integer uid = securityUtils.currentUserId();
        members.kick(clubId, uid, memberId, body==null?null:body.reason());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // 회장 위임 (대상에게 LEADER 부여 + 기존 LEADER 강등)
    @PostMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> transferLeader(
            @PathVariable("clubId") Long clubId,
            @PathVariable("userId") Integer userId) {
        Integer actorId = securityUtils.currentUserId();
        members.transferLeaderByUserId(clubId, actorId, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

}

