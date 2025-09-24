package com.udong.backend.clubdues.service;

import com.udong.backend.clubdues.dto.ClubDuesDtos;
import com.udong.backend.clubdues.entity.ClubDues;
import com.udong.backend.clubdues.entity.ClubDuesStatus;
import com.udong.backend.clubdues.repository.ClubDuesRepository;
import com.udong.backend.clubdues.repository.ClubDuesStatusRepository;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Membership;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.notification.dto.NotificationRequest;
import com.udong.backend.notification.service.NotificationService;
import com.udong.backend.fin.client.FinApiClient;
import com.udong.backend.fin.dto.FinHeader;
import com.udong.backend.fin.util.FinHeaderFactory;
import com.udong.backend.global.config.AccountCrypto;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import com.udong.backend.dutchpay.dto.FinTransferRequest;
import com.udong.backend.dutchpay.dto.FinTransferResponse;
import com.udong.backend.global.exception.TransferException;
import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClubDuesService {

    private final ClubDuesRepository clubDuesRepository;
    private final ClubDuesStatusRepository clubDuesStatusRepository;
    private final ClubRepository clubRepository;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AccountCrypto accountCrypto;
    private final FinApiClient finApiClient;
    private final PointService pointService;

    @Value("${finapi.institution-code:00100}")
    private String institutionCode;

    @Value("${finapi.fintech-app-no:001}")
    private String fintechAppNo;

    @Value("${finapi.api-key}")
    private String apiKey;

    // 1. 새로운 회비 요청 생성
    @Transactional
    public ClubDuesDtos.CreateDuesResponse createDues(Integer clubId, ClubDuesDtos.CreateDuesRequest request, Integer currentUserId) {
        // 동아리 존재 확인
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        // 다음 차수 계산
        Integer nextDuesNo = clubDuesRepository.findMaxDuesNoByClubId(clubId) + 1;

        // 회비 요청 생성
        ClubDues clubDues = ClubDues.builder()
                .club(club)
                .duesNo(nextDuesNo)
                .membershipDues(request.membershipDues())
                .build();

        ClubDues savedDues = clubDuesRepository.save(clubDues);

        // 대상 회원들에 대해 미납 상태 생성
        List<Integer> targetUserIds;
        if (request.selectedUserIds() != null && !request.selectedUserIds().isEmpty()) {
            // 선택된 회원들만
            targetUserIds = request.selectedUserIds();
        } else {
            // 전체 동아리 회원
            List<Membership> members = membershipRepository.findByClubId(clubId);
            targetUserIds = members.stream()
                    .map(Membership::getUserId)
                    .toList();
        }

        List<ClubDuesStatus> statusList = targetUserIds.stream()
                .map(userId -> ClubDuesStatus.builder()
                        .dues(savedDues)
                        .userId(userId)
                        .duesStatus((byte) 0) // 0: 미납
                        .build())
                .toList();

        clubDuesStatusRepository.saveAll(statusList);

        // 알림 전송
        try {
            List<Long> recipientUserIds = targetUserIds.stream()
                    .map(Integer::longValue)
                    .toList();

            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .recipientUserIds(recipientUserIds)
                    .createdBy(currentUserId.longValue())
                    .payload(String.format("새로운 회비 요청이 생성되었습니다. 금액: %,d원", request.membershipDues()))
                    .type("DUE_OPEN")
                    .targetId(savedDues.getId().longValue())
                    .clubId(clubId.longValue())
                    .build();

            notificationService.createAndSendNotification(notificationRequest);
        } catch (Exception e) {
            // 알림 전송 실패 시 전체 트랜잭션 롤백
            throw new RuntimeException("알림 전송 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        return ClubDuesDtos.CreateDuesResponse.builder()
                .duesId(savedDues.getId())
                .duesNo(savedDues.getDuesNo())
                .membershipDues(savedDues.getMembershipDues())
                .createdAt(savedDues.getCreatedAt())
                .build();
    }

    // 2. 동아리 회비 요청 목록 조회 (드롭다운용)
    public ClubDuesDtos.DuesListResponse getDuesList(Integer clubId) {
        List<ClubDues> duesList = clubDuesRepository.findByClubIdOrderByDuesNoDesc(clubId);

        List<ClubDuesDtos.DuesListResponse.DuesItem> items = duesList.stream()
                .map(dues -> ClubDuesDtos.DuesListResponse.DuesItem.builder()
                        .duesId(dues.getId())
                        .duesNo(dues.getDuesNo())
                        .membershipDues(dues.getMembershipDues())
                        .createdAt(dues.getCreatedAt())
                        .build())
                .toList();

        return ClubDuesDtos.DuesListResponse.builder()
                .duesList(items)
                .build();
    }

    // 3. 특정 회차 납부 현황 조회
    public ClubDuesDtos.DuesStatusResponse getDuesStatus(Integer clubId, Integer duesNo) {
        // 해당 회차 회비 요청 조회
        ClubDues clubDues = clubDuesRepository.findByClubIdAndDuesNo(clubId, duesNo)
                .orElseThrow(() -> new RuntimeException("Dues not found"));

        // JOIN 쿼리로 회원 정보와 납부 상태 한번에 조회
        List<ClubDuesDtos.MemberPaymentInfo> memberPaymentInfos =
                clubDuesStatusRepository.findMemberPaymentInfoByDuesId(clubDues.getId());

        // 통계 계산
        long completedCount = clubDuesStatusRepository.countCompletedByDuesId(clubDues.getId());
        long unpaidCount = clubDuesStatusRepository.countUnpaidByDuesId(clubDues.getId());

        // 회원 상태 정보 매핑
        List<ClubDuesDtos.DuesStatusResponse.MemberStatusItem> memberStatuses = memberPaymentInfos.stream()
                .map(info -> ClubDuesDtos.DuesStatusResponse.MemberStatusItem.builder()
                        .userId(info.userId())
                        .userName(info.userName())
                        .userEmail(info.userEmail())
                        .paymentStatus(info.paymentStatus())
                        .statusUpdatedAt(info.statusUpdatedAt())
                        .build())
                .toList();

        return ClubDuesDtos.DuesStatusResponse.builder()
                .duesId(clubDues.getId())
                .duesNo(clubDues.getDuesNo())
                .membershipDues(clubDues.getMembershipDues())
                .createdAt(clubDues.getCreatedAt())
                .totalMembers(memberPaymentInfos.size())
                .completedCount((int) completedCount)
                .unpaidCount((int) unpaidCount)
                .memberStatuses(memberStatuses)
                .build();
    }

    // 4. 개별 회원 납부 상태 변경
    @Transactional
    public ClubDuesDtos.UpdatePaymentStatusResponse updatePaymentStatus(
            Integer clubId, Integer duesId, Integer userId, ClubDuesDtos.UpdatePaymentStatusRequest request) {

        ClubDuesStatus status = clubDuesStatusRepository.findByDuesIdAndUserId(duesId, userId)
                .orElseThrow(() -> new RuntimeException("Payment status not found"));

        status.setDuesStatus(request.paymentStatus());
        ClubDuesStatus updatedStatus = clubDuesStatusRepository.save(status);

        return ClubDuesDtos.UpdatePaymentStatusResponse.builder()
                .userId(updatedStatus.getUserId())
                .paymentStatus(updatedStatus.getDuesStatus())
                .updatedAt(updatedStatus.getCreatedAt())
                .build();
    }

    // 5. 현재 진행 중인 최신 회차 정보 조회
    public ClubDuesDtos.CurrentDuesResponse getCurrentDues(Integer clubId) {
        Integer maxDuesNo = clubDuesRepository.findMaxDuesNoByClubId(clubId);

        if (maxDuesNo == 0) {
            return ClubDuesDtos.CurrentDuesResponse.builder()
                    .currentDuesNo(0)
                    .build();
        }

        ClubDues currentDues = clubDuesRepository.findByClubIdAndDuesNo(clubId, maxDuesNo)
                .orElseThrow(() -> new RuntimeException("Current dues not found"));

        return ClubDuesDtos.CurrentDuesResponse.builder()
                .currentDuesNo(currentDues.getDuesNo())
                .duesId(currentDues.getId())
                .membershipDues(currentDues.getMembershipDues())
                .createdAt(currentDues.getCreatedAt())
                .build();
    }

    // 6. 납부 통계 요약 조회
    public ClubDuesDtos.DuesSummaryResponse getDuesSummary(Integer clubId, Integer duesId) {
        ClubDues clubDues = clubDuesRepository.findById(duesId)
                .orElseThrow(() -> new RuntimeException("Dues not found"));

        long completedCount = clubDuesStatusRepository.countCompletedByDuesId(duesId);
        long unpaidCount = clubDuesStatusRepository.countUnpaidByDuesId(duesId);
        int totalMembers = (int) (completedCount + unpaidCount);

        return ClubDuesDtos.DuesSummaryResponse.builder()
                .duesId(clubDues.getId())
                .duesNo(clubDues.getDuesNo())
                .totalMembers(totalMembers)
                .completedCount((int) completedCount)
                .unpaidCount((int) unpaidCount)
                .membershipDues(clubDues.getMembershipDues())
                .build();
    }

    // 7. 미납자 알림 전송
    @Transactional
    public void notifyUnpaidMembers(Integer clubId, Integer duesId, Integer currentUserId) {
        // 회비 정보 조회
        ClubDues clubDues = clubDuesRepository.findById(duesId)
                .orElseThrow(() -> new RuntimeException("Dues not found"));

        // 미납자 목록 조회
        List<ClubDuesStatus> unpaidStatuses = clubDuesStatusRepository.findUnpaidByDuesId(duesId);

        if (unpaidStatuses.isEmpty()) {
            throw new RuntimeException("미납자가 없습니다.");
        }

        // 미납자 ID 목록 추출
        List<Long> unpaidUserIds = unpaidStatuses.stream()
                .map(status -> status.getUserId().longValue())
                .toList();

        // 알림 전송
        try {
            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .recipientUserIds(unpaidUserIds)
                    .createdBy(currentUserId.longValue())
                    .payload(String.format("%d회차 회비가 납부되지 않았습니다.", clubDues.getDuesNo()))
                    .type("DUE_OPEN")
                    .targetId(duesId.longValue())
                    .clubId(clubId.longValue())
                    .build();

            notificationService.createAndSendNotification(notificationRequest);
        } catch (Exception e) {
            throw new RuntimeException("미납자 알림 전송 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // 8. 현재 사용자의 미납 회비 목록 조회
    @Transactional(readOnly = true)
    public ClubDuesDtos.MyUnpaidDuesResponse getMyUnpaidDues(Integer clubId, Integer currentUserId) {
        // 현재 사용자의 미납 회비 상태 조회
        List<ClubDuesStatus> unpaidStatuses = clubDuesStatusRepository.findUnpaidByUserIdAndClubId(currentUserId, clubId);

        // 회비 정보와 함께 응답 DTO 생성
        List<ClubDuesDtos.MyUnpaidDuesResponse.MyUnpaidDuesItem> unpaidItems = unpaidStatuses.stream()
                .map(status -> {
                    ClubDues clubDues = status.getDues();
                    return ClubDuesDtos.MyUnpaidDuesResponse.MyUnpaidDuesItem.builder()
                            .duesId(clubDues.getId())
                            .duesNo(clubDues.getDuesNo())
                            .membershipDues(clubDues.getMembershipDues())
                            .createdAt(clubDues.getCreatedAt())
                            .build();
                })
                .toList();

        return ClubDuesDtos.MyUnpaidDuesResponse.builder()
                .unpaidDuesList(unpaidItems)
                .build();
    }

    // 9. 회비 결제
    @Transactional
    public ClubDuesDtos.PayDuesResponse payDues(Integer clubId, Integer duesId, Integer currentUserId, ClubDuesDtos.PayDuesRequest request) {
        // 1) 회비 정보 조회
        ClubDuesStatus duesStatus = clubDuesStatusRepository.findByDuesIdAndUserId(duesId, currentUserId)
                .orElseThrow(() -> new RuntimeException("회비 납부 정보를 찾을 수 없습니다."));

        if (duesStatus.getDuesStatus() == 1) {
            throw new RuntimeException("이미 납부 완료된 회비입니다.");
        }

        // 2) 동아리 정보 조회 (동아리 계좌 복호화)
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("동아리를 찾을 수 없습니다."));

        // 3) 사용자 정보 조회 (사용자 계좌 + userKey 복호화)
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String userAccount = accountCrypto.decrypt(user.getAccountCipher());
        String clubAccount = accountCrypto.decrypt(club.getAccountCipher());
        String userKey = accountCrypto.decrypt(user.getUserKeyCipher());

        // 4) 최종 결제 금액 계산 (할인 적용)
        int finalAmount = request.originalAmount() - request.discountAmount();
        if (finalAmount <= 0) {
            throw new RuntimeException("결제 금액이 0보다 작거나 같을 수 없습니다.");
        }

        // 5) FinHeaderFactory 이용해서 헤더 생성
        FinHeader header = FinHeaderFactory.create(
                "updateDemandDepositAccountTransfer",
                institutionCode,
                fintechAppNo,
                apiKey,
                userKey
        );

        // 6) 요청 DTO 조립 (사용자 계좌 → 동아리 계좌)
        FinTransferRequest finReq = FinTransferRequest.builder()
                .header(header)
                .depositAccountNo(clubAccount)
                .depositTransactionSummary("(수시입출금) : 입금(이체)")
                .transactionBalance(String.valueOf(finalAmount))
                .withdrawalAccountNo(userAccount)
                .withdrawalTransactionSummary("(수시입출금) : 출금(이체)")
                .build();

        // 7) 외부 API 호출
        FinTransferResponse res;
        try {
            res = finApiClient.post(
                    "/edu/demandDeposit/updateDemandDepositAccountTransfer",
                    finReq,
                    FinTransferResponse.class
            );

            String code = res.getHeader() != null ? res.getHeader().getResponseCode() : null;
            String msg = res.getHeader() != null ? res.getHeader().getResponseMessage() : null;

            if (!"H0000".equals(code)) {
                throw new TransferException("이체 실패: " + msg);
            }
        } catch (TransferException e) {
            // TransferException은 그대로 재던지기
            throw e;
        } catch (Exception e) {
            // 금융 API 에러 메시지 파싱
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("responseMessage")) {
                try {
                    // "계좌 잔액이 부족하여 거래가 실패했습니다." 같은 메시지 추출
                    int start = errorMessage.indexOf("\"responseMessage\" : \"");
                    if (start != -1) {
                        start += "\"responseMessage\" : \"".length();
                        int end = errorMessage.indexOf("\"", start);
                        if (end != -1) {
                            String message = errorMessage.substring(start, end);
                            throw new TransferException(message);
                        }
                    }
                } catch (Exception parseError) {
                    // 파싱 실패 시 원본 메시지 사용
                }
            }

            // 특정 에러 코드별 사용자 친화적 메시지
            if (errorMessage != null && errorMessage.contains("A1014")) {
                throw new TransferException("계좌 잔액이 부족합니다.");
            }

            throw new TransferException("계좌 이체에 실패했습니다. 다시 시도해 주세요.");
        }

        // 8) 납부 상태 업데이트 (미납 → 납부완료)
        duesStatus.setDuesStatus((byte) 1);
        clubDuesStatusRepository.save(duesStatus);

        // 9) 포인트 주기 (회비 납부 보상으로 100포인트)
        try {
            UserPointLedgerRequest pointRequest = UserPointLedgerRequest.builder()
                    .clubId(clubId)
                    .delta(100)
                    .codeName("DUES_PAYMENT")
                    .memo("회비 납부 보상")
                    .build();
            pointService.addPoints(currentUserId, pointRequest);
        } catch (Exception e) {
            // 포인트 지급 실패해도 회비 납부는 성공으로 처리
            System.err.println("Failed to give points for dues payment: " + e.getMessage());
        }

        return ClubDuesDtos.PayDuesResponse.builder()
                .duesId(duesId)
                .finalAmount(finalAmount)
                .build();
    }
}