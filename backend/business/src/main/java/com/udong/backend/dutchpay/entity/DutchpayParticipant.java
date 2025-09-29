package com.udong.backend.dutchpay.entity;

import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@ToString(exclude = {"dutchpay", "user"})
@Entity
@Table(
        name = "dutchpay_participants",
        indexes = {
                @Index(name = "idx_participants_dutchpay", columnList = "dutchpay_id"),
                @Index(name = "idx_participants_user", columnList = "user_id")
        }
)
public class DutchpayParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** 정산 본문 FK */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dutchpay_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Dutchpay dutchpay;

    /** 참여 유저 FK */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 납부 여부 (TINYINT(1) ↔ boolean 자동 매핑) */
    @Column(name = "is_paid", nullable = false)
    private boolean isPaid;

    // =========================
    // 양방향 편의 메서드
    // =========================

    /** 소속 정산 교체 시 컬렉션 정합성 유지 */
    public void setDutchpay(Dutchpay newDutchpay) {
        // 기존 관계 끊기
        if (this.dutchpay != null && this.dutchpay.getParticipants() != null) {
            this.dutchpay.getParticipants().remove(this);
        }
        this.dutchpay = newDutchpay;
        // 새 관계 연결
        if (newDutchpay != null && !newDutchpay.getParticipants().contains(this)) {
            newDutchpay.getParticipants().add(this);
        }
    }

    /** 참여 사용자 교체 */
    public void changeUser(User newUser) {
        this.user = newUser;
    }

    /** 납부 상태 토글/설정 */
    public void markPaid(boolean paid) {
        this.isPaid = paid;
    }
}
