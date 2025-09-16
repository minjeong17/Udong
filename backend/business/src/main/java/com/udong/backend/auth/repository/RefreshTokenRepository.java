package com.udong.backend.auth.repository;

import com.udong.backend.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByUser_Id(Long userId);          // 유저당 1행
    Optional<RefreshToken> findByRefreshTokenHash(String hash); // 필요시 검증용
    long deleteByRefreshTokenHash(String refreshTokenHash);
}
