package com.udong.backend.shop.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.udong.backend.shop.entity.Inventory;
import com.udong.backend.shop.repository.InventoryRepository;
import com.udong.backend.shop.repository.ItemRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InventoryService {
	
	private final ItemRepository itemRepository;
	private final InventoryRepository inventoryRepository;
	
	public List<Inventory> getUserInventories(Integer userId) {
		return inventoryRepository.findByUserId(userId);
	}
	
	@Transactional
	public Inventory addItem(Integer userId, Integer itemId) {
		
		return inventoryRepository.findByUserIdAndItemId(userId, itemId)
	            .map(inv -> {
	                inv.setQty(inv.getQty() + 1);
	                return inventoryRepository.save(inv);
	            })
	            .orElseGet(() -> {
	                Inventory newInv = Inventory.builder()
	                        .userId(userId)
	                        .item(itemRepository.findById(itemId)
	                                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다.")))
	                        .qty(1)
	                        .build();
	                return inventoryRepository.save(newInv);
	            });
	}
	
	@Transactional
    public Inventory useItem(Integer userId, Integer itemId) {
		Inventory inv = inventoryRepository.findByUserIdAndItemId(userId, itemId)
	                .orElseThrow(() -> new RuntimeException("아이템이 없습니다."));

	    if (inv.getQty() <= 0) {
	        throw new RuntimeException("아이템이 없습니다.");
	    }

	    inv.setQty(inv.getQty() - 1); 
	    return inventoryRepository.save(inv);
    }
}
