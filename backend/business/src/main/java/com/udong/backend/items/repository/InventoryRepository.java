package com.udong.backend.items.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.items.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

}
