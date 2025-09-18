package com.udong.backend.items.service;

import org.springframework.stereotype.Service;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.items.entity.Inventory;
import com.udong.backend.items.entity.Item;
import com.udong.backend.items.repository.InventoryRepository;
import com.udong.backend.items.repository.ItemRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {
	private final ItemRepository itemRepository;
	private final InventoryRepository inventoryRepository;
	
	public Item getItem(Integer itemId) {
		return itemRepository.findById(itemId)
				.orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));
	}
	
	@Transactional
	public Inventory addItem(Integer userId, Integer itemId) {
		Inventory inventory = inventoryRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("유저 인벤토리를 찾을 수 없습니다."));
		
		Inventory updated = Inventory.builder()
				.id(inventory.getId())
				.userId(inventory.getUserId())
				.itemId(itemId)
				.build();
		
	}
}
