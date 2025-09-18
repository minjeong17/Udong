package com.udong.backend.events.entity;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "events",
        indexes = {
                @Index(name = "idx_events_club", columnList = "club_id"),
                @Index(name = "idx_events_created_by", columnList = "created_by"),
                @Index(name = "idx_events_start_at", columnList = "start_at")
        })
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100, nullable = false)
    private String title;

    @Lob
    private String content;                 // TEXT (nullable)

    @Column(length = 200)
    private String place;                   // nullable

    @Column
    private Short capacity;                 // SMALLINT (nullable)

    @Column(name = "expected_cost")
    private Integer expectedCost;           // nullable

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at")               // ERD상 NULL 허용
    private LocalDateTime endAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // FK: clubs.id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    // FK: users.id (주최자)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // LIGHTNING, REGULAR, MT (문자열로 저장)
    @Column(length = 50, nullable = false)
    private String type;

    // 필요 시 enum 사용 원하시면 아래 주석처럼 대체 가능
    // public enum EventType { LIGHTNING, REGULAR, MT }
    // @Enumerated(EnumType.STRING)
    // @Column(length = 50, nullable = false)
    // private EventType type;
}
