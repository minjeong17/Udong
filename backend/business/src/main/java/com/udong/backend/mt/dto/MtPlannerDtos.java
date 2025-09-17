package com.udong.backend.mt.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

public class MtPlannerDtos {

    // === API Request ===
    public record Req(
            String period,         // MT기간 (e.g., "1박 2일")
            String weather,        // 예상날씨 (e.g., "맑음")
            Integer people,        // 참여인원 (정수)
            String genderRatio,    // 성비 (e.g., "남12/여8")
            String notes           // 특이사항
    ) {}

    // === API Response ===
    public record Res(
            List<ScheduleItem> schedule,
            List<SupplyItem> supplies
    ) {}

    public record ScheduleItem(
            int day,
            String timeStart,
            String timeEnd,
            String title,
            String place,
            @JsonInclude(JsonInclude.Include.NON_NULL)
            String notes
    ) {}

    public record SupplyItem(
            String category,
            String item,
            String qtyPerPerson,   // "250g", "2캔" 등
            String qtyTotal,       // "5kg", "40캔" 등
            @JsonInclude(JsonInclude.Include.NON_NULL)
            String notes
    ) {}
}
