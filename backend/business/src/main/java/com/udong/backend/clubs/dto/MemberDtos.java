package com.udong.backend.clubs.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class MemberDtos {
    public record Row(
            Integer membershipId, Integer userId, String name, String phone, String email,
            String gender, String university, String major, String residence,
            String role, String joinedAtIso
    ) {}

    // 멤버 관리용 DTO - 마지막 접속 정보 및 활동 가능 시간 포함
    public record ManagementRow(
            Integer membershipId, Integer userId, String name, String phone, String email,
            String gender, String university, String major, String residence,
            String role, String joinedAtIso, String lastAccessedAt, List<AvailabilityInfo> availabilities
    ) {}

    // 활동 가능 시간 정보
    public record AvailabilityInfo(
            Integer dayOfWeek, String startTime, String endTime
    ) {}

    public record ChangeRoleReq(@NotNull Integer memberId, @NotBlank String role) {}
    public record ReasonReq(String reason) {}
    public record TransferLeaderReq(@NotBlank(message = "새로운 계좌번호는 필수입니다") String newAccountNumber) {}
}

