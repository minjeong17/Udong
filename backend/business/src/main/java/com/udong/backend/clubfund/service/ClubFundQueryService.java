// com.udong.backend.clubfund.service.ClubFundQueryService.java
package com.udong.backend.clubfund.service;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubfund.dto.FundQueryDtos.*;
import com.udong.backend.clubfund.entity.ClubFundReceipt;
import com.udong.backend.clubfund.repository.ClubFundReceiptRepository;
import com.udong.backend.fin.client.FinApiClient;
import com.udong.backend.fin.dto.*;
import com.udong.backend.fin.util.FinHeaderFactory;
import com.udong.backend.global.config.AccountCrypto;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubFundQueryService {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubFundReceiptRepository receiptRepository;
    private final FinApiClient finApiClient;
    private final AccountCrypto accountCrypto;

    @Value("${finapi.institution-code}") private String institutionCode;
    @Value("${finapi.app-no}") private String fintechAppNo;
    @Value("${finapi.api-key}") private String apiKey;

    /** 조회 버튼 = 거래내역 + 잔액 동시 */
    @Transactional(readOnly = true)
    public QueryResponse queryTransactionsAndBalance(Integer clubId, String startDate, String endDate) {
        // 1) 계좌/키 준비
        PreparedFinContext ctx = prepareContext(clubId);

        // 2) 거래내역 조회
        var historyHeader = FinHeaderFactory.create(
                "inquireTransactionHistoryList", institutionCode, fintechAppNo, apiKey, ctx.userKey);
        var historyReq = InquireHistoryRequest.builder()
                .header(historyHeader)
                .accountNo(ctx.accountNo)
                .startDate(startDate)
                .endDate(endDate)
                .transactionType("A")
                .orderByType("ASC")
                .build();

        var historyRes = finApiClient.post(
                "/edu/demandDeposit/inquireTransactionHistoryList",
                historyReq,
                InquireHistoryResponse.class
        );
        ensureOk(historyRes.getHeader(), "거래내역 조회 실패");

        var items = Optional.ofNullable(historyRes.getRec())
                .map(InquireHistoryResponse.Rec::getList)
                .orElseGet(List::of);

        // 3) 잔액 조회
        var balanceHeader = FinHeaderFactory.create(
                "inquireDemandDepositAccountBalance", institutionCode, fintechAppNo, apiKey, ctx.userKey);
        var balanceReq = InquireBalanceRequest.builder()
                .header(balanceHeader)
                .accountNo(ctx.accountNo)
                .build();
        var balanceRes = finApiClient.post(
                "/edu/demandDeposit/inquireDemandDepositAccountBalance",
                balanceReq,
                InquireBalanceResponse.class
        );
        ensureOk(balanceRes.getHeader(), "잔액 조회 실패");
        int balance = Integer.parseInt(balanceRes.getRec().getAccountBalance());

        // 4) 영수증 존재 여부 벌크로 계산
        List<Integer> txnIds = items.stream()
                .map(it -> Integer.valueOf(it.getTransactionUniqueNo()))
                .toList();

        Map<Integer, ClubFundReceipt> receiptByTxn = receiptRepository.findByTransactionIdIn(txnIds)
                .stream().collect(Collectors.toMap(ClubFundReceipt::getTransactionId, r -> r));

        // 5) 응답 변환
        var txViews = items.stream().map(it -> {
            Integer tid = Integer.valueOf(it.getTransactionUniqueNo());
            boolean withdrawal = "2".equals(it.getTransactionType());
            ClubFundReceipt r = receiptByTxn.get(tid);

            return TransactionItem.builder()
                    .transactionId(tid)
                    .date(it.getTransactionDate())
                    .time(it.getTransactionTime())
                    .type(it.getTransactionType())
                    .typeName(it.getTransactionTypeName())
                    .summary(it.getTransactionSummary())
                    .memo(it.getTransactionMemo())
                    .accountNo(it.getTransactionAccountNo())
                    .amount(it.getTransactionBalance())
                    .afterBalance(it.getTransactionAfterBalance())
                    .isWithdrawal(withdrawal)
                    .hasReceipt(r != null)
                    .receiptId(r != null ? r.getId() : null)
                    .build();
        }).toList();

        return QueryResponse.builder()
                .balance(balance)
                .transactions(txViews)
                .build();
    }

    /** 출금 거래에 영수증 1개만 연결 (idempotent) */
    @Transactional
    public AttachReceiptResponse attachReceipt(Integer clubId,
                                               Integer transactionId,
                                               String memo, String imageUrl, String s3Key) {
        // 이미 있으면 그대로 반환
        var existed = receiptRepository.findByTransactionIdIn(List.of(transactionId));
        if (!existed.isEmpty()) {
            return AttachReceiptResponse.builder()
                    .receiptId(existed.get(0).getId())
                    .created(false)
                    .build();
        }

        // 새로 생성
        ClubFundReceipt saved = ClubFundReceipt.builder()
                .clubId(clubId)
                .transactionId(transactionId)
                .memo(memo)
                .imageUrl(imageUrl)
                .s3Key(s3Key)
                .build();

        saved = receiptRepository.save(saved);
        return AttachReceiptResponse.builder()
                .receiptId(saved.getId())
                .created(true)
                .build();
    }

    // ---- 내부 유틸 ----
    private record PreparedFinContext(String accountNo, String userKey) {}

    private PreparedFinContext prepareContext(Integer clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new IllegalArgumentException("클럽 없음: " + clubId));
        User leader = userRepository.findById(club.getLeaderUserId())
                .orElseThrow(() -> new IllegalArgumentException("리더 유저 없음: " + club.getLeaderUserId()));
        String accountNo = accountCrypto.decrypt(club.getAccountCipher());
        String userKey = accountCrypto.decrypt(lea der.getUserKeyCipher());
        return new PreparedFinContext(accountNo, userKey);
    }

    private void ensureOk(InquireHistoryResponse.Header h, String prefix) {
        if (h == null || !"H0000".equals(h.getResponseCode())) {
            throw new IllegalStateException(prefix + ": " +
                (h == null ? "no header" : (h.getResponseCode() + " - " + h.getResponseMessage())));
        }
    }
    private void ensureOk(InquireBalanceResponse.Header h, String prefix) {
        if (h == null || !"H0000".equals(h.getResponseCode())) {
            throw new IllegalStateException(prefix + ": " +
                (h == null ? "no header" : (h.getResponseCode() + " - " + h.getResponseMessage())));
        }
    }
}
