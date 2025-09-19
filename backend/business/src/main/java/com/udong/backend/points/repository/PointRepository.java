package com.udong.backend.points.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.points.entity.UserPointLedger;

public interface PointRepository extends JpaRepository<UserPointLedger, Integer> {

	Optional<UserPointLedger> findByUserId(Integer userId);

}
