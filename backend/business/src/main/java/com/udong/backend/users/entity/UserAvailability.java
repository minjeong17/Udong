package com.udong.backend.users.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "user_availability",
        indexes = {
                @Index(name = "idx_user_availability_user_id", columnList = "user_id"),
                @Index(name = "idx_user_availability_day_of_week", columnList = "day_of_week")
        })
public class UserAvailability {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") // INT AUTO_INCREMENT
    private Long id;

    // 팀 규칙에 맞게 0~6(일~토) 혹은 1~7(월~일) 사용
    @Column(name = "day_of_week", nullable = false) // TINYINT
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ===== 연관관계 매핑 (N:1) =====
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false) // FK(users.id)
    private User user;
}
