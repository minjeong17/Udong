package com.udong.backend.dutchpay.controller;

import com.udong.backend.dutchpay.dto.*;
import com.udong.backend.dutchpay.service.DutchpayService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/dutchpay")
public class DutchpayController {

    private final DutchpayService dutchpayService;
    private final SecurityUtils securityUtils;

    /** 정산 생성 */
    @PostMapping(
            value = "/{chatId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<?>> createDutchpay(
            @PathVariable Integer chatId,
            @RequestPart(name = "receipt", required = false) MultipartFile receipt,
            @RequestParam(required = false) String note,
            @RequestParam Integer amount,
            @RequestParam("participantUserIds") List<Integer> participantUserIds
    ) {
        Integer userId = securityUtils.currentUserId();

        // DTO로 묶고 서비스 호출
        CreateDutchpayRequest req = CreateDutchpayRequest.builder()
                .amount(amount)
                .note(note)
                .participantUserIds(participantUserIds)
                .build();

        dutchpayService.createWithOptionalImage(chatId, req, userId, receipt);
        return ResponseEntity.ok(ApiResponse.ok("정산 생성 완료"));
    }

    /** 내 정산 목록 조회: GET /api/v1/dutchpay */
    @GetMapping("/{clubId}")
    public ResponseEntity<ApiResponse<List<DutchpayListResponse>>> getMyDutchpays(@PathVariable Integer clubId) {
        Integer userId = securityUtils.currentUserId();

        List<DutchpayListResponse> list = dutchpayService.findByUser(userId, clubId);

        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/detail/{dutchPayId}")
    public ResponseEntity<ApiResponse<DutchpayDetailResponse>> getDetail(@PathVariable int dutchPayId) {
        DutchpayDetailResponse body = dutchpayService.getDetail(dutchPayId);
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    /** 정산하기 (출금자 → 입금자) */
    @PostMapping("/{dutchpayId}/pay")
    public ResponseEntity<ApiResponse<PayResponse>> pay(
            @PathVariable Integer dutchpayId,
            @RequestBody PayRequest req
    ) {
        Integer currentUserId = securityUtils.currentUserId();
        PayResponse result = dutchpayService.pay(dutchpayId, currentUserId, req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 정산 삭제 */
    @DeleteMapping("/{dutchpayId}")
    public ResponseEntity<ApiResponse<?>> deleteDutchpay(@PathVariable Integer dutchpayId) {
        Integer currentUserId = securityUtils.currentUserId();
        dutchpayService.deleteDutchpay(dutchpayId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("정산 삭제 완료"));
    }

    /** 정산 종료 */
    @PutMapping("/{dutchpayId}")
    public ResponseEntity<ApiResponse<?>> dutchpayDone(@PathVariable Integer dutchpayId) {
        Integer currentUserId = securityUtils.currentUserId();
        dutchpayService.dutchpayDone(dutchpayId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("정산 종료 완료"));
    }

}