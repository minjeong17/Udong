package com.udong.backend.clubs.repository;


import com.udong.backend.clubs.entity.Mascot;
import com.udong.backend.clubs.entity.Club;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


public interface MascotRepository extends JpaRepository<Mascot, Integer> {
    Page<Mascot> findByClubOrderByIdDesc(Club club, Pageable pageable);
}
