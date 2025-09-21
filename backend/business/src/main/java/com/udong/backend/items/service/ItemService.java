package com.udong.backend.items.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.udong.backend.items.dto.ItemResponse;
import com.udong.backend.items.entity.Item;
import com.udong.backend.items.repository.ItemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {
	
	private final ItemRepository itemRepository;

	
	public ItemResponse getItem(Integer itemId) {
		Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));
        return ItemResponse.from(item);
	}
	
	public List<ItemResponse> getAllItems() {
	    return itemRepository.findAll().stream()
                .map(ItemResponse::from)
                .toList();
	}

}
