package com.udong.backend.items.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.items.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Integer> {

	Optional<Item> findById(Integer itemId);
	
	List<Item> findAll();
}
