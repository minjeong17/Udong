package com.udong.backend.shop.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.udong.backend.shop.entity.Item;
import com.udong.backend.shop.repository.ItemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {
	
	private final ItemRepository itemRepository;

	
	public Item getItem(Integer itemId) {
		return itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));
	}
	
	public List<Item> getAllItems() {
	    return itemRepository.findAll();
	}

}
