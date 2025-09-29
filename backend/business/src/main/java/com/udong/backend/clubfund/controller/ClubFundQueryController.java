// com.udong.backend.clubfund.controller.ClubFundQueryController.java
package com.udong.backend.clubfund.controller;

import com.udong.backend.clubfund.dto.FundQueryDtos.*;
import com.udong.backend.clubfund.service.ClubFundQueryService;
import com.udong.backend.global.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/clubs/{clubId}/funds")
@RequiredArgsConstructor
public class ClubFundQueryController {

    private final ClubFundQueryService service;


    /** 거래내역만 조회 */
    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<TransactionsResponse>> transactions(@PathVariable Integer clubId,
                                                                         @RequestBody QueryRequest req) {

        TransactionsResponse res = service.fetchTransactions(clubId, req.getStartDate(), req.getEndDate());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** 잔액만 조회 */
    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<BalanceResponse>> balance(@PathVariable Integer clubId) {

        BalanceResponse res = service.fetchBalance(clubId);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    /** 멀티파트로 영수증 업로드 + DB 연결 (변경 없음) */
    @PostMapping(
            value = "/transactions/{transactionId}/receipt",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<AttachReceiptResponse>> attachReceipt(@PathVariable Integer clubId,
                                               @PathVariable Integer transactionId,
                                               @RequestPart("receipt") MultipartFile receipt,
                                               @RequestPart(value = "memo", required = false) String memo) {
        AttachReceiptResponse res = service.attachReceiptWithImage(clubId, transactionId, memo, receipt);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
