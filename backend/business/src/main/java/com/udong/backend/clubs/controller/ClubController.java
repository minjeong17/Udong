package com.udong.backend.clubs.controller;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.service.ClubService;
import com.udong.backend.clubs.dto.ClubDtos.*;
import com.udong.backend.global.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/clubs")
@RequiredArgsConstructor
public class ClubController {
    private final ClubService clubs;

    @PostMapping
    public ResponseEntity<com.udong.backend.global.dto.response.ApiResponse<Res>> create(@RequestBody @Valid CreateReq req){
        Club c = clubs.create(req.name(), req.category(), req.description(), req.leaderUserId(), req.accountNumber());
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
}
