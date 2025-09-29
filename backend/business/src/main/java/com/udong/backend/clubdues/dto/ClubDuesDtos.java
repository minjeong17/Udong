package com.udong.backend.clubdues.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

public class ClubDuesDtos {

    // 회비 요청 생성 요청 DTO
    @Builder
    public record CreateDuesRequest(
            Integer membershipDues,
            List<Integer> selectedUserIds // null이면 전체 회원, 값이 있으면 선택된 회원만
    ) {}

    // 회비 요청 생성 응답 DTO
    @Builder
    public record CreateDuesResponse(
            Integer duesId,
            Integer duesNo,
            Integer membershipDues,
            LocalDateTime createdAt
    ) {}

    // 회비 요청 목록 응답 DTO (드롭다운용)
    @Builder
    public record DuesListResponse(
            List<DuesItem> duesList
    ) {
        @Builder
        public record DuesItem(
                Integer duesId,
                Integer duesNo,
                Integer membershipDues,
                LocalDateTime createdAt
        ) {}
    }

    // 특정 회차 납부 현황 응답 DTO
    @Builder
    public record DuesStatusResponse(
            Integer duesId,
            Integer duesNo,
            Integer membershipDues,
            LocalDateTime createdAt,
            Integer totalMembers,
            Integer completedCount,
            Integer unpaidCount,
            List<MemberStatusItem> memberStatuses
    ) {
        @Builder
        public record MemberStatusItem(
                Integer userId,
                String userName,
                String userEmail,
                Byte paymentStatus, // 0: 미납, 1: 납부완료
                LocalDateTime statusUpdatedAt
        ) {}
    }

    // 납부 상태 변경 요청 DTO
    @Builder
    public record UpdatePaymentStatusRequest(
            Byte paymentStatus // 0: 미납, 1: 납부완료
    ) {}

    // 납부 상태 변경 응답 DTO
    @Builder
    public record UpdatePaymentStatusResponse(
            Integer userId,
            Byte paymentStatus,
            LocalDateTime updatedAt
    ) {}

    // 현재 진행 중인 회차 정보 응답 DTO
    @Builder
    public record CurrentDuesResponse(
            Integer currentDuesNo,
            Integer duesId,
            Integer membershipDues,
            LocalDateTime createdAt
    ) {}

    // 납부 통계 요약 응답 DTO
    @Builder
    public record DuesSummaryResponse(
            Integer duesId,
            Integer duesNo,
            Integer totalMembers,
            Integer completedCount,
            Integer unpaidCount,
            Integer membershipDues
    ) {}

    // 현재 사용자의 미납 회비 목록 응답 DTO
    @Builder
    public record MyUnpaidDuesResponse(
            List<MyUnpaidDuesItem> unpaidDuesList
    ) {
        @Builder
        public record MyUnpaidDuesItem(
                Integer duesId,
                Integer duesNo,
                Integer membershipDues,
                LocalDateTime createdAt
        ) {}
    }

    // 회비 결제 요청 DTO
    @Builder
    public record PayDuesRequest(
            Integer originalAmount,
            Integer discountAmount,
            String paymentPassword
    ) {}

    // 회비 결제 응답 DTO
    @Builder
    public record PayDuesResponse(
            Integer duesId,
            Integer finalAmount
    ) {}

    // JOIN 쿼리 결과용 DTO
    @Builder
    public record MemberPaymentInfo(
            Integer userId,
            String userName,
            String userEmail,
            Byte paymentStatus,
            LocalDateTime statusUpdatedAt
    ) {}
}