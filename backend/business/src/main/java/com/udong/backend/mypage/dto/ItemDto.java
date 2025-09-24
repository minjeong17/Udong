package com.udong.backend.mypage.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 보유 아이템 (inventories + items join 결과)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {
    private Integer itemId;
    private String itemName;
    private String itemDescription;
    private Integer qty;
}
