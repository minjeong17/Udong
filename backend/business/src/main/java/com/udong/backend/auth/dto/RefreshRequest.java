package com.udong.backend.auth.dto;

import lombok.Getter;

@Getter
public class RefreshRequest {
    private String refreshToken;
}
