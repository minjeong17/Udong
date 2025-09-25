package com.udong.backend.clubs.dto;

import jakarta.validation.constraints.NotBlank;

public class ClubDtos {
    public record CreateReq(
            @NotBlank String name,
            @NotBlank String category,
            String description,
            @NotBlank String accountNumber            // ✅ 추가
    ) {}

    public record UpdateReq(String name, String category, String description) {}

    // ✅ accountMasked 추가 (평문은 절대 내보내지 않음)
    public record Res(Integer id, String name, String category, String description,
                      String codeUrl, Integer activeMascotId, String accountMasked) {}

    public record InviteCodeRes(String codeUrl) {}
    public record JoinByCodeReq(@NotBlank String code) {}

    public record ClubListRes(Integer id, String name, String category, String description,
                              String codeUrl, Integer activeMascotId, String masUrl, String joinedAt, String myRole) {}

    // 멤버 관리 페이지용 DTO - 초대코드와 복호화된 계좌번호 포함
    public record ManagementInfoRes(String codeUrl, String accountNumber) {}

    // 일일 접속 체크 결과 DTO
    public record DailyAccessRes(boolean isFirstAccessToday, int pointsAwarded) {}
}

