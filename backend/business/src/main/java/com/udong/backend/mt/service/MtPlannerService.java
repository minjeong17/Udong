package com.udong.backend.mt.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.udong.backend.mt.dto.MtPlannerDtos;
import com.udong.backend.mt.gms.GmsChatClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MtPlannerService {

    private final GmsChatClient chat;
    private final ObjectMapper om = new ObjectMapper();

    public MtPlannerDtos.Res generate(MtPlannerDtos.Req req) {
        int ppl = (req.people() == null ? 0 : req.people());

        // 1) 수량 계산(문자열로 준비)
        String meatKg      = String.format(java.util.Locale.US, "%.2fkg", ppl * 0.25); // 0.25kg/인
        String beerCans    = (ppl * 2) + "캔";                                         // 2캔/인
        String sojuBottles = String.format(java.util.Locale.US, "%.1f병", ppl * 0.5);  // 0.5병/인
        String liters      = ppl + "L";
        String sets        = ppl + "세트";

        // 2) 프롬프트(모두 %s만 사용: 인덱스 지정 서식자 삭제)
        String prompt = """
너는 MT 일정 기획 AI다. 아래 5개 입력을 바탕으로 JSON만 생성한다.
필드는 schedule[], supplies[]만 사용한다.
각 qtyTotal은 실제 숫자로 계산하여 기입한다(합리적 반올림).

[입력]
- MT기간: %s
- 예상날씨: %s
- 참여인원: %s
- 성비: %s
- 특이사항: %s

[출력 스키마 예시]
{
  "schedule": [
    {"day":1,"timeStart":"10:00","timeEnd":"12:00","title":"집결/이동","place":"학교 → 숙소","notes":"차량 배정"},
    {"day":1,"timeStart":"12:00","timeEnd":"13:30","title":"점심식사","place":"현지 식당","notes":"예약 권장"},
    {"day":1,"timeStart":"15:00","timeEnd":"17:00","title":"레크리에이션","place":"숙소(야외/실내)","notes":"추천: 팀 빙고, 몸으로 말해요, 릴레이 게임"},
    {"day":1,"timeStart":"17:30","timeEnd":"20:00","title":"바비큐 파티","place":"숙소 야외","notes":"우천 시 실내 대체"},
    {"day":2,"timeStart":"09:00","timeEnd":"10:00","title":"아침식사","place":"숙소","notes":"간단식"},
    {"day":2,"timeStart":"10:00","timeEnd":"11:00","title":"청소 및 퇴실","place":"숙소","notes":"체크아웃 준비"}
  ],
  "supplies": [
    {"category":"고기","item":"삼겹살","qtyPerPerson":"250g","qtyTotal":"%s","notes":"여유 5%% 포함"},
    {"category":"주류","item":"맥주","qtyPerPerson":"2캔","qtyTotal":"%s","notes":"남녀 동일"},
    {"category":"주류","item":"소주","qtyPerPerson":"0.5병","qtyTotal":"%s","notes":"적당량"},
    {"category":"음료","item":"생수","qtyPerPerson":"1L","qtyTotal":"%s","notes":"추가 확보 권장"},
    {"category":"기타","item":"일회용품","qtyPerPerson":"1세트","qtyTotal":"%s","notes":"컵/접시/젓가락"},
    {"category":"게임용품","item":"빙고판·화이트보드·마커","qtyPerPerson":"-","qtyTotal":"팀당 1세트","notes":"3팀 기준 3세트"}
  ]
}
규칙: 반드시 JSON만 출력. 날씨가 비/우천이면 레크리에이션/바비큐에 실내 대체 문구 포함.
""".formatted(
                nullToDash(req.period()),
                nullToDash(req.weather()),
                String.valueOf(ppl),
                nullToDash(req.genderRatio()),
                nullToDash(req.notes()),
                meatKg, beerCans, sojuBottles, liters, sets
        );

        String json = chat.completeJson(prompt, 1200);
        try {
            return om.readValue(json, MtPlannerDtos.Res.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON: {}", json);
            throw new RuntimeException("응답 파싱 실패: " + e.getMessage());
        }
    }




    private static String nullToDash(String s) { return (s == null || s.isBlank()) ? "-" : s; }
}
