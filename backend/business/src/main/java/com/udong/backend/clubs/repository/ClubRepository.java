package com.udong.backend.clubs.repository;


import com.udong.backend.clubs.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;


public interface ClubRepository extends JpaRepository<Club, Integer> {
    boolean existsByName(String name);
    Optional<Club> findByCodeUrl(String codeUrl);
    boolean existsByCodeUrl(String codeUrl);
}
