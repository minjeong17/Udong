package com.udong.backend.points.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.points.entity.UserPointLedger;

public interface PointRepository extends JpaRepository<UserPointLedger, Integer> {

	List<UserPointLedger> findByUserId(Integer userId);

	Optional<UserPointLedger> findTopByUserIdOrderByCreatedAtDesc(Integer userId);

}
