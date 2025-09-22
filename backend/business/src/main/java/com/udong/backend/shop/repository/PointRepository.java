package com.udong.backend.shop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.shop.entity.UserPointLedger;

public interface PointRepository extends JpaRepository<UserPointLedger, Integer> {

	List<UserPointLedger> findByUserIdAndClubId(Integer userId, Integer clubId);

	Optional<UserPointLedger> findTopByUserIdAndClubIdOrderByCreatedAtDesc(Integer userId, Integer clubId);

}
