package com.udong.backend.shop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.udong.backend.shop.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

	@Query("SELECT i FROM Inventory i JOIN FETCH i.item " +
		       "WHERE i.userId = :userId AND i.clubId = :clubId")
		List<Inventory> findByUserIdAndClubId(@Param("userId") Integer userId,
		                                      @Param("clubId") Integer clubId);

	@Query("SELECT i FROM Inventory i JOIN FETCH i.item " +
		       "WHERE i.userId = :userId AND i.clubId = :clubId AND i.item.id = :itemId")
		Optional<Inventory> findByUserIdAndClubIdAndItemId(@Param("userId") Integer userId,
		                                                   @Param("clubId") Integer clubId,
		                                                   @Param("itemId") Integer itemId);

}
