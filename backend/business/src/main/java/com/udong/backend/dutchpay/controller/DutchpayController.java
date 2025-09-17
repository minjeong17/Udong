package com.udong.backend.dutchpay.controller;

import com.udong.backend.dutchpay.dto.CreateDutchpayRequest;
import com.udong.backend.dutchpay.dto.DutchpayDetailResponse;
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

    /**
     * 정산 생성
     * - Body: CreateDutchpayRequest (amount, note, eventId, s3Key, imageUrl, participantUserIds)
     * - createdBy: SecurityContext에서 추출
     * - path: /api/v1/dutchpay/{eventId}
     */
    @PostMapping(
            value = "/{eventId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<?>> createDutchpay(
            @PathVariable Long eventId,
            @RequestPart(name = "receipt", required = false) MultipartFile receipt,
            @RequestParam(required = false) String note,
            @RequestParam Integer amount,
            @RequestParam("participantUserIds") List<Long> participantUserIds
    ) {
        System.out.println("dutchpayyyyyyyyyyyy");
        Long userId = securityUtils.currentUserId();

        // DTO로 묶고 서비스 호출
        CreateDutchpayRequest req = CreateDutchpayRequest.builder()
                .amount(amount)
                .note(note)
                .eventId(eventId)
                .participantUserIds(participantUserIds)
                .build();

        dutchpayService.createWithOptionalImage(req, userId, receipt);
        return ResponseEntity.ok(ApiResponse.ok("정산 생성 완료"));
    }


}