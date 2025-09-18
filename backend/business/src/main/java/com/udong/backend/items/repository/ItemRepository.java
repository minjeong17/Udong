package com.udong.backend.items.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.items.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Integer> {

}
