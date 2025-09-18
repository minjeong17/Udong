package com.udong.backend.clubs.repository;

import com.udong.backend.clubs.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Integer> {
    boolean existsByUserIdAndClub_Id(Integer userId, Integer clubId);
    Optional<Membership> findByUserIdAndClub_Id(Integer userId, Integer clubId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.club WHERE m.userId = :userId")
    List<Membership> findByUserIdFetchClub(@Param("userId") Integer userId);
}
