// com.udong.backend.clubfund.controller.ClubFundQueryController.java
package com.udong.backend.clubfund.controller;

import com.udong.backend.clubfund.dto.FundQueryDtos.AttachReceiptResponse;
import com.udong.backend.clubfund.dto.FundQueryDtos.QueryRequest;
import com.udong.backend.clubfund.dto.FundQueryDtos.QueryResponse;
import com.udong.backend.clubfund.service.ClubFundQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/clubs/{clubId}/funds")
@RequiredArgsConstructor
public class ClubFundQueryController {

    private final ClubFundQueryService service;

    /** 조회 버튼: 기간 내 거래 + 현재 잔액 동시 반환 */
    @PostMapping("/query")
    public QueryResponse query(@PathVariable Integer clubId,
                               @RequestBody QueryRequest req) {
        return service.queryTransactionsAndBalance(
                clubId, req.getStartDate(), req.getEndDate()
        );
    }

    /** 멀티파트로 영수증 업로드 + DB 연결 */
    @PostMapping(
            value = "/transactions/{transactionId}/receipt",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public AttachReceiptResponse attachReceipt(
            @PathVariable Integer clubId,
            @PathVariable Integer transactionId,
            @RequestPart("receipt") MultipartFile receipt,    // 파일 파트 이름 = "receipt"
            @RequestPart(value = "memo", required = false) String memo
    ) {
        return service.attachReceiptWithImage(clubId, transactionId, memo, receipt);
    }
}
