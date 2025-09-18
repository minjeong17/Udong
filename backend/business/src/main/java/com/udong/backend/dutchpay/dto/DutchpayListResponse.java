package com.udong.backend.dutchpay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DutchpayListResponse {

    private Integer id;             // 정산 ID
    private LocalDateTime createdAt; // 생성일시
    private String note;            // 메모
    private Integer amount;
    private int participantCount;   // 총 인원 수
    private Long eventId;        // 행사 ID
    private String eventTitle;      // 행사 제목

    public DutchpayListResponse(Integer id,
                                LocalDateTime createdAt,
                                String note,
                                Integer amount,
                                Long participantCount,   // count(p) → Long
                                Integer eventId,         // e.id → Integer
                                String eventTitle) {
        this.id = id;
        this.createdAt = createdAt;
        this.note = note;
        this.amount = amount;
        this.participantCount = (participantCount == null) ? 0 : participantCount.intValue();
        this.eventId = (eventId == null) ? null : eventId.longValue();
        this.eventTitle = eventTitle;
    }
}
