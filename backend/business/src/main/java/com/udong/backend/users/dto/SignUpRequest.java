package com.udong.backend.users.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignUpRequest {

    @NotBlank @Email @Size(max = 100)
    private String email;

    @NotBlank @Size(min = 8, max = 64)
    private String password;

    @NotBlank @Size(max = 50)
    private String name;

    @Size(max = 30)
    private String university;

    @Size(max = 60)
    private String major;

    @Size(max = 60)
    private String residence;

    @Size(max = 13)
    private String phone;

    @NotBlank
    private String gender; // "M" 또는 "F"

    @NotBlank @Size(max = 30)
    private String account;

    private List<AvailabilityItem> availability; // 선택 입력

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AvailabilityItem {

        @NotNull
        private Integer dayOfWeek;

        @NotNull
        private String startTime; // "18:00"

        @NotNull
        private String endTime;   // "21:00"
    }
}
