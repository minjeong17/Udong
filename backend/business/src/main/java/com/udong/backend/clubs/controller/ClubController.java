package com.udong.backend.clubs.controller;

import com.udong.backend.clubs.dto.InviteDtos;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Membership;
import com.udong.backend.clubs.service.ClubService;
import com.udong.backend.clubs.dto.ClubDtos.*;
import com.udong.backend.global.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/v1/clubs")
@RequiredArgsConstructor
public class ClubController {
    private final ClubService clubs;

    @PostMapping
    public ResponseEntity<ApiResponse<Res>> create(
            @RequestBody @Valid CreateReq req,
            // A안: 프린시펄의 id 프로퍼티가 있을 때 (ex. AuthUser.getId())
            @AuthenticationPrincipal String userIdStr
    ) {

        Integer userId = Integer.valueOf(userIdStr);

        Club c = clubs.create(
                req.name(),
                req.category(),
                req.description(),
                userId,                       // ★ 서버가 리더를 강제 지정
                req.accountNumber()
        );

        String masked = clubs.getMaskedAccount(c.getId());
        Res body = new Res(
                c.getId(), c.getName(), c.getCategory(), c.getDescription(),
                c.getCodeUrl(), c.getActiveMascot()==null?null:c.getActiveMascot().getId(),
                masked
        );
        return ResponseEntity.status(201).body(ApiResponse.ok(body));
    }


    @GetMapping("/{clubId}")
    public ResponseEntity<ApiResponse<Res>> get(@PathVariable Integer clubId){
        Club c = clubs.get(clubId);
        String masked = clubs.getMaskedAccount(clubId);

        Res body = new Res(
                c.getId(), c.getName(), c.getCategory(), c.getDescription(),
                c.getCodeUrl(), c.getActiveMascot()==null?null:c.getActiveMascot().getId(),
                masked
        );
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    @PutMapping("/{clubId}")
    public ResponseEntity<ApiResponse<Res>> update(@PathVariable Integer clubId, @RequestBody @Valid UpdateReq req){
        Club c = clubs.update(clubId, req.name(), req.category(), req.description());
        String masked = clubs.getMaskedAccount(clubId);

        Res body = new Res(
                c.getId(), c.getName(), c.getCategory(), c.getDescription(),
                c.getCodeUrl(), c.getActiveMascot()==null?null:c.getActiveMascot().getId(),
                masked
        );
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    @DeleteMapping("/{clubId}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Integer clubId){
        clubs.delete(clubId);
        return ResponseEntity.ok(ApiResponse.ok("deleted"));
    }

    @PostMapping("/{clubId}/invite-code:reissue")
    public ResponseEntity<ApiResponse<InviteCodeRes>> reissue(@PathVariable Integer clubId){
        String code = clubs.reissueInviteCode(clubId);
        return ResponseEntity.ok(ApiResponse.ok(new InviteCodeRes(code)));
    }

    /** 초대코드로 가입: JWT의 userId를 principal로 받는다 */
    @PostMapping("/join-by-code")
    public ResponseEntity<ApiResponse<InviteDtos.JoinRes>> joinByCode(
            @RequestBody @Valid JoinByCodeReq req,
            @AuthenticationPrincipal String userIdStr
    ) {
        if (userIdStr == null || userIdStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        final Integer userId;
        try {
            userId = Integer.parseInt(userIdStr);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 사용자 식별자");
        }

        Membership m = clubs.joinByCode(req.code(), userId);

        InviteDtos.MembershipRes memRes = new InviteDtos.MembershipRes(
                m.getClub().getId(),
                m.getUserId(),
                m.getRoleCode(),
                clubs.toIsoKST(m.getCreatedAt())
        );
        return ResponseEntity.ok(ApiResponse.ok(new InviteDtos.JoinRes(memRes)));
    }
}
