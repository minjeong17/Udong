package com.udong.backend.items.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.udong.backend.items.dto.InventoryResponse;
import com.udong.backend.items.entity.Inventory;
import com.udong.backend.items.repository.InventoryRepository;
import com.udong.backend.items.repository.ItemRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InventoryService {
	
	private final ItemRepository itemRepository;
	private final InventoryRepository inventoryRepository;
	
	public List<InventoryResponse> getUserInventories(Integer userId) {
		return inventoryRepository.findByUserId(userId).stream()
				.map(InventoryResponse::from)
				.toList();
	}
	
	@Transactional
	public InventoryResponse addItem(Integer userId, Integer itemId) {
		
		Inventory inventory = inventoryRepository.findByUserIdAndItemId(userId, itemId)
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
		
		return InventoryResponse.from(inventory); // DTO 변환해서 반환
	}
	
	@Transactional
    public InventoryResponse useItem(Integer userId, Integer itemId) {
		 Inventory inv = inventoryRepository.findByUserIdAndItemId(userId, itemId)
	                .orElseThrow(() -> new RuntimeException("아이템이 없습니다."));

	        if (inv.getQty() <= 0) {
	            throw new RuntimeException("아이템이 없습니다.");
	        }

	        inv.setQty(inv.getQty() - 1); 
	        Inventory saved = inventoryRepository.save(inv);
	        return InventoryResponse.from(saved); // DTO 변환
    }
}
