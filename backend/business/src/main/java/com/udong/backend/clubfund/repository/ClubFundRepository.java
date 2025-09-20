// com.udong.backend.clubfund.repository.ClubFundRepository
package com.udong.backend.clubfund.repository;

import com.udong.backend.clubfund.entity.ClubFund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubFundRepository extends JpaRepository<ClubFund, Integer> {
    Optional<ClubFund> findByClubId(Integer clubId);
}
