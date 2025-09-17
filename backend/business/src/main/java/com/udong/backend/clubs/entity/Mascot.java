package com.udong.backend.clubs.entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;


@Entity @Table(name = "mascots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mascot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id")
    private Club club;


    @Column(name = "s3_key", length = 1024)
    private String s3Key;


    @Column(name = "image_url", length = 500, nullable = false)
    private String imageUrl;


    @Lob @Column(name = "prompt_meta", nullable = false)
    private String promptMeta;


    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
