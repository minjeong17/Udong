package com.udong.backend.clubs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class InviteDtos {
    public record JoinByCodeReq(@NotBlank String code) {}

    public record MembershipRes(
            @JsonProperty("club_id") Integer clubId,
            @JsonProperty("user_id") Integer userId,
            String role,
            @JsonProperty("joined_at") String joinedAt // ISO-8601 문자열
    ) {}

    public record JoinRes(
            @JsonProperty("membership") MembershipRes membership
    ) {}
}

