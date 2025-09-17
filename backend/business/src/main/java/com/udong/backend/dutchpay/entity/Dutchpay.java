package com.udong.backend.dutchpay.entity;

import com.udong.backend.events.entity.Event;
import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "dutchpay",
        indexes = {
                @Index(name = "idx_dutchpay_event", columnList = "event_id"),
                @Index(name = "idx_dutchpay_created_by", columnList = "created_by")
        }
)
public class Dutchpay {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)           // 총 금액
    private Integer amount;

    @Column(length = 100)               // 메모
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)   // FK: events.id
    private Event event;

    /** 주최자(FK: users.id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)   // 기존 컬럼명 유지
    private User createdBy;

    @Column(name = "s3_key", length = 1024)           // 영수증 S3 key
    private String s3Key;

    @Column(name = "image_url", length = 500)         // 영수증 이미지 주소
    private String imageUrl;

    @Column(name = "is_done", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean isDone;

    // 참여자
    @OneToMany(mappedBy = "dutchpay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DutchpayParticipant> participants = new ArrayList<>();

    // 편의 메서드
    public void addParticipant(DutchpayParticipant p) {
        participants.add(p);
        p.setDutchpay(this);
    }
}
