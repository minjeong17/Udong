package com.udong.backend.clubdues.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_dues_status")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubDuesStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "dues_status", nullable = false)
    private Byte duesStatus; // 0: 미납, 1: 납부완료

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dues_id", nullable = false)
    private ClubDues dues;

    @Column(name = "user_id", nullable = false)
    private Integer userId;
}