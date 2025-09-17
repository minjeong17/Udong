package com.udong.backend.auth.entity;

import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "user_refresh_token",
        uniqueConstraints = {
                // 사용자당 1행만 유지하려면 user_id 유니크
                @UniqueConstraint(name = "uk_user_refresh_token_user", columnNames = "user_id")
        },
        indexes = {
                @Index(name = "idx_refresh_token_hash", columnList = "refresh_token_hash")
        }
)
public class RefreshToken {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 원문 저장 금지: 해시만 저장
    @Setter
    @Column(name = "refresh_token_hash", nullable = false, length = 128)
    private String refreshTokenHash;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)  // 유저당 1개 보장
    private User user;

    // 첫 생성 시각(첫 로그인/최초 발급)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 해시 교체(재로그인/재발급) 시 자동 갱신
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
