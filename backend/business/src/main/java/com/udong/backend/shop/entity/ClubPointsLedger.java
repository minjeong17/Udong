package com.udong.backend.shop.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "club_points_ledger",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_club_points_ledger_club_id", columnNames = "club_id")
        },
        indexes = {
                @Index(name = "idx_club_points_ledger_club_id", columnList = "club_id")
        }
)
public class ClubPointsLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 누적 포인트 */
    @Column(name = "point", nullable = false)
    private int point;

    /** 동아리 ID (연관관계 미설정, FK만 보유) */
    @Column(name = "club_id", nullable = false)
    private Long clubId;

    /** 최초 생성용 */
    public static ClubPointsLedger createZero(Long clubId) {
        return ClubPointsLedger.builder()
                .clubId(clubId)
                .point(0)
                .build();
    }

    /** 증가(+)/감소(-) 모두 허용 */
    public void addPoints(int delta) {
        this.point += delta;
        if (this.point < 0) this.point = 0; // 음수 허용하지 않으려면 유지
    }

    /** 직접 세팅이 필요할 때만 사용 */
    public void setPoints(int newPoint) {
        if (newPoint < 0) throw new IllegalArgumentException("point cannot be negative");
        this.point = newPoint;
    }
}
