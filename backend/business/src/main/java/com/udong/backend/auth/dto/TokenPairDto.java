package com.udong.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TokenPairDto {
    private int userId;
    private TokenPair tokenPair;

    public TokenPairDto(int userId, String accessToken, String refreshToken) {
        this.userId = userId;
        this.tokenPair = new TokenPair(accessToken,refreshToken);
    }

}
