package com.udong.backend.clubs.dto;

import jakarta.validation.constraints.*;

public class MemberDtos {
    public record Row(
            Integer membershipId, Integer userId, String name, String phone, String email,
            String gender, String university, String major, String residence,
            String role, String joinedAtIso
    ) {}

    public record ChangeRoleReq(@NotNull Integer memberId, @NotBlank String role) {}
    public record ReasonReq(String reason) {}
}

