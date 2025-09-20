// com.udong.backend.clubfund.entity.ClubFundReceipt
package com.udong.backend.clubfund.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
    name = "club_fund_receipts",
    uniqueConstraints = {
        // 같은 거래 1건당 영수증 1개만
        @UniqueConstraint(name = "uk_receipt_txn", columnNames = "transaction_id")
    }
)
public class ClubFundReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "memo", length = 100)
    private String memo; // 메모

    @Column(name = "image_url", length = 500)
    private String imageUrl; // 영수증 이미지주소

    @Column(name = "s3_key", length = 1024)
    private String s3Key; // s3 key

    @Column(name = "club_id", nullable = false)
    private Integer clubId; // 동아리ID (FK)

    /** 외부 거래 고유번호(= FinOpenAPI transactionUniqueNo) */
    @Column(name = "transaction_id", nullable = false)
    private Integer transactionId;

    /** 생성일시 */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
