// src/pages/MtPlanner.tsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import { MtPlannerApi } from "../apis/mt";
import type { MtPlannerRequest, MtPlannerResponse } from "../apis/mt";
import ExcelJS from "exceljs";

interface MtPlannerProps {
  onNavigateToOnboarding: () => void;
}

const MtPlanner: React.FC<MtPlannerProps> = ({ onNavigateToOnboarding }) => {
  const [mtPlan, setMtPlan] = useState<MtPlannerResponse | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MtPlannerRequest>({
    period: "",
    season: "",
    people: 0,
    male: 0,
    female: 0,
    outdoorEnabled: "Y",
    lodgingTotal: 0,
    notes: "",
  });

  const [inputValues, setInputValues] = useState({
    male: "",
    female: "",
    lodgingTotal: "",
  });

  useEffect(() => {
    const male = Number(inputValues.male) || 0;
    const female = Number(inputValues.female) || 0;
    setFormData((prev) => ({
      ...prev,
      male,
      female,
      people: male + female,
      lodgingTotal: Number(inputValues.lodgingTotal) || 0,
    }));
  }, [inputValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result: MtPlannerResponse = await MtPlannerApi.generatePlan(
        formData
      );
      console.log("API 응답:", result);
      setMtPlan(result);
      setShowPlanModal(false);
    } catch (error: any) {
      console.error("MT 계획 생성 실패:", error);
      alert("MT 계획 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------- XLSX helpers (엑셀 내보내기) ---------- */
  const downloadScheduleXLSX = async (
    filename: string,
    schedule: MtPlannerResponse["schedule"]
  ) => {
    const wb = new ExcelJS.Workbook();
    wb.created = new Date();

    const ws = wb.addWorksheet("MT 일정표", {
      views: [{ state: "frozen", ySplit: 1 }], // 헤더 1행 고정
      properties: { defaultRowHeight: 18 },
    });

    // 열 정의
    ws.columns = [
      { header: "일차", key: "day", width: 10 },
      { header: "순서", key: "order", width: 8 },
      { header: "일정 제목", key: "title", width: 28 },
      { header: "시작", key: "start", width: 10 },
      { header: "종료", key: "end", width: 10 },
      { header: "장소", key: "place", width: 22 },
      { header: "비고/세부", key: "notes", width: 40 },
    ];

    // 헤더 스타일
    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // 데이터 행 추가
    schedule.forEach((item, idx) => {
      ws.addRow({
        day: `${item.day}일차`,
        order: idx + 1,
        title: item.title ?? "",
        start: item.timeStart ?? "",
        end: item.timeEnd ?? "",
        place: item.place ?? "",
        notes: item.notes ?? "",
      });
    });

    // 본문 스타일
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFEEEEEE" } },
          left: { style: "thin", color: { argb: "FFEEEEEE" } },
          bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
          right: { style: "thin", color: { argb: "FFEEEEEE" } },
        };
      });
    });

    // 시작/종료 가운데 정렬
    ["D", "E"].forEach((col) => {
      for (let r = 2; r <= ws.rowCount; r++) {
        ws.getCell(`${col}${r}`).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }
    });

    // 자동필터
    ws.autoFilter = { from: "A1", to: "G1" };

    // (containsText → expression + SEARCH) + priority 추가
    if (ws.rowCount >= 2) {
      ws.addConditionalFormatting({
        ref: `G2:G${ws.rowCount}`,
        rules: [
          {
            type: "expression",
            priority: 1, // ✅ Required in TS types for expression rule
            // 셀에 "주의" 문자열이 포함되어 있으면 TRUE
            formulae: ['ISNUMBER(SEARCH("주의",G2))'],
            style: {
              font: { color: { argb: "FFB00000" }, bold: true },
              fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFE5E5" },
              },
            },
          },
        ],
      });
    }

    // 버퍼 -> Blob -> 다운로드
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#fcf9f5]">
      {/* Left Sidebar */}
      <Sidebar
        onNavigateToOnboarding={onNavigateToOnboarding}
        onShowNotification={() => setShowNotificationModal(true)}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Content */}
        <div className="p-8 flex-1 overflow-auto">
          {!mtPlan ? (
            <div className="max-w-4xl mx-auto">
              <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                  alt="MT 계획 배경 이미지"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h2 className="text-4xl font-bold mb-2 drop-shadow-lg font-jua">
                    완벽한 MT 계획
                  </h2>
                  <p className="text-xl opacity-90 drop-shadow-md font-maplestory font-bold">
                    AI가 도와주는 맞춤형 MT 플래닝
                  </p>
                </div>
              </div>

              <div className="text-center mb-12">
                <div className="text-6xl mb-6">🏕️</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4 font-jua">
                  MT 계획 생성기
                </h2>
                <p className="text-lg text-gray-600 mb-8 font-maplestory font-bold">
                  몇 가지 정보만 입력하면 완벽한 MT 계획을 자동으로
                  생성해드립니다
                </p>
                <button
                  onClick={() => {
                    setShowPlanModal(true);
                  }}
                  className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 font-jua"
                >
                  ✨ MT 계획 시작하기
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8 pt-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 font-jua">
                    MT 계획서
                  </h2>
                  <p className="text-black font-maplestory font-bold">
                    생성된 MT 계획을 확인하고 수정하세요
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setMtPlan(null);
                      setFormData({
                        period: "",
                        season: "",
                        people: 0,
                        male: 0,
                        female: 0,
                        outdoorEnabled: "Y",
                        lodgingTotal: 0,
                        notes: "",
                      });
                      setInputValues({
                        male: "",
                        female: "",
                        lodgingTotal: "",
                      });
                      setShowPlanModal(true);
                    }}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 font-jua"
                  >
                    <span>🔄</span>
                    <span>새로 만들기</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 일정표 */}
                <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-jua">
                      <span>📅</span>
                      상세 일정표
                    </h3>

                    <button
                      onClick={async () => {
                        if (!mtPlan) return;
                        const stamp = new Date()
                          .toISOString()
                          .slice(0, 10)
                          .replace(/-/g, "");
                        await downloadScheduleXLSX(
                          `mt_상세일정_${stamp}.xlsx`,
                          mtPlan.schedule
                        );
                      }}
                      title="현재 일정표를 엑셀로 저장"
                      className="rounded-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                    >
                      ⬇️ 엑셀로 내보내기
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mtPlan.schedule.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg"
                      >
                        <div className="text-orange-600 font-bold text-sm w-20 font-jua">
                          {item.day}일차
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 font-jua">
                            {item.title}
                          </div>
                          <div className="text-black text-sm font-maplestory font-bold">
                            {item.timeStart} ~ {item.timeEnd} / {item.place}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-black font-maplestory font-bold">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 준비물 */}
                <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-jua">
                    <span>🎒</span>
                    준비물 리스트
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-red-500 mb-2 font-jua">
                        필수 준비물
                      </h4>
                      <ul className="space-y-1">
                        {mtPlan.packingList.essential.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-black flex items-center gap-2 font-maplestory font-bold"
                          >
                            <span className="text-red-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-500 mb-2 font-jua">
                        권장 준비물
                      </h4>
                      <ul className="space-y-1">
                        {mtPlan.packingList.recommended.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-black flex items-center gap-2 font-maplestory font-bold"
                          >
                            <span className="text-orange-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-500 mb-2 font-jua">
                        제공 물품
                      </h4>
                      <ul className="space-y-1">
                        {mtPlan.packingList.provided.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-black flex items-center gap-2 font-maplestory font-bold"
                          >
                            <span className="text-green-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 예산 */}
                <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-jua">
                    <span>💰</span>
                    예상 예산
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black font-maplestory font-bold">숙박비</span>
                      <span className="font-medium font-jua">
                        {mtPlan.budget.lodging.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black font-maplestory font-bold">식비</span>
                      <span className="font-medium font-jua">
                        {mtPlan.budget.food.toLocaleString()}원
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-orange-600 font-jua">
                        <span>총 예산</span>
                        <span>{mtPlan.budget.total.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-black font-jua text-sm">
                        <span>1인당</span>
                        <span>
                          {mtPlan.budget.perPerson.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 식재료 / 공급품 */}
                <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-jua">
                    <span>🥘</span>
                    식재료 및 준비물
                  </h3>
                  <ul className="space-y-2">
                    {mtPlan.supplies.map((supply, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between text-sm text-black font-maplestory font-bold"
                      >
                        <span>
                          [{supply.category}] {supply.item} (
                          {supply.qtyPerPerson} × {formData.people}
                          명)
                        </span>
                        <span className="font-medium">{supply.qtyTotal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🏕️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 font-jua">
                    MT 정보 입력
                  </h3>
                  <p className="text-black text-sm mt-1 font-maplestory font-bold">
                    MT 계획 생성을 위한 기본 정보를 입력해주세요
                  </p>
                </div>
              </div>
              <button
                className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-xl flex items-center justify-center text-orange-600 hover:text-orange-700 transition-all duration-200"
                onClick={() => setShowPlanModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4">
                {/* 기간 */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-orange-600">⏰</span>
                    MT 기간 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) =>
                      setFormData({ ...formData, period: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                    required
                  >
                    <option value="">기간을 선택하세요</option>
                    <option value="1박 2일">1박 2일</option>
                    <option value="2박 3일">2박 3일</option>
                    <option value="3박 4일">3박 4일</option>
                  </select>
                </div>

                {/* 계절 */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-orange-600">🌸</span>
                    계절 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) =>
                      setFormData({ ...formData, season: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                    required
                  >
                    <option value="">계절을 선택하세요</option>
                    <option value="봄">봄</option>
                    <option value="여름">여름</option>
                    <option value="가을">가을</option>
                    <option value="겨울">겨울</option>
                  </select>
                </div>
              </div>

              {/* 총 인원 / 남/여 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-orange-600">👥</span>총 참여 인원
                  </label>
                  <input
                    type="number"
                    value={formData.people}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-black cursor-not-allowed"
                    placeholder="남자/여자 인원 입력 시 자동 계산됩니다"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-blue-500">👨</span>
                    남자 인원
                  </label>
                  <input
                    type="number"
                    value={inputValues.male}
                    onChange={(e) =>
                      setInputValues({ ...inputValues, male: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                    placeholder="남자 인원"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-pink-500">👩</span>
                    여자 인원
                  </label>
                  <input
                    type="number"
                    value={inputValues.female}
                    onChange={(e) =>
                      setInputValues({ ...inputValues, female: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                    placeholder="여자 인원"
                    min="0"
                  />
                </div>
              </div>

              {/* 야외활동 여부 / 숙박 총액 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-green-600">🌳</span>
                    야외 활동 가능 여부
                  </label>
                  <select
                    value={formData.outdoorEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outdoorEnabled: e.target.value as "Y" | "N",
                      })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  >
                    <option value="">선택하세요</option>
                    <option value="Y">가능</option>
                    <option value="N">불가능</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                    <span className="text-orange-600">💰</span>
                    숙박비 총액 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={inputValues.lodgingTotal}
                    onChange={(e) =>
                      setInputValues({ ...inputValues, lodgingTotal: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                    placeholder="숙박 총액을 입력하세요"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* 특이사항 */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 font-jua">
                  <span className="text-orange-600">📝</span>
                  특이사항
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="특별한 요청사항이나 고려사항을 입력하세요 (선택사항)"
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-4 pt-6 border-t border-orange-200">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-semibold transition-all duration-200 font-jua"
                  onClick={() => setShowPlanModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2 font-jua ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8h4z"
                        ></path>
                      </svg>
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>MT 계획 생성</span>
                    </>
                  )}
                </button>
                {loading && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[60]">
                    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
                      <svg
                        className="animate-spin h-10 w-10 text-orange-500 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8h4z"
                        ></path>
                      </svg>
                      <p className="text-black font-jua text-lg">
                        AI가 MT 계획을 준비 중입니다...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MtPlanner;
