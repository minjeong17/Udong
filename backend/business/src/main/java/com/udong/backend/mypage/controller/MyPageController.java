package com.udong.backend.mypage.controller;


import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.mypage.dto.MyPageResponse;
import com.udong.backend.mypage.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/mypage")
public class MyPageController {

    private final MyPageService myPageService;
    private final SecurityUtils securityUtils;

    /**
     * 마이페이지 조회(유저×클럽 단위)
     * GET /api/v1/mypage/{clubId}
     */
    @GetMapping("/{clubId}")
    public ResponseEntity<ApiResponse<MyPageResponse>> getMyPage(@PathVariable Integer clubId) {
        Integer userId = securityUtils.currentUserId();
        MyPageResponse res = myPageService.getMyPage(userId, clubId);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}