package com.udong.backend.points.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.points.entity.UserPointLedger;

public interface PointRepository extends JpaRepository<UserPointLedger, Integer> {

}
