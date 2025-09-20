// com.udong.backend.clubfund.entity.ClubFund
package com.udong.backend.clubfund.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "club_fund")
public class ClubFund {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** 남은 금고 */
    @Column(name = "total_money", nullable = false)
    private Integer totalMoney;

    /** 동아리ID (FK) */
    @Column(name = "club_id", nullable = false)
    private Integer clubId;
}
