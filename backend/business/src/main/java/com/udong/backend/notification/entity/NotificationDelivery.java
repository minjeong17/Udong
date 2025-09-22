package com.udong.backend.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_deliveries")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "has_read", nullable = false)
    private boolean hasRead = false; // 기본값 false

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "user_id", nullable = false)
    private Long userId; // 수신자 ID

    @ManyToOne(fetch = FetchType.LAZY) // 성능을 위해 LAZY 로딩 설정
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    //== 비즈니스 로직 ==//
    public void read() {
        this.hasRead = true;
    }
}
