// com.udong.backend.clubfund.controller.ClubFundQueryController.java
package com.udong.backend.clubfund.controller;

import com.udong.backend.clubfund.dto.FundQueryDtos.*;
import com.udong.backend.clubfund.service.ClubFundQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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

    /** 출금 거래 영수증 첨부(한 거래당 1개, idempotent) */
    @PostMapping("/transactions/{transactionId}/receipt")
    public AttachReceiptResponse attachReceipt(@PathVariable Integer clubId,
                                               @PathVariable Integer transactionId,
                                               @RequestBody AttachReceiptRequest req) {
        return service.attachReceipt(
                clubId, transactionId, req.getMemo(), req.getImageUrl(), req.getS3Key()
        );
    }
}
