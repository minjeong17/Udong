package com.udong.backend.calendar.entity;

import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "event_members",
        uniqueConstraints = {
                // 같은 이벤트에 동일 유저 중복 가입 방지 (원치 않으면 제거하세요)
                @UniqueConstraint(name = "uk_event_member_event_user", columnNames = {"event_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_event_member_event", columnList = "event_id"),
                @Index(name = "idx_event_member_user", columnList = "user_id")
        }
)
public class EventMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // 이벤트멤버ID

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt; // 참여시간

    /** FK: users.id */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_member_user"))
    private User user;

    /** FK: events.id */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_member_event"))
    private Event event;

    /** 참여여부 (TINYINT(1) -> boolean) */
    @Builder.Default
    @Column(name = "is_participated", nullable = false)
    private boolean isParticipated = true;
}
