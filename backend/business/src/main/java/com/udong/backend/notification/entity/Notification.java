package com.udong.backend.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notifications")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload; // 알림 내용

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false)
    private Long createdBy; // 알림을 발생시킨 유저 ID

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "target_id", nullable = false)
    private Long targetId; // 알림 클릭 시 이동할 대상의 ID

    // Notification이 삭제될 때 관련된 Delivery 정보도 모두 삭제 (Cascade)
    @OneToMany(mappedBy = "notification", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NotificationDelivery> deliveries = new ArrayList<>();
}
