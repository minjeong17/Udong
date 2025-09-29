package com.udong.backend.mt.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

public class MtPlannerDtos {

    // === API Request ===
    public record Req(
            String period,            // MT기간 (예: "1박 2일")
            String season,            // 계절 (예: "봄/여름/가을/겨울")
            Integer people,           // 참여인원
            Integer male,             // 남자 인원
            Integer female,           // 여자 인원
            String outdoorEnabled,    // "Y" / "N"
            Integer lodgingTotal,     // 숙박비(총액, 원)
            String notes              // 특이사항
    ) {}

    // === API Response ===
    public record Res(
            List<ScheduleItem> schedule,
            List<SupplyItem> supplies,
            Budget budget,
            PackingList packingList
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

    public record Budget(
            int lodging,   // 숙박비 총액
            int food,      // 식비 총액
            int total,     // 총액
            int perPerson  // 1인 비용
    ) {}

    public record PackingList(
            List<String> essential,   // 필수
            List<String> recommended, // 권장
            List<String> provided     // 제공
    ) {}
}
