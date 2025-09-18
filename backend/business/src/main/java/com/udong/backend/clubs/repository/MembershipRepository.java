package com.udong.backend.clubs.repository;

import com.udong.backend.clubs.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MembershipRepository extends JpaRepository<Membership, Integer> {
    boolean existsByUserIdAndClub_Id(Integer userId, Integer clubId);

    @Query("""
           select m
           from Membership m
           join fetch m.club c
           where m.userId = :userId
           """)
    List<Membership> findByUserIdFetchClub(@Param("userId") Integer userId);

    boolean existsByClub_IdAndUserId(Integer clubId, Integer userId);
}
