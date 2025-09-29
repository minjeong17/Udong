package com.udong.backend.shop.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.udong.backend.shop.entity.ClubPointsLedger;

public interface ClubPointsLedgerRepository extends JpaRepository<ClubPointsLedger, Long> {

    Optional<ClubPointsLedger> findByClubId(Long clubId);

}