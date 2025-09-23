package com.udong.backend.users.controller;

import com.udong.backend.clubs.dto.ClubDtos;
import com.udong.backend.clubs.service.ClubService;
import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.users.dto.SignUpRequest;
import com.udong.backend.users.dto.UpdateAccountRequest;
import com.udong.backend.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/v1")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    private final ClubService clubService;

    @PostMapping("/users/signup")
    public ResponseEntity<ApiResponse<?>> signUp(@Valid @RequestBody SignUpRequest req) {
        userService.signUp(req);
        return ResponseEntity.ok()
                .body(ApiResponse.ok("회원 가입 완료"));
    }

    /** 내 계정 탈퇴 (인증 필요) */
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMe() {

        Integer userId = securityUtils.currentUserId(); // SecurityContext에서 AT로 파싱

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

    /** 내가 속한 모든 동아리 조회 */
    @GetMapping("/me/clubs")
    public ResponseEntity<ApiResponse<List<ClubDtos.ClubListRes>>> myClubs() {
        Integer userId = securityUtils.currentUserId();

        List<ClubDtos.ClubListRes> resList = clubService.getClubsWithMascotByUserId(userId);

        return ResponseEntity.ok(ApiResponse.ok(resList));
    }

    /** 내 계좌 정보 조회 (복호화) */
    @GetMapping("/me/account")
    public ResponseEntity<ApiResponse<?>> getMyAccount() {
        Integer userId = securityUtils.currentUserId();

        var accountInfo = userService.getDecryptedAccountInfo(userId);

        return ResponseEntity.ok(ApiResponse.ok(accountInfo));
    }

    /** 내 계좌 정보 변경 */
    @PutMapping("/me/account")
    public ResponseEntity<ApiResponse<?>> updateMyAccount(@RequestBody UpdateAccountRequest request) {
        Integer userId = securityUtils.currentUserId();

        userService.updateAccount(userId, request.getAccountNumber());

        return ResponseEntity.ok(ApiResponse.ok("계좌 정보가 변경되었습니다"));
    }
}
