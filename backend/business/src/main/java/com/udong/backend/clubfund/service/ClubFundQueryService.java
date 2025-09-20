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
import com.udong.backend.global.s3.S3Uploader;                 // ✅ 추가
import com.github.f4b6a3.ulid.UlidCreator;                    // ✅ 추가
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;           // ✅ 추가

import javax.imageio.ImageIO;                                  // ✅ 추가
import java.awt.image.BufferedImage;                           // ✅ 추가
import java.io.ByteArrayOutputStream;                          // ✅ 추가
import java.io.IOException;                                    // ✅ 추가
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

    // === S3 업로더 & 프리픽스 ===
    private final S3Uploader s3Uploader;                        // ✅ 추가

    @Value("${S3_PREFIX_CLUBFUND:clubfund}")                   // ✅ 기본값 제공
    private String clubfundPrefix;

    @Value("${finapi.institution-code}") private String institutionCode;
    @Value("${finapi.app-no}") private String fintechAppNo;
    @Value("${finapi.api-key}") private String apiKey;

    /** 조회 버튼 = 거래내역 + 잔액 동시 */
    @Transactional
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

        return QueryResponse.builder()
                .balance(balance)
                .transactions(txViews)
                .build();
    }

    /**
     * ✅ [신규] 출금 거래에 영수증 1개 업로드+연결 (idempotent)
     *  - MultipartFile 영수증을 S3에 업로드하고, imageUrl/s3Key를 receipt 엔티티에 저장.
     *  - 이미 영수증이 있으면 업로드 없이 기존 것 반환.
     */
    @Transactional
    public AttachReceiptResponse attachReceiptWithImage(
            Integer clubId,
            Integer transactionId,
            String memo,
            MultipartFile receipt // ✅ 업로드 파일
    ) {
        // 0) 이미 존재하면 재사용
        var existed = receiptRepository.findByTransactionIdIn(List.of(transactionId));
        if (!existed.isEmpty()) {
            return AttachReceiptResponse.builder()
                    .receiptId(existed.get(0).getId())
                    .created(false)
                    .build();
        }

        // 1) 파일 검증
        validateImage(receipt);

        // 2) 키 생성: clubfund/{clubId}/receipts/{txnId}_{ULID}.png
        String ulid = UlidCreator.getMonotonicUlid().toString().toLowerCase();
        String key = "%s/%s/receipts/%s_%s.png".formatted(clubfundPrefix, clubId, transactionId, ulid);

        // 3) PNG 인코딩 후 업로드
        byte[] pngBytes = toPngBytes(receipt);
        String publicUrl = s3Uploader.putPng(pngBytes, key);

        // 4) 영수증 저장
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

    // ---- 내부 유틸 ----
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

    /** ✅ 이미지 기본 검증: 5MB 이하 & image/* */
    private void validateImage(MultipartFile f) {
        if (f == null || f.isEmpty()) {
            throw new IllegalArgumentException("영수증 파일이 비었습니다.");
        }
        if (f.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("영수증은 최대 5MB까지 가능합니다.");
        }
        String ct = f.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
    }

    /** ✅ MultipartFile → PNG 바이트 */
    private byte[] toPngBytes(MultipartFile file) {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                throw new IllegalArgumentException("유효한 이미지가 아닙니다.");
            }
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
