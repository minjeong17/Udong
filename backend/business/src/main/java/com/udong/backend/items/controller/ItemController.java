package com.udong.backend.items.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.items.entity.Inventory;
import com.udong.backend.items.entity.Item;
import com.udong.backend.items.service.ItemService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/items")
@RequiredArgsConstructor
public class ItemController {

	private final SecurityUtils securityUtils;
    private final ItemService itemService;

    /**
     * 전체 아이템 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Item>>> getAllItems() {
        List<Item> items = itemService.getAllItems(); // 서비스에서 findAll 구현 필요
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    /**
     * 단일 아이템 조회
     */
    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Item>> getItem(@PathVariable Integer itemId) {
        Item item = itemService.getItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(item));
    }

    /**
     * 아이템 수량 증가
     */
    @PostMapping("/purchase/{itemId}")
    public ResponseEntity<ApiResponse<Inventory>> purchase(@PathVariable Integer itemId) {
        Integer userId = securityUtils.currentUserId();
        Inventory inventory = itemService.addItem(userId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(inventory));
    }
}