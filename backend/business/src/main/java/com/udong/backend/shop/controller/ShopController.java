package com.udong.backend.shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.shop.service.ShopService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/purchase")
public class ShopController {
	
	private final SecurityUtils securityUtils;	
	private final ShopService shopService;
	
	/**
     * 아이템 구매
     */
    @PostMapping("/{clubId}/{itemId}")
    public ResponseEntity<ApiResponse<?>> getItem(@PathVariable("clubId") Integer clubId, @PathVariable("itemId") Integer itemId) {
    	Integer userId = securityUtils.currentUserId();
    	shopService.purchaseItem(clubId, userId, itemId);
        return ResponseEntity.ok(ApiResponse.ok("구매 완료"));
    }
}
