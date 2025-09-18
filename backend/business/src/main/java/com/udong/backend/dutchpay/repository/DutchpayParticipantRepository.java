package com.udong.backend.dutchpay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.udong.backend.dutchpay.entity.DutchpayParticipant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DutchpayParticipantRepository extends JpaRepository<DutchpayParticipant, Integer> {

    // participants + user를 한 번에
    @EntityGraph(attributePaths = {"user"})
    List<DutchpayParticipant> findByDutchpayId(Integer dutchpayId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
           update DutchpayParticipant p
              set p.isPaid = true
            where p.dutchpay.id = :dutchpayId
              and p.user.id     = :userId
           """)
    int markPaid(@Param("dutchpayId") Integer dutchpayId,
                 @Param("userId") Integer userId);
}