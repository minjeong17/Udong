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

    /** 로그아웃: RT 무효화 + 쿠키 제거 */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        // 서버 DB에서 해당 RT 무효화(없어도 idempotent 하게 처리)
        authService.logout(refreshToken);

        // 브라우저 쿠키 삭제
        ResponseCookie remove = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)      // 로컬 HTTP 테스트면 환경별로 false 분기 권장
                .path("/")
                .maxAge(0)         // 즉시 만료
                .sameSite("None")  // 크로스 도메인이라면 None, 동일 오리진이면 Lax도 가능
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, remove.toString());

        // Access Token은 무상태라 서버에서 지울 게 없음 → 프론트가 폐기
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.ok("로그아웃 완료"));
    }
}
