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

        String prompt = """
너는 "MT 일정 기획 AI"이다. 아래 입력을 바탕으로 **정확한 계산을 포함한 JSON만** 생성한다.
반드시 다음 4개 최상위 필드를 포함해야 한다: schedule(배열), supplies(배열), budget(객체), packingList(객체).

[입력]
- MT기간: %s
- 계절: %s
- 참여인원(총원): %s
- 남자 인원: %s
- 여자 인원: %s
- 실외활동 여부(outdoorEnabled): %s
- 숙박비(총액, 원): %s
- 특이사항: %s

[기간 해석 규칙 - 매우 중요]
- "1박2일", "2박3일", "3박4일" 같은 형식이 오면, **박수=첫 숫자, 일수=둘째 숫자**로 파싱한다.
- 그 외 형식(예: 날짜 범위)이면, **일수 = (종료일 - 시작일 + 1)**, **박수 = 일수 - 1**로 계산한다.
- **schedule 길이 = 일수에 맞춰 Day1..DayN까지 생성**한다.
  - 마지막 날(DayN)에는 반드시 {"title":"청소 및 퇴실"} 일정으로 종료한다.
  - 1박2일 예: Day1(도착/활동/저녁/바비큐), Day2(아침/정리/퇴실)
  - 2박3일 예: Day1(도착/활동/저녁/바비큐), Day2(점심/레크/저녁/자유), Day3(아침/정리/퇴실)
  - 3박4일도 같은 패턴으로 합리적으로 채운다.

[식자재/주류/소모품 수량 규칙]
- 아래 **수량 문자열은 그대로 사용**한다(모델이 임의 변경 금지).
  - 고기 총량: "%s" (예: "5.00kg")
  - 맥주 총량: "%s" (예: "18캔")
  - 소주 총량: "%s" (예: "24.0병")
  - 생수 총량: "%s" (예: "20L")
  - 일회용품 총량: "%s" (예: "20세트")
- 주류 인당 기준(표시는 참고용이며, 실제 출력은 아래 supplies 예시처럼 넣는다):
  - 맥주 인당: "%.1f" 캔
  - 소주 인당: "%.1f" 병
- outdoorEnabled='N'이면 바비큐/레크리에이션 항목에 **실내 대체 문구**를 포함한다(예: 전기그릴, 보드게임 위주 등).

[예산 계산 규칙 - 숫자만, 콤마 없이, 원 단위 정수]
- 입력: 숙박비(총액, lodging). 총인원 = ppl.
- 식비 상한 범위: **1인 기준 12,000~20,000원**.
- 우선 기본 식비를 ppl × 15,000(중간값)으로 잡되, 필요 시 12,000~20,000 범위 내에서 조정 가능.
- **총액 total = lodging + food**.
- **1인 비용 perPerson = ceil(total / ppl)** (올림).
- **상한 규칙:** perPerson이 40,000을 초과하면,
  - capTotal = 40,000 × ppl
  - **food = max(0, capTotal - lodging)**
  - **total = lodging + food** (단, total이 capTotal을 넘지 않도록 capTotal로 제한)
  - **perPerson = 40,000**
- 예외/코너 케이스:
  - ppl ≤ 0 이거나 수치가 비정상이면 **lodging=0, food=0, total=0, perPerson=0**으로 안전하게 반환.
  - 모든 금액 필드는 **정수(문자열 아님), 콤마 없음**.
- budget 객체는 **반드시** 다음 4개 필드를 포함: lodging, food, total, perPerson. (누락 금지)

[출력 스키마(정확히 이 구조로)]
{
  "schedule": [
    // 길이는 "일수"에 맞춰 Day1..DayN까지.
    // 각 항목: {"day":정수,"timeStart":"HH:mm","timeEnd":"HH:mm","title":"문자열","place":"문자열","notes":"문자열"}
    // 예시(일부):
    // {"day":1,"timeStart":"11:30","timeEnd":"12:30","title":"도착 및 짐 정리","place":"숙소","notes":"방 배정"},
    // {"day":1,"timeStart":"17:30","timeEnd":"20:00","title":"바비큐 파티","place":"숙소 야외","notes":"실외 불가 시 전기그릴 실내 대체"},
    // ...
    // {"day":N,"timeStart":"10:00","timeEnd":"11:00","title":"청소 및 퇴실","place":"숙소","notes":"체크아웃"}
  ],
  "supplies": [
    {"category":"고기","item":"삼겹살","qtyPerPerson":"250g","qtyTotal":"%s","notes":"여유 5%% 포함"},
    {"category":"주류","item":"맥주","qtyPerPerson":"%.1f캔","qtyTotal":"%s","notes":"성비 고려"},
    {"category":"주류","item":"소주","qtyPerPerson":"%.1f병","qtyTotal":"%s","notes":"성비 고려"},
    {"category":"음료","item":"생수","qtyPerPerson":"1L","qtyTotal":"%s","notes":"추가 확보 권장"},
    {"category":"기타","item":"일회용품","qtyPerPerson":"1세트","qtyTotal":"%s","notes":"컵/접시/젓가락"}
  ],
  "budget": {
    "lodging": 정수,
    "food": 정수,
    "total": 정수,
    "perPerson": 정수
  },
  "packingList": {
    "essential": ["세면도구","운동화","개인약","충전기"],
    "recommended": ["선크림","모자","보드게임"],
    "provided": ["침구류","수건","바비큐용품"]
  }
}

[생성 지침]
- **오직 JSON만** 출력(앞뒤 설명/마크다운 금지).
- schedule은 반드시 **객체 배열**(문자열 단독 금지).
- budget 4필드(lodging, food, total, perPerson) **반드시 존재**하고 원 단위 **정수**여야 함.
- 시간대는 현실적으로 겹치지 않게 HH:mm 형식으로 작성.
- 권장/실내 대체 문구는 notes에 간단히.

[검증 체크리스트(너 스스로 점검 후 출력)]
- 기간 파싱이 올바른가? → schedule의 Day1..DayN 길이가 **일수**와 일치하는가?
- 마지막 DayN이 "청소 및 퇴실"로 끝나는가?
- supplies의 고정 수량 문자열이 **그대로** 들어갔는가?
- budget 계산: perPerson ≤ 40000 규칙이 적용됐는가? 정수/콤마 없음?
- ppl=%s, 남=%s, 여=%s 총합이 맞는지 확인(불일치 시 ppl 기준으로 동작).
""".formatted(
                nullToDash(req.period()),
                nullToDash(req.season()),
                String.valueOf(ppl),
                String.valueOf(male),
                String.valueOf(female),
                outdoorFlag,
                lodgingTotal,
                nullToDash(req.notes()),
                meatKg,            // 고기 총량 문자열
                beerCans,          // 맥주 총량 문자열
                sojuBottles,       // 소주 총량 문자열
                liters,            // 생수 총량 문자열
                sets,              // 일회용품 총량 문자열
                beerPerPerson,     // 맥주 인당 수치
                sojuPerPerson,     // 소주 인당 수치
                // ↓ supplies 블럭 재사용
                meatKg,
                beerPerPerson, beerCans,
                sojuPerPerson, sojuBottles,
                liters, sets,
                // 검증용 ppl/gender
                String.valueOf(ppl), String.valueOf(male), String.valueOf(female)
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
