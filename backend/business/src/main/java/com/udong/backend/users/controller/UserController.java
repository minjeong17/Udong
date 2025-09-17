package com.udong.backend.users.controller;

import com.udong.backend.auth.service.AuthService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.users.service.UserService;
import com.udong.backend.users.dto.SignUpRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@RestController
@RequestMapping("/v1")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @PostMapping("/users/signup")
    public ResponseEntity<ApiResponse<?>> signUp(@Valid @RequestBody SignUpRequest req) {
        userService.signUp(req);
        return ResponseEntity.ok()
                .body(ApiResponse.ok("회원 가입 완료"));
    }

    /** 내 계정 탈퇴 (인증 필요) */
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMe() {

        Long userId = securityUtils.currentUserId(); // SecurityContext에서 AT로 파싱

        userService.deleteAccount(userId);   // 유저/연관 데이터 삭제

        // 선택: 브라우저에 남았을 수 있는 RT 쿠키도 제거 지시
        ResponseCookie remove = ResponseCookie.from("refreshToken", "")
                .httpOnly(true).secure(true)     // dev는 false 분기
                .path("/v1/auth")                // 로그인 때와 동일해야 삭제됨
                .maxAge(0).sameSite("None")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, remove.toString())
                .body(ApiResponse.ok("회원 탈퇴 완료"));
    }

//    private Long currentUserId() {
//        var auth = SecurityContextHolder.getContext().getAuthentication();
//        if (auth == null || !auth.isAuthenticated()) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthenticated");
//        }
//
//        return Long.valueOf(auth.getName()); // 필터에서 principal=userId로 넣었음
//    }
}
