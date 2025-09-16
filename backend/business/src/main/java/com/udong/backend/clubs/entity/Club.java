package com.udong.backend.clubs.entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;


@Entity @Table(name = "clubs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @Column(length = 60, nullable = false)
    private String name;


    @Column(length = 60, nullable = false)
    private String category;


    @Lob
    private String description;


    @Column(name = "code_url", length = 10, nullable = false, unique = true)
    private String codeUrl;


    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();


    @Column(name = "account_cipher", length = 512, nullable = false)
    private String accountCipher = ""; // 기본값


    @Column(name = "account_key_ver", nullable = false)
    private Short accountKeyVer = 0;


    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_mascot_id")
    private Mascot activeMascot;


    @Column(name = "leader_user_id", nullable = false)
    private Integer leaderUserId; // 유저 테이블과 FK는 범위 밖이므로 값만 저장

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
