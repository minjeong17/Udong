package com.udong.backend.items.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.items.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

	Optional<Inventory> findByUserId(Integer userId);

	Optional<Inventory> findByUserIdAndItemId(Integer userId, Integer itemId);

}
