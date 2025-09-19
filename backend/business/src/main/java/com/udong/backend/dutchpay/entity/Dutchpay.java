package com.udong.backend.dutchpay.entity;

import com.udong.backend.calendar.entity.Event;
import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"event", "createdBy", "participants"})
@Entity
@Table(
        name = "dutchpays",
        indexes = {
                @Index(name = "idx_dutchpay_event", columnList = "event_id"),
                @Index(name = "idx_dutchpay_created_by", columnList = "created_by")
        }
)
public class Dutchpay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** 총 금액 */
    @Column(nullable = false)
    private Integer amount;

    /** 메모 */
    @Column(length = 100)
    private String note;

    /** 생성 시각 */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 행사 FK */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** 주최자(작성자) FK → users.id */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** 영수증 S3 key */
    @Column(name = "s3_key", length = 1024)
    private String s3Key;

    /** 영수증 이미지 주소 */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** 정산 종료 여부 */
    @Column(name = "is_done", nullable = false)
    private boolean isDone;

    /** 참여자 목록 */
    @OneToMany(mappedBy = "dutchpay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DutchpayParticipant> participants = new ArrayList<>();

    // =========================
    // 양방향 편의 메서드
    // =========================

    /** 참가자 추가 (양방향 고정) */
    public void addParticipant(DutchpayParticipant p) {
        participants.add(p);   // contains() 체크하지 말기
        p.setDutchpay(this);
    }

    /** 참가자 제거 (양방향 해제 + orphanRemoval 로 삭제) */
    public void removeParticipant(DutchpayParticipant participant) {
        if (participant == null) return;
        if (this.participants.remove(participant)) {
            participant.setDutchpay(null); // 역방향 해제
        }
    }

    /** 행사 교체 시 null 안전 처리 */
    public void changeEvent(Event newEvent) {
        this.event = newEvent;
    }

    /** 작성자 교체 시 null 안전 처리 */
    public void changeCreatedBy(User newCreator) {
        this.createdBy = newCreator;
    }
}
