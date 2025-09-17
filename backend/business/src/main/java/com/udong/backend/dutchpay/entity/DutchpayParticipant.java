package com.udong.backend.dutchpay.entity;

import com.udong.backend.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "dutchpay_participants",
        indexes = {
                @Index(name = "idx_participants_dutchpay", columnList = "dutchpay_id"),
                @Index(name = "idx_participants_user", columnList = "user_id")
        }
)
public class DutchpayParticipant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dutchpay_id", nullable = false)
    private Dutchpay dutchpay;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_paid", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean isPaid;
}
