package com.udong.backend.clubs.repository;


import com.udong.backend.clubs.entity.Mascot;
import com.udong.backend.clubs.entity.Club;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface MascotRepository extends JpaRepository<Mascot, Integer> {
    Page<Mascot> findByClubOrderByIdDesc(Club club, Pageable pageable);

    @Query("SELECT m FROM Mascot m JOIN FETCH m.club WHERE m.id = :id")
    Optional<Mascot> findByIdWithClub(@Param("id") Integer id);

    @Query("""
           SELECT m
           FROM Club c
           JOIN c.activeMascot m
           JOIN FETCH m.club
           WHERE c.id = :clubId
           """)
    Mascot findActiveByClubIdWithClub(@Param("clubId") Integer clubId);

}
