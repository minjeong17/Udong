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
import com.udong.backend.global.s3.S3Uploader;
import com.github.f4b6a3.ulid.UlidCreator;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
    private final S3Uploader s3Uploader;

    @Value("${S3_PREFIX_CLUBFUND:clubfund}")
    private String clubfundPrefix;

    @Value("${finapi.institution-code}") private String institutionCode;
    @Value("${finapi.app-no}") private String fintechAppNo;
    @Value("${finapi.api-key}") private String apiKey;

    /** =========================
     *  A) 거래내역만 조회
     * ========================== */
    @Transactional
    public TransactionsResponse fetchTransactions(Integer clubId, String startDate, String endDate) {
        PreparedFinContext ctx = prepareContext(clubId);

        // 거래내역 조회
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

        // 영수증 존재 여부 벌크 체크
        List<Integer> txnIds = items.stream()
                .map(it -> Integer.valueOf(it.getTransactionUniqueNo()))
                .toList();

        Map<Integer, ClubFundReceipt> receiptByTxn = receiptRepository.findByTransactionIdIn(txnIds)
                .stream().collect(Collectors.toMap(ClubFundReceipt::getTransactionId, r -> r));

        var txViews = items.stream().map(it -> {
            Integer tid = Integer.valueOf(it.getTransactionUniqueNo());
            boolean withdrawal = "2".equals(it.getTransactionType()); // 2 = 출금
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
                    .receiptUrl(r != null ? r.getImageUrl() : null)
                    .s3Key(r != null ? r.getS3Key() : null)
                    .build();
        }).toList();

        return TransactionsResponse.builder()
                .transactions(txViews)
                .build();
    }

    /** =========================
     *  B) 잔액만 조회
     * ========================== */
    @Transactional
    public BalanceResponse fetchBalance(Integer clubId) {
        PreparedFinContext ctx = prepareContext(clubId);

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
        return BalanceResponse.builder().balance(balance).build();
    }

    // ========= 영수증 업로드 (변경 없음) =========
    @Transactional
    public AttachReceiptResponse attachReceiptWithImage(
            Integer clubId, Integer transactionId, String memo, MultipartFile receipt) {
        var existed = receiptRepository.findByTransactionIdIn(List.of(transactionId));
        if (!existed.isEmpty()) {
            return AttachReceiptResponse.builder()
                    .receiptId(existed.get(0).getId())
                    .created(false)
                    .build();
        }
        validateImage(receipt);
        String ulid = UlidCreator.getMonotonicUlid().toString().toLowerCase();
        String key = "%s/%s/receipts/%s_%s.png".formatted(clubfundPrefix, clubId, transactionId, ulid);

        byte[] pngBytes = toPngBytes(receipt);
        String publicUrl = s3Uploader.putPng(pngBytes, key);

        ClubFundReceipt saved = ClubFundReceipt.builder()
                .clubId(clubId)
                .transactionId(transactionId)
                .memo(memo)
                .imageUrl(publicUrl)
                .s3Key(key)
                .build();
        saved = receiptRepository.save(saved);

        return AttachReceiptResponse.builder()
                .receiptId(saved.getId())
                .created(true)
                .build();
    }

    // ---- 내부 유틸 (그대로) ----
    private record PreparedFinContext(String accountNo, String userKey) {}
    private PreparedFinContext prepareContext(Integer clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new IllegalArgumentException("클럽 없음: " + clubId));
        User leader = userRepository.findById(club.getLeaderUserId())
                .orElseThrow(() -> new IllegalArgumentException("리더 유저 없음: " + club.getLeaderUserId()));
        String accountNo = accountCrypto.decrypt(club.getAccountCipher());
        String userKey = accountCrypto.decrypt(leader.getUserKeyCipher());
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
    private void validateImage(MultipartFile f) {
        if (f == null || f.isEmpty()) throw new IllegalArgumentException("영수증 파일이 비었습니다.");
        if (f.getSize() > 5 * 1024 * 1024) throw new IllegalArgumentException("영수증은 최대 5MB까지 가능합니다.");
        String ct = f.getContentType();
        if (ct == null || !ct.startsWith("image/")) throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
    }
    private byte[] toPngBytes(MultipartFile file) {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) throw new IllegalArgumentException("유효한 이미지가 아닙니다.");
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                boolean ok = ImageIO.write(image, "png", baos);
                if (!ok) throw new IllegalStateException("PNG 인코딩 실패");
                return baos.toByteArray();
            }
        } catch (IOException e) {
            throw new RuntimeException("이미지 처리 실패", e);
        }
    }
}
