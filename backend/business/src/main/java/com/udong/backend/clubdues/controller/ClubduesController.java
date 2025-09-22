package com.udong.backend.clubdues.controller;

import com.udong.backend.clubdues.dto.ClubDuesDtos;
import com.udong.backend.clubdues.service.ClubDuesService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/clubs/{clubId}/clubdues")
@RequiredArgsConstructor
public class ClubduesController {

    private final ClubDuesService clubDuesService;
    private final SecurityUtils securityUtils;

    // 1. 새로운 회비 요청 생성
    @PostMapping
    public ResponseEntity<ApiResponse<ClubDuesDtos.CreateDuesResponse>> createDues(
            @PathVariable Integer clubId,
            @RequestBody ClubDuesDtos.CreateDuesRequest request) {

        Integer currentUserId = securityUtils.currentUserId();
        ClubDuesDtos.CreateDuesResponse response = clubDuesService.createDues(clubId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 2. 동아리 회비 요청 목록 조회 (드롭다운용)
    @GetMapping
    public ResponseEntity<ApiResponse<ClubDuesDtos.DuesListResponse>> getDuesList(
            @PathVariable Integer clubId) {

        ClubDuesDtos.DuesListResponse response = clubDuesService.getDuesList(clubId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 3. 특정 회차 납부 현황 조회
    @GetMapping("/{duesNo}/status")
    public ResponseEntity<ApiResponse<ClubDuesDtos.DuesStatusResponse>> getDuesStatus(
            @PathVariable Integer clubId,
            @PathVariable Integer duesNo) {

        ClubDuesDtos.DuesStatusResponse response = clubDuesService.getDuesStatus(clubId, duesNo);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 4. 개별 회원 납부 상태 변경
    @PatchMapping("/{duesId}/status/{userId}")
    public ResponseEntity<ApiResponse<ClubDuesDtos.UpdatePaymentStatusResponse>> updatePaymentStatus(
            @PathVariable Integer clubId,
            @PathVariable Integer duesId,
            @PathVariable Integer userId,
            @RequestBody ClubDuesDtos.UpdatePaymentStatusRequest request) {

        ClubDuesDtos.UpdatePaymentStatusResponse response =
                clubDuesService.updatePaymentStatus(clubId, duesId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 5. 현재 진행 중인 최신 회차 정보 조회
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<ClubDuesDtos.CurrentDuesResponse>> getCurrentDues(
            @PathVariable Integer clubId) {

        ClubDuesDtos.CurrentDuesResponse response = clubDuesService.getCurrentDues(clubId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 6. 납부 통계 요약 조회
    @GetMapping("/{duesId}/summary")
    public ResponseEntity<ApiResponse<ClubDuesDtos.DuesSummaryResponse>> getDuesSummary(
            @PathVariable Integer clubId,
            @PathVariable Integer duesId) {

        ClubDuesDtos.DuesSummaryResponse response = clubDuesService.getDuesSummary(clubId, duesId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 7. 미납자 알림 전송
    @PostMapping("/{duesId}/notify-unpaid")
    public ResponseEntity<ApiResponse<Void>> notifyUnpaidMembers(
            @PathVariable Integer clubId,
            @PathVariable Integer duesId) {

        Integer currentUserId = securityUtils.currentUserId();
        clubDuesService.notifyUnpaidMembers(clubId, duesId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // 8. 현재 사용자의 미납 회비 목록 조회
    @GetMapping("/my-unpaid")
    public ResponseEntity<ApiResponse<ClubDuesDtos.MyUnpaidDuesResponse>> getMyUnpaidDues(
            @PathVariable Integer clubId) {

        Integer currentUserId = securityUtils.currentUserId();
        ClubDuesDtos.MyUnpaidDuesResponse response = clubDuesService.getMyUnpaidDues(clubId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
