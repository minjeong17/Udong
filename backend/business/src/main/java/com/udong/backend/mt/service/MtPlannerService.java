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
        int ppl    = (req.people() == null ? 0 : req.people());
        int male   = (req.male() == null ? 0 : req.male());
        int female = (req.female() == null ? 0 : req.female());

        if (ppl > 0 && (male + female) != ppl) {
            log.warn("people != male+female (people={}, male={}, female={})", ppl, male, female);
        }

        // 성비(여성 비율)
        double femaleRatio = (ppl > 0) ? (double) female / ppl : 0.5;

        // 1) 수량 계산
        String meatKg = String.format(java.util.Locale.US, "%.2fkg", ppl * 0.25);

        double beerPerPerson = 0.2 + (0.5 - 0.2) * (1 - femaleRatio);
        String beerCans = String.format("%d캔", Math.round(ppl * beerPerPerson));

        double sojuPerPerson = 1.0 + (1.5 - 1.0) * (1 - femaleRatio);
        String sojuBottles = String.format(java.util.Locale.US, "%.1f병", ppl * sojuPerPerson);

        String liters = ppl + "L";
        String sets   = ppl + "세트";

        String lodgingTotal = String.valueOf(req.lodgingTotal() == null ? 0 : req.lodgingTotal());
        String outdoorFlag  = nullToDash(req.outdoorEnabled());

        // 2) 프롬프트
        String prompt = """
너는 MT 일정 기획 AI다. 아래 입력을 바탕으로 **JSON만** 생성한다.
반드시 필드는 schedule[], supplies[], budget, packingList 네 가지를 사용한다.

[입력]
- MT기간: %s
- 계절: %s
- 참여인원: %s
- 남자 인원: %s
- 여자 인원: %s
- 실외활동 여부(outdoorEnabled): %s
- 숙박비(총액, 원): %s
- 특이사항: %s

[정책]
- 1박2일, Day2는 "청소 및 퇴실"로 종료.
- 바비큐 기본 포함. outdoorEnabled='N'이면 레크리에이션/바비큐 항목에 실내 대체 문구 포함.
- 아래 수량 문자열은 그대로 사용: 고기 "%s", 맥주 "%s", 소주 "%s", 생수 "%s", 일회용품 "%s".
- 주류 산정:
  - 맥주: 인당 0.2~0.5캔(남자 비율이 높을수록 0.5에 가깝게).
  - 소주: 인당 1.0~1.5병(남자 비율이 높을수록 1.5에 가깝게).
- 예산 계산(상한 적용):
  - 식비(총액): 1인 기준 12,000~20,000원 × 총인원.
  - 총액 = 숙박비 + 식비
  - 1인 비용 = 총액 / 인원.
  - **상한:** 인당 최대 40,000원. 초과 시 food=0, activity=0으로 조정하고,
    total과 perPerson은 각각 (총인원×40,000), 40,000으로 강제.
- budget 객체는 **lodging, food, total, perPerson 네개의 필드가 항상 포함**되어야 한다. 값이 0이어도 누락하지 말 것.
- packingList는 [필수], [권장], [제공] 세 그룹.
- 레크리에이션 notes에는 오직 "추천: 게임1, 게임2, ..." 형태만 넣는다.

[출력 스키마 예시]
{
  "schedule": [
    {"day":1,"timeStart":"09:00","timeEnd":"11:30","title":"집결/이동","place":"학교→숙소","notes":"예상예산(총액): 숙박 {LODGING}, 식비 {FOOD}, 활동 {ACT}, 합계 {TOTAL} | 1인 예상: {PAX} | 인원: 남 %s명 / 여 %s명"},
    {"day":1,"timeStart":"11:30","timeEnd":"12:30","title":"도착 및 짐 정리","place":"숙소","notes":"방 배정"},
    {"day":1,"timeStart":"12:30","timeEnd":"14:00","title":"점심 식사","place":"현지 맛집","notes":"예약 권장"},
    {"day":1,"timeStart":"15:00","timeEnd":"17:00","title":"레크리에이션","place":"숙소(야외/실내)","notes":"추천: 팀 빙고, 몸으로 말해요, 릴레이 퀴즈, 보물찾기, 젠가/할리갈리"},
    {"day":1,"timeStart":"17:30","timeEnd":"20:00","title":"바비큐 파티","place":"숙소 야외","notes":"실외 불가 시 전기그릴 실내 대체"},
    {"day":2,"timeStart":"09:00","timeEnd":"10:00","title":"아침 식사","place":"숙소","notes":"간단식"},
    {"day":2,"timeStart":"10:00","timeEnd":"11:00","title":"청소 및 퇴실","place":"숙소","notes":"체크아웃"}
  ],
  "supplies": [
    {"category":"고기","item":"삼겹살","qtyPerPerson":"250g","qtyTotal":"%s","notes":"여유 5%% 포함"},
    {"category":"주류","item":"맥주","qtyPerPerson":"%.1f캔","qtyTotal":"%s","notes":"성비 고려"},
    {"category":"주류","item":"소주","qtyPerPerson":"%.1f병","qtyTotal":"%s","notes":"성비 고려"},
    {"category":"음료","item":"생수","qtyPerPerson":"1L","qtyTotal":"%s","notes":"추가 확보 권장"},
    {"category":"기타","item":"일회용품","qtyPerPerson":"1세트","qtyTotal":"%s","notes":"컵/접시/젓가락"}
  ],
  "budget": {
    "lodging": {LODGING},
    "food": {FOOD},
    "total": {TOTAL},
    "perPerson": {PAX}
  },
  "packingList": {
    "essential": ["세면도구","운동화","개인약","충전기"],
    "recommended": ["선크림","모자","보드게임"],
    "provided": ["침구류","수건","바비큐용품"]
  }
}
규칙:
- 반드시 JSON만 출력.
- schedule은 반드시 객체 배열이어야 하며 문자열 단독 불가.
- budget의 다섯 필드는 항상 존재해야 한다.
- {LODGING}, {FOOD}, {ACT}, {TOTAL}, {PAX}는 숫자만 채워 넣는다.
""".formatted(
                nullToDash(req.period()),
                nullToDash(req.season()),
                String.valueOf(ppl),
                String.valueOf(male),
                String.valueOf(female),
                outdoorFlag,
                lodgingTotal,
                nullToDash(req.notes()),
                meatKg,
                beerCans,
                sojuBottles,
                liters,
                sets,
                String.valueOf(male), String.valueOf(female),
                meatKg,
                beerPerPerson, beerCans,
                sojuPerPerson, sojuBottles,
                liters, sets
        );

        String json = chat.completeJson(prompt, 1200);
        try {
            return om.readValue(json, MtPlannerDtos.Res.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON: {}", json);
            throw new RuntimeException("응답 파싱 실패: " + e.getMessage());
        }
    }

    private static String nullToDash(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }
}
