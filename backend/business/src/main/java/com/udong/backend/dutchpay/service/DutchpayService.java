package com.udong.backend.dutchpay.service;

import com.udong.backend.dutchpay.dto.*;
import com.udong.backend.dutchpay.entity.Dutchpay;
import com.udong.backend.dutchpay.entity.DutchpayParticipant;
import com.udong.backend.dutchpay.repository.DutchpayParticipantRepository;
import com.udong.backend.dutchpay.repository.DutchpayRepository;
import com.udong.backend.events.entity.Event;
import com.udong.backend.fin.client.FinApiClient;
import com.udong.backend.fin.dto.FinHeader;
import com.udong.backend.fin.util.FinHeaderFactory;
import com.udong.backend.global.config.AccountCrypto;
import com.udong.backend.global.s3.S3Uploader;
import com.udong.backend.users.entity.User;
import com.github.f4b6a3.ulid.UlidCreator;
import com.udong.backend.users.repository.UserRepository;
import jakarta.annotation.Nullable;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class DutchpayService {

    private final DutchpayRepository dutchpayRepository;
    private final UserRepository userRepository;
    private final DutchpayParticipantRepository participantRepository;
    private final EntityManager em;
    private final S3Uploader s3Uploader;
    private final AccountCrypto accountCrypto;
    private final FinApiClient finApiClient; // 외부 API 호출용 (WebClient 감싼 클래스)

    // 도메인별 프리픽스 (env 없으면 기본값 'dutchpay')
    @Value("${S3_PREFIX_DUTCHPAY:dutchpay}")
    private String dutchpayPrefix;

    // application.yml에서 주입
    @Value("${finapi.institution-code:00100}")
    private String institutionCode;

    @Value("${finapi.fintech-app-no:001}")
    private String fintechAppNo;

    @Value("${finapi.api-key}")
    private String apiKey;

    public void createWithOptionalImage(CreateDutchpayRequest req,
                                        int createdByUserId,
                                        @Nullable MultipartFile receipt) {
        

        var uniqueUserIds = new HashSet<>(req.getParticipantUserIds());
        if (uniqueUserIds.isEmpty()) {
            throw new IllegalArgumentException("participantUserIds 가 비었습니다.");
        }

        User creatorRef = em.getReference(User.class, createdByUserId);
        Event eventRef   = em.getReference(Event.class, req.getEventId());

        // --- 영수증 업로드 (있을 때만) ---
        String s3Key = null;
        String imageUrl = null;
        if (receipt != null && !receipt.isEmpty()) {
            validateImage(receipt); // 용량/타입 1차 검증 (image/*)

            // 키: dutchpay/{eventId|general}/receipts/{ULID}.png
            String scope = (req.getEventId() == null) ? "general" : String.valueOf(req.getEventId());
            String ulid = UlidCreator.getMonotonicUlid().toString().toLowerCase();
            String key = "%s/%s/receipts/%s.png".formatted(dutchpayPrefix, scope, ulid);

            // PNG 바이트로 변환(JPEG 등도 PNG로 인코딩하여 저장)
            byte[] pngBytes = toPngBytes(receipt);

            // 업로드 → 공개 URL 반환
            String publicUrl = s3Uploader.putPng(pngBytes, key);

            s3Key = key;
            imageUrl = publicUrl;
        }

        // --- 본문 + 참가자 저장 ---
        Dutchpay dutchpay = Dutchpay.builder()
                .amount(req.getAmount())
                .note(req.getNote())
                .event(eventRef)
                .createdBy(creatorRef)
                .s3Key(s3Key)          // 파일 없으면 null
                .imageUrl(imageUrl)
                .isDone(false)
                .build();

        for (Integer uid : uniqueUserIds) {
            User userRef = em.getReference(User.class, uid);
            dutchpay.addParticipant(
                    DutchpayParticipant.builder()
                            .user(userRef)
                            .isPaid(false)
                            .build()
            );
        }

        dutchpayRepository.save(dutchpay);
    }

    /**
     * 현재 사용자(userId)가 '참여자'로 포함된 정산 목록을 status로 필터링해서 반환
     * status:  "open" | "completed"
     */
    public List<DutchpayListResponse> findByUserAndStatus(Integer userId, String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "status 파라미터는 필수입니다."
            );
        }

        List<DutchpayListResponse> entities;
        String s = status.toLowerCase(Locale.ROOT).trim();
        return switch (s) {
            case "open"      -> dutchpayRepository.findSummaryByUserAndStatus(userId, false);
            case "completed" -> dutchpayRepository.findSummaryByUserAndStatus(userId, true);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "status는 open 또는 completed만 허용됩니다."
            );
        };
    }

    public DutchpayDetailResponse getDetail(Integer dutchpayId) {
        Dutchpay d = dutchpayRepository.findWithAllById(dutchpayId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산이 존재하지 않습니다. id=" + dutchpayId));

        // participants -> DTO 변환
        List<DutchpayDetailResponse.ParticipantInfo> participants = d.getParticipants().stream()
                .map(p -> DutchpayDetailResponse.ParticipantInfo.builder()
                        .userId(p.getUser().getId())
                        .name(p.getUser().getName())
                        .isPaid(p.isPaid())
                        .build())
                .toList();

        return DutchpayDetailResponse.builder()
                .id(d.getId())
                .amount(d.getAmount())
                .note(d.getNote())
                .createdAt(d.getCreatedAt())
                .createdBy(d.getCreatedBy().getName())
                .isDone(d.isDone())
                .s3Key(d.getS3Key())
                .imageUrl(d.getImageUrl())
                .event(DutchpayDetailResponse.EventInfo.builder()
                        .id(d.getEvent().getId())
                        .title(d.getEvent().getTitle())
                        .build())
                .participants(participants)
                .build();
    }

    public PayResponse pay(Integer dutchpayId, Integer withdrawalUserId, PayRequest req) {
        // 1) 정산 존재 확인
        Dutchpay dutchpay = dutchpayRepository.findById(dutchpayId)
                .orElseThrow(() -> new IllegalArgumentException("정산 없음: " + dutchpayId));

        // 2) 출금자/입금자 조회
        User withdrawalUser = userRepository.findById(withdrawalUserId)
                .orElseThrow(() -> new IllegalArgumentException("출금자 없음: " + withdrawalUserId));
        User depositUser = userRepository.findById(req.getDepositUserId())
                .orElseThrow(() -> new IllegalArgumentException("입금자 없음: " + req.getDepositUserId()));

        // 3) 출금자/입금자 계좌 + userKey 복호화
        String withdrawalAccount = accountCrypto.decrypt(withdrawalUser.getAccountCipher());
        String depositAccount = accountCrypto.decrypt(depositUser.getAccountCipher());
        String userKey = accountCrypto.decrypt(withdrawalUser.getUserKeyCipher());

        if (req.getAmount() <= 0) throw new IllegalArgumentException("금액은 0보다 커야 합니다.");

        // 4) FinHeaderFactory 이용해서 헤더 생성
        FinHeader header = FinHeaderFactory.create(
                "updateDemandDepositAccountTransfer",
                institutionCode,
                fintechAppNo,
                apiKey,
                userKey
        );

        // 5) 요청 DTO 조립
        FinTransferRequest finReq = FinTransferRequest.builder()
                .header(header)
                .depositAccountNo(depositAccount)
                .depositTransactionSummary("(수시입출금) : 입금(이체)")
                .transactionBalance(String.valueOf(req.getAmount()))
                .withdrawalAccountNo(withdrawalAccount)
                .withdrawalTransactionSummary("(수시입출금) : 출금(이체)")
                .build();

        // 6) 외부 API 호출
        FinTransferResponse res = finApiClient.post(
                "/edu/demandDeposit/updateDemandDepositAccountTransfer",
                finReq,
                FinTransferResponse.class
        );

        String code = res.getHeader() != null ? res.getHeader().getResponseCode() : null;
        String msg = res.getHeader() != null ? res.getHeader().getResponseMessage() : null;

        if (!"H0000".equals(code)) {
            throw new IllegalStateException("이체 실패: " + code + " - " + msg);
        }

//      7) 성공 → 참가자 납부 처리
        participantRepository.markPaid(dutchpayId, withdrawalUserId);

        return new PayResponse(true, code, msg);
    }


    // --------- helper ---------

    /** 파일 기본 검증: 5MB 이하 & image/* */
    private void validateImage(MultipartFile f) {
        if (f.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("영수증은 최대 5MB까지 가능합니다.");
        }
        String ct = f.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
    }

    /** MultipartFile → PNG 바이트로 인코딩 (JPEG/WEBP 등도 PNG로 저장) */
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

    private DutchpayListResponse toListResponse(Dutchpay d) {
        long participantCount = (d.getParticipants() == null) ? 0 : d.getParticipants().size();

        // Event.id가 Integer라면 다음처럼 Long으로 변환
        Integer eventId = (d.getEvent() == null || d.getEvent().getId() == null)
                ? null
                : d.getEvent().getId();

        String eventTitle = (d.getEvent() == null) ? null : d.getEvent().getTitle();

        return DutchpayListResponse.builder()
                .id(d.getId())
                .createdAt(d.getCreatedAt())
                .note(d.getNote())
                .participantCount(participantCount)
                .eventId(eventId)
                .eventTitle(eventTitle)
                .build();
    }

    public void deleteDutchpay(Integer dutchpayId, Integer currentUserId) {
        // 1. 조회 (없으면 404)
        Dutchpay dutchpay = dutchpayRepository.findById(dutchpayId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "해당 정산이 존재하지 않습니다.")
                );

        // 2. 생성자(소유자)와 현재 사용자 동일 여부 확인 (다르면 403)
        Integer ownerId = dutchpay.getCreatedBy().getId();
        if (!ownerId.equals(currentUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "정산 삭제 권한이 없습니다."
            );
        }

        // 3. 삭제 (연관관계 cascade 설정 필요)
        dutchpayRepository.delete(dutchpay);
    }

    public void dutchpayDone(Integer dutchpayId, Integer currentUserId) {
        // 1) 존재 확인 (404)
        Dutchpay dutchpay = dutchpayRepository.findById(dutchpayId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "해당 정산이 존재하지 않습니다."));

        // 2) 권한 확인 (403) - 작성자만 종료 가능
        Integer ownerId = dutchpay.getCreatedBy().getId();
        if (!ownerId.equals(currentUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "정산 종료 권한이 없습니다.");
        }

        // 3) 이미 종료된 경우 (409)
        if (dutchpay.isDone()) {
             throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 종료된 정산입니다.");
        }

        // 4) 종료 처리 (더티 체킹으로 UPDATE 수행됨)
        dutchpay.setDone(true);
    }
}
