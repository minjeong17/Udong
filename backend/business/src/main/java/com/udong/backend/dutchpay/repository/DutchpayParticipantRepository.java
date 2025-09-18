package com.udong.backend.dutchpay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.udong.backend.dutchpay.entity.DutchpayParticipant;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface DutchpayParticipantRepository extends JpaRepository<DutchpayParticipant, Integer> {

    // participants + user를 한 번에
    @EntityGraph(attributePaths = {"user"})
    List<DutchpayParticipant> findByDutchpayId(Integer dutchpayId);
}