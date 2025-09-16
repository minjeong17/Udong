package com.udong.backend.auth.controller;

import com.udong.backend.auth.dto.AccessTokenResponse;
import com.udong.backend.auth.service.AuthService;
import com.udong.backend.auth.dto.LoginRequest;
import com.udong.backend.auth.dto.TokenPair;
import com.udong.backend.global.dto.response.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        TokenPair tokens = authService.login(req);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + tokens.getAccessToken());

        // Refresh Token을 HttpOnly 쿠키에 담기
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokens.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(180))
                .sameSite("None") // 크로스 도메인 환경이면 None, 아니면 Lax
                .build();
        headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.ok("로그인 성공"));
    }

    /** 액세스 토큰 만료 시 재발급 */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "리프레시 토큰이 없습니다."));
        }

        // 내부에서 RT 해시 검증만 하고, 새 AccessToken만 발급
        AccessTokenResponse res = authService.refresh(refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + res.getAccessToken());

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.ok(res));
    }
}
