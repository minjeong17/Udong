package com.udong.backend.shop.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.shop.dto.InventoryResponse;
import com.udong.backend.shop.dto.ItemResponse;
import com.udong.backend.shop.entity.Inventory;
import com.udong.backend.shop.entity.Item;
import com.udong.backend.shop.service.InventoryService;
import com.udong.backend.shop.service.ItemService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/v1/items")
@RequiredArgsConstructor
public class ItemController {

	private final SecurityUtils securityUtils;
    private final ItemService itemService;
    private final InventoryService inventoryService;

    /**
     * 전체 아이템 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getAllItems() {
        List<ItemResponse> items = itemService.getAllItems().stream()
        		.map(ItemResponse::from)
        		.toList();
        
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    /**
     * 단일 아이템 조회
     */
    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemResponse>> getItem(@PathVariable("itemId") Integer itemId) {
        Item item = itemService.getItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(ItemResponse.from(item)));
    }
    
    /**
     * 인벤토리 조회
     */
    @GetMapping("/inv/{clubId}")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getInventory(@PathVariable("clubId") Integer clubId) {
    	Integer userId = securityUtils.currentUserId();

    	List<InventoryResponse> inventories = inventoryService.getUserInventories(userId, clubId).stream()
    	        .map(InventoryResponse::from)
    	        .toList();

    	return ResponseEntity.ok(ApiResponse.ok(inventories));
    }

    /**
     * 인벤토리 아이템 수량 증가
     */
    @PostMapping("/purchase/{clubId}/{itemId}")
    public ResponseEntity<ApiResponse<InventoryResponse>> purchase(@PathVariable("clubId") Integer clubId, @PathVariable("itemId") Integer itemId) {
        Integer userId = securityUtils.currentUserId();
        Inventory inventory = inventoryService.addItem(userId, clubId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(InventoryResponse.from(inventory)));
    }
    
    /**
     * 인벤토리 아이템 수량 감소
     */
    @PostMapping("/use/{clubId}/{itemId}")
    public ResponseEntity<ApiResponse<InventoryResponse>> use(@PathVariable("clubId") Integer clubId, @PathVariable("itemId") Integer itemId) {
        Integer userId = securityUtils.currentUserId();
        Inventory inventory = inventoryService.useItem(userId, clubId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(InventoryResponse.from(inventory)));
    }
    
}