package com.udong.backend.dutchpay.service;

import com.udong.backend.dutchpay.dto.CreateDutchpayRequest;
import com.udong.backend.dutchpay.dto.DutchpayListResponse;
import com.udong.backend.dutchpay.entity.Dutchpay;
import com.udong.backend.dutchpay.entity.DutchpayParticipant;
import com.udong.backend.dutchpay.repository.DutchpayRepository;
import com.udong.backend.events.entity.Event;
import com.udong.backend.global.s3.S3Uploader;
import com.udong.backend.users.entity.User;
import com.github.f4b6a3.ulid.UlidCreator;
import jakarta.annotation.Nullable;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
    private final EntityManager em;
    private final S3Uploader s3Uploader;

    // 도메인별 프리픽스 (env 없으면 기본값 'dutchpay')
    @Value("${S3_PREFIX_DUTCHPAY:dutchpay}")
    private String dutchpayPrefix;

    public void createWithOptionalImage(CreateDutchpayRequest req,
                                        long createdByUserId,
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

        for (Long uid : uniqueUserIds) {
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
    public List<DutchpayListResponse> findByUserAndStatus(Long userId, String status) {
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
        int participantCount = (d.getParticipants() == null) ? 0 : d.getParticipants().size();

        // Event.id가 Integer라면 다음처럼 Long으로 변환
        Long eventId = (d.getEvent() == null || d.getEvent().getId() == null)
                ? null
                : d.getEvent().getId().longValue();

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
}
