package com.udong.backend.items.service;

import java.util.List;

import org.springframework.stereotype.Service;

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
	
	public List<Item> getAllItems() {
		return itemRepository.findAll();
	}
	
	@Transactional
	public Inventory addItem(Integer userId, Integer itemId) {
		Inventory inventory = inventoryRepository.findByUserId(userId)
				.orElseThrow(() -> new RuntimeException("유저 인벤토리를 찾을 수 없습니다."));
		
		return inventoryRepository.findByUserIdAndItemId(userId, itemId)
	            .map(inv -> {
	                inv.setQty(inventory.getQty() + 1);
	                return inventoryRepository.save(inv);
	            })
	            .orElseGet(() -> {
	                Inventory newInv = Inventory.builder()
	                        .userId(userId)
	                        .itemId(itemId)
	                        .qty(1)
	                        .build();
	                return inventoryRepository.save(newInv);
	            });
	}
}
