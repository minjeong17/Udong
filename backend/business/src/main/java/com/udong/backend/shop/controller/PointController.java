package com.udong.backend.shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.dto.UserPointLedgerResponse;
import com.udong.backend.shop.entity.UserPointLedger;
import com.udong.backend.shop.service.PointService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/point")
public class PointController {
	
	private final SecurityUtils securityUtils;	
	private final PointService pointService;
	
	/**
     * 포인트 적립
     */
    @PostMapping("/earn")
    public ResponseEntity<ApiResponse<UserPointLedgerResponse>> addPoints(@Valid @RequestBody UserPointLedgerRequest req) {
    	Integer userId = securityUtils.currentUserId();
        UserPointLedger ledger = pointService.addPoints(userId, req);
        return ResponseEntity.ok(ApiResponse.ok(UserPointLedgerResponse.from(ledger)));
    }

    /**
     * 포인트 사용
     */
    @PostMapping("/use")
    public ResponseEntity<ApiResponse<UserPointLedgerResponse>> usePoints(@Valid @RequestBody UserPointLedgerRequest req) {
        Integer userId = securityUtils.currentUserId();
        UserPointLedger ledger = pointService.usePoints(userId, req);
        return ResponseEntity.ok(ApiResponse.ok(UserPointLedgerResponse.from(ledger)));
    }
}
	
	
