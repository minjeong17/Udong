package com.udong.backend.shop.service;

import org.springframework.stereotype.Service;

import com.udong.backend.items.entity.Item;
import com.udong.backend.items.repository.ItemRepository;
import com.udong.backend.items.service.ItemService;
import com.udong.backend.points.service.PointService;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShopService {
	
	private final UserRepository userRepository;
	private final PointService pointService;
	private final ItemService itemService;
	
	
	public void purchase(Integer userId, Integer itemId) {
		
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
		Item item = itemService.getItem(itemId);
		
		pointService.use(userId, item.getPrice());
		itemService.add(userId, itemId);
		
	}
	
}
