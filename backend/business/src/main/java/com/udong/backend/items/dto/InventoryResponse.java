package com.udong.backend.items.dto;

import com.udong.backend.items.entity.Inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class InventoryResponse {
    private Integer itemId;
    private String itemName;
    private Integer qty;
    
    public static InventoryResponse from(Inventory inventory) {
        return InventoryResponse.builder()
                .itemId(inventory.getItem().getId())   // FK 참조
                .itemName(inventory.getItem().getName()) // Item의 이름 가져오기
                .qty(inventory.getQty())
                .build();
    }
}
