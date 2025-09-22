package com.udong.backend.shop.dto;

import com.udong.backend.shop.entity.Item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ItemResponse {
    private Integer id;
    private String name;
    private String description;
    private Integer price;
    
    public static ItemResponse from(Item item) {
        return ItemResponse.builder()
                .id(item.getId())   // FK 참조
                .name(item.getName()) 
                .description(item.getDescription())
                .price(item.getPrice())
                .build();
    }
}