package com.udong.backend.auth.service;

import com.udong.backend.auth.dto.AccessTokenResponse;
import com.udong.backend.auth.dto.LoginRequest;
import com.udong.backend.auth.entity.RefreshToken;
import com.udong.backend.auth.repository.RefreshTokenRepository;
import com.udong.backend.auth.dto.TokenPair;
import com.udong.backend.global.config.JwtTokenProvider;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EntityManager em; // getReference로 User 추가 SELECT 방지

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       EntityManager em) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.em = em;
    }

    /** 로그인: 헤더=Access, 바디=Refresh */
    public TokenPair login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String userIdStr = user.getId().toString();

        // ✅ userId만 담아서 발급
        String access  = jwtTokenProvider.createAccessToken(userIdStr);
        String refresh = jwtTokenProvider.createRefreshToken(userIdStr);

        // 유저당 1행: 존재하면 해시만 교체, 없으면 생성
        String newHash = sha256(refresh);
        refreshTokenRepository.findByUser_Id(user.getId()).ifPresentOrElse(
                existing -> {
                    existing.setRefreshTokenHash(newHash);
                    refreshTokenRepository.save(existing);
                },
                () -> {
                    User userRef = em.getReference(User.class, user.getId());
                    RefreshToken rt = RefreshToken.builder()
                            .user(userRef)
                            .refreshTokenHash(newHash)
                            .build();
                    refreshTokenRepository.save(rt);
                }
        );

        return new TokenPair(access, refresh);
    }

    @Transactional(readOnly = true)
    public AccessTokenResponse refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "missing_refresh_token");
        }

        String hash = sha256(rawRefreshToken);
        RefreshToken rt = refreshTokenRepository.findByRefreshTokenHash(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token"));

        User user = rt.getUser();
        String newAccess = jwtTokenProvider.createAccessToken(String.valueOf(user.getId()));

        return AccessTokenResponse.builder()
                .accessToken(newAccess)
                .build();
    }

    /** 단일 기기 로그아웃: 전달받은 RT 무효화(삭제) */
    @Transactional  // ← 쓰기 트랜잭션 (readOnly 금지)
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return; // idempotent: 토큰 없으면 그냥 종료
        }
        String hash = sha256(rawRefreshToken);
        refreshTokenRepository.deleteByRefreshTokenHash(hash); // 존재하지 않아도 0건 삭제로 끝
    }

    private static String sha256(String v) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(v.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류(sha256)");
        }
    }
}
