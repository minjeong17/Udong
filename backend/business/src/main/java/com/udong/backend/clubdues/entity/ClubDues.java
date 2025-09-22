package com.udong.backend.clubdues.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.udong.backend.clubs.entity.Club;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_dues")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubDues {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "membership_dues", nullable = false)
    private Integer membershipDues;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(name = "dues_no", nullable = false)
    private Integer duesNo;
}