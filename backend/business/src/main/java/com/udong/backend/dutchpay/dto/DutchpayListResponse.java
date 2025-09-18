package com.udong.backend.dutchpay.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Builder
public class DutchpayListResponse {

    private Integer id;               // d.id
    private LocalDateTime createdAt;  // d.createdAt
    private String note;              // d.note
    private Integer amount;           // d.amount
    private Long participantCount;    // (select count(...)) -> Long !!!
    private Integer eventId;          // e.id
    private String eventTitle;        // e.title

    // JPQL constructor expression과 "완전히" 동일한 시그니처
    public DutchpayListResponse(
            Integer id,
            LocalDateTime createdAt,
            String note,
            Integer amount,
            Long participantCount,   // <-- Long이어야 함
            Integer eventId,
            String eventTitle
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.note = note;
        this.amount = amount;
        this.participantCount = (participantCount == null) ? 0L : participantCount;
        this.eventId = eventId;
        this.eventTitle = eventTitle;
    }
}
