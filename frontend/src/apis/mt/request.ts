export interface MtPlannerRequest {
  period: string;              // "1박 2일"
  season: string;              // "봄/여름/가을/겨울"
  people: number;              // 참여 인원
  male: number;                // 남자 인원
  female: number;              // 여자 인원
  outdoorEnabled: "Y" | "N";   // 백엔드 DTO가 String이라서 그대로 맞춤
  lodgingTotal: number;        // 숙박비 총액
  notes?: string;              // 특이사항
}