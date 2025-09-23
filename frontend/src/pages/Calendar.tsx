import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
// (선택) auth-store 사용 시 주석 해제
// import { useAuthStore } from "../stores/auth";

// =========================
// Types
// =========================
type Role = "member" | "officer" | "president";
type Category = "정모" | "번개모임" | "MT";

/**
 * 단일 이벤트(저장용)
 * - date: 시작 날짜
 * - endDate: 종료 날짜
 * - time/endTime: 시작/종료 시간
 */
type EventItem = {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD (start)
  endDate?: string; // YYYY-MM-DD (end; 없으면 date와 동일)
  time?: string; // HH:mm
  endTime?: string; // HH:mm
  allDay?: boolean;
  location?: string;
  category: Category;
  note?: string;
  attendees?: number;
  capacity?: number;
  materials?: string;
  description?: string;
  createdById?: string | number;
};

type ViewMode = "month" | "year" | "decade";

/** 화면 렌더링용 '날짜 슬라이스' */
type DaySlice = EventItem & {
  sliceDate: string; // 이 슬라이스가 속한 날짜 (YYYY-MM-DD)
  sliceKind: "single" | "start" | "middle" | "end";
  timeLabel: string; // 칩에 보여줄 시간 문구
};

// =========================
// Utils
// =========================
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfCalendar = (d: Date) => {
  const first = startOfMonth(d);
  const dow = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - dow);
  return start;
};
const endOfCalendar = (d: Date) => {
  const start = startOfCalendar(d);
  const end = new Date(start);
  end.setDate(start.getDate() + (6 * 7 - 1)); // 6주 고정 (42일 - 1)
  return end;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// =========================
// Labels
// =========================
const korWeek = ["일", "월", "화", "수", "목", "금", "토"];
const monthNames = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
const monthLabel = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
const yearLabel = (d: Date) => `${d.getFullYear()}년`;
const decadeStart = (year: number) => Math.floor(year / 10) * 10;

// =========================
// Visual map
// =========================
const catColor: Record<
  Category,
  { bg: string; text: string; ring: string; left: string }
> = {
  정모: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    left: "before:bg-blue-500",
  },
  번개모임: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    left: "before:bg-amber-500",
  },
  MT: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
    left: "before:bg-purple-500",
  },
};

// =========================
// Icons
// =========================
const ChevronLeft = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ChevronRight = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Clock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v5l3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Pin = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// =========================
// Props
// =========================
interface CalendarProps {
  onNavigateToOnboarding: () => void;
}

// =========================
// Component
// =========================
const Calendar: React.FC<CalendarProps> = ({ onNavigateToOnboarding }) => {
  // (선택) auth-store에서 현재 사용자/역할 사용
  // const { user, myRole } = useAuthStore();
  const currentUser = { id: "u1", role: "member" as Role };

  // 초기엔 빈 배열(더미 제거). 필요 시 API 연동해서 setEvents 호출.
  const [events, setEvents] = useState<EventItem[]>([]);

  // Calendar state
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date | null>(new Date());

  // Modals
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalItem, setEventModalItem] = useState<EventItem | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Month range
  const calStart = startOfCalendar(cursor);
  const calEnd = endOfCalendar(cursor);

  // Month grid days
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date(calStart);
    while (d <= calEnd) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [calStart.getTime(), calEnd.getTime()]);

  // 현재 달에 걸친 이벤트만 필터링
  const monthEvents = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();

    // 캘린더에 보이는 범위(해당 월의 1일~말일)를 기준으로 겹치는 이벤트 포함
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0); // 말일
    const ms = monthStart.getTime();
    const me = monthEnd.getTime();

    return events
      .filter((e) => {
        const s = parseYMD(e.date).getTime();
        const eEnd = parseYMD(e.endDate ?? e.date).getTime();
        // 한 달 범위와 겹치면 포함
        return !(eEnd < ms || s > me);
      })
      .sort(
        (a, b) =>
          parseYMD(a.date).getTime() - parseYMD(b.date).getTime() ||
          (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
      );
  }, [cursor, events]);

  // 이벤트 → 날짜별 슬라이스로 펼치기
  const expandEventToSlices = (ev: EventItem): DaySlice[] => {
    const start = parseYMD(ev.date);
    const end = parseYMD(ev.endDate ?? ev.date);
    const slices: DaySlice[] = [];

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const first = sameDay(cur, start);
      const last = sameDay(cur, end);
      const kind: DaySlice["sliceKind"] =
        first && last ? "single" : first ? "start" : last ? "end" : "middle";

      const timeLabel = ev.allDay
        ? "종일"
        : kind === "single"
        ? ev.time && ev.endTime
          ? `${ev.time} - ${ev.endTime}`
          : ev.time
          ? ev.time
          : ev.endTime
          ? ev.endTime
          : "시간 미정"
        : kind === "start"
        ? ev.time
          ? `${ev.time} ~`
          : "시작"
        : kind === "end"
        ? ev.endTime
          ? `~ ${ev.endTime}`
          : "종료"
        : "종일";

      slices.push({
        ...ev,
        sliceDate: ymd(cur),
        sliceKind: kind,
        timeLabel,
      });
    }

    return slices;
  };

  // 날짜별 map (슬라이스 기준)
  const byDay = useMemo(() => {
    const map = new Map<string, DaySlice[]>();

    for (const ev of monthEvents) {
      const slices = expandEventToSlices(ev);
      for (const s of slices) {
        const arr = map.get(s.sliceDate) ?? [];
        arr.push(s);
        map.set(s.sliceDate, arr);
      }
    }

    // 정렬: 종일 우선 → 시작시간
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if ((a.allDay ?? false) !== (b.allDay ?? false)) {
          return a.allDay ? -1 : 1;
        }
        return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
      });
    }

    return map;
  }, [monthEvents]);

  // Right list scroll sync
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected || !listRef.current) return;
    const key = ymd(selected);
    const el =
      listRef.current.querySelector<HTMLDivElement>(`[data-date="${key}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCursor((c) =>
          view === "month"
            ? new Date(c.getFullYear(), c.getMonth() - 1, 1)
            : view === "year"
            ? new Date(c.getFullYear() - 1, c.getMonth(), 1)
            : new Date(c.getFullYear() - 10, c.getMonth(), 1)
        );
      } else if (e.key === "ArrowRight") {
        setCursor((c) =>
          view === "month"
            ? new Date(c.getFullYear(), c.getMonth() + 1, 1)
            : view === "year"
            ? new Date(c.getFullYear() + 1, c.getMonth(), 1)
            : new Date(c.getFullYear() + 10, c.getMonth(), 1)
        );
      } else if (e.key === "Home" || e.key.toLowerCase() === "t") {
        setCursor(startOfMonth(new Date()));
        setView("month");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  // Helpers
  const formatWhen = (ev: EventItem) => {
    const s = parseYMD(ev.date);
    const e = parseYMD(ev.endDate ?? ev.date);
    const left = `${s.getFullYear()}. ${s.getMonth() + 1}. ${s.getDate()}.`;
    const same = isSameDay(s, e);

    if (ev.allDay) {
      return same
        ? `${left} 종일`
        : `${left} ~ ${e.getFullYear()}. ${e.getMonth() + 1}. ${e.getDate()}. 종일`;
    }

    if (same) {
      if (ev.time && ev.endTime) return `${left} ${ev.time} - ${ev.endTime}`;
      if (ev.time) return `${left} ${ev.time}`;
      if (ev.endTime) return `${left} ~ ${ev.endTime}`;
      return `${left} 시간 미정`;
    }

    // 다른 날짜로 이어지는 경우
    const right = `${e.getFullYear()}. ${e.getMonth() + 1}. ${e.getDate()}.`;
    const timeLeft = ev.time ? `${ev.time} ~` : "시작 ~";
    const timeRight = ev.endTime ? ` ${ev.endTime}` : "";
    return `${left} ${timeLeft}  ${right}${timeRight}`;
  };

  const openDayModal = (d: Date) => {
    setSelected(d);
    setDayModalDate(d);
    setDayModalOpen(true);
  };
  const openEventModal = (ev: EventItem) => {
    setEventModalItem(ev);
    setEventModalOpen(true);
  };

  const canEdit = (ev: EventItem | null) =>
    !!ev && String(ev.createdById) === String(currentUser.id);

  const addEvent = (ev: EventItem) => setEvents((prev) => [...prev, ev]);
  const updateEvent = (id: EventItem["id"], patch: Partial<EventItem>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const deleteEvent = (id: EventItem["id"]) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  // Header label/mode
  const headerLabel = () =>
    view === "month"
      ? monthLabel(cursor)
      : view === "year"
      ? yearLabel(cursor)
      : (() => {
          const ds = decadeStart(cursor.getFullYear());
          return `${ds} ~ ${ds + 9}`;
        })();
  const goPrev = () => {
    setCursor((c) =>
      view === "month"
        ? new Date(c.getFullYear(), c.getMonth() - 1, 1)
        : view === "year"
        ? new Date(c.getFullYear() - 1, c.getMonth(), 1)
        : new Date(c.getFullYear() - 10, c.getMonth(), 1)
    );
  };
  const goNext = () => {
    setCursor((c) =>
      view === "month"
        ? new Date(c.getFullYear(), c.getMonth() + 1, 1)
        : view === "year"
        ? new Date(c.getFullYear() + 1, c.getMonth(), 1)
        : new Date(c.getFullYear() + 10, c.getMonth(), 1)
    );
  };
  const onHeaderClick = () => {
    setView((v) => (v === "month" ? "year" : v === "year" ? "decade" : "month"));
  };

  // Month cell chip (DaySlice 사용)
  const renderCellPreview = (ev: DaySlice) => {
    const color = catColor[ev.category];
    const label = `${ev.title} • ${ev.timeLabel}${
      ev.location ? ` • ${ev.location}` : ""
    }`;
    return (
      <button
        key={`${ev.id}-${ev.sliceDate}`}
        onClick={(e) => {
          e.stopPropagation();
          openEventModal(ev);
        }}
        title={label}
        className={`relative w-full text-[10px] truncate pl-2 pr-1 py-0.5 rounded-md border text-left
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${color.left}
          bg-white/70 border-gray-200/60 hover:bg-white`}
      >
        <span className="font-medium text-gray-900 truncate font-gowun">
          {ev.title}
        </span>
        <span className="ml-1 text-gray-500 font-gowun">{ev.timeLabel}</span>
      </button>
    );
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="min-h-screen bg-[#fcf9f5] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-drift"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200 rounded-full opacity-25 animate-drift-reverse"></div>
        <div className="absolute bottom-32 left-20 w-28 h-28 bg-pink-200 rounded-full opacity-15 animate-drift"></div>
        <div className="absolute bottom-60 right-32 w-20 h-20 bg-blue-200 rounded-full opacity-30 animate-drift-reverse"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-drift"></div>
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-green-200 rounded-full opacity-10 animate-drift-reverse"></div>
        <div className="absolute bottom-20 right-10 w-22 h-22 bg-orange-300 rounded-full opacity-25 animate-drift"></div>
      </div>

      <div className="flex relative z-10">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* Main Content */}
        <main className="flex-1 px-6 py-2 bg-gradient-to-br from-orange-50 via-white to-orange-100">
          {/* 헤더 */}
          <div className="mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-extrabold text-gray-900 font-jua">
                일정 관리
              </h1>
              <p className="text-sm text-gray-600 font-gowun">
                동아리 모임과 일정을 체계적으로 관리하세요
              </p>
            </div>
          </div>

          {/* 좌/우 2칸 */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-4 items-start">
            {/* Left: Calendar */}
            <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
              {/* 캘린더 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    aria-label="이전"
                    className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={onHeaderClick}
                    className="px-2 py-1 rounded-lg text-lg font-bold tracking-tight text-gray-900 hover:bg-gray-100 font-jua"
                    title="클릭: 월 ↔ 연 ↔ 십년"
                  >
                    {headerLabel()}
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="다음"
                    className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="ml-2 text-xs text-gray-500 font-gowun">
                    단축키: 월 · 연 이동( ←/→ ) | 오늘 ( T / Home )
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold shadow font-jua"
                    onClick={() => {
                      setCursor(startOfMonth(new Date()));
                      setView("month");
                      setSelected(new Date());
                    }}
                  >
                    <span>📅</span>
                    <span>오늘로 이동</span>
                  </button>
                  <button
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow font-jua"
                    onClick={() => {
                      setCreateOpen(true);
                      setEventModalOpen(false);
                      setDayModalOpen(false);
                    }}
                  >
                    <span>＋</span>
                    <span>일정 등록</span>
                  </button>
                </div>
              </div>

              {/* 캘린더 바디 */}
              {view === "month" && (
                <>
                  <div className="grid grid-cols-7 text-center text-[13px] text-gray-600 px-4 pt-1 font-gowun">
                    {korWeek.map((w) => (
                      <div key={w} className="py-0.5 font-medium">
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-3">
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((d, idx) => {
                        const inMonth =
                          d.getMonth() === cursor.getMonth() &&
                          d.getFullYear() === cursor.getFullYear();
                        const key = ymd(d);
                        const all = byDay.get(key) ?? []; // DaySlice[]
                        const preview = all.slice(0, 2);
                        const more = Math.max(0, all.length - preview.length);
                        const sel = selected && isSameDay(selected, d);
                        const weekend = d.getDay() === 0 || d.getDay() === 6;
                        const isToday = isSameDay(d, new Date());

                        return (
                          <div
                            key={idx}
                            onClick={() => openDayModal(d)}
                            className={`relative h-24 rounded-xl border transition cursor-pointer
                            ${inMonth ? "bg-white/90 border-gray-200" : "bg-gray-50 border-gray-200/60 text-gray-400"}
                            ${weekend && inMonth ? "bg-orange-50/70" : ""}
                            ${isToday && inMonth ? "bg-gradient-to-br from-orange-100 to-orange-150 border-orange-300 border-[3px]" : ""}
                            ${sel ? "ring-2 ring-blue-400" : "hover:shadow-sm"}`}
                          >
                            <div
                              className={`absolute top-1 left-2 text-[12px] font-semibold font-jua ${
                                isToday && inMonth
                                  ? "text-orange-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {d.getDate()}
                            </div>
                            <div className="absolute left-2 right-2 top-6 space-y-1">
                              {preview.map((ev) => renderCellPreview(ev))}
                              {more > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDayModal(d);
                                  }}
                                  className="w-full text-[11px] text-gray-600 hover:text-gray-900 text-left font-gowun"
                                >
                                  +{more}개 더 보기
                                </button>
                              )}
                            </div>
                            {!inMonth && (
                              <div className="absolute inset-0 rounded-xl bg-white/30 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {view === "year" && (
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-3">
                    {monthNames.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => {
                          setCursor(new Date(cursor.getFullYear(), i, 1));
                          setView("month");
                        }}
                        className="h-16 rounded-xl border border-gray-200 bg-white hover:bg-orange-50 text-gray-800 font-semibold font-jua"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view === "decade" &&
                (() => {
                  const start = decadeStart(cursor.getFullYear());
                  const years: { y: number; inRange: boolean }[] = [];
                  for (let i = -1; i <= 10; i++) {
                    const y = start + i;
                    years.push({ y, inRange: i >= 0 && i <= 10 });
                  }
                  return (
                    <div className="p-6">
                      <div className="grid grid-cols-4 gap-3">
                        {years.map(({ y, inRange }) => (
                          <button
                            key={y}
                            onClick={() => {
                              setCursor(new Date(y, cursor.getMonth(), 1));
                              setView("year");
                            }}
                            className={`h-16 rounded-xl border font-semibold font-jua
                          ${
                            inRange
                              ? "border-gray-200 bg-white text-gray-800 hover:bg-orange-50"
                              : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-50"
                          }`}
                            title={`${y}년`}
                          >
                            {y}년
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </section>

            {/* Right: list */}
            <aside className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="text-base font-semibold text-gray-900 font-jua">
                  이번 달 일정
                </div>
                <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-gowun">
                  {monthEvents.length}개
                </div>
              </div>

              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[calc(100vh-300px)] calendar-scrollbar"
              >
                {monthEvents.map((ev) => {
                  const d = parseYMD(ev.date);
                  const isSel = selected && isSameDay(selected, d);
                  const color = catColor[ev.category];
                  return (
                    <button
                      key={ev.id}
                      data-date={ev.date}
                      onClick={() => openEventModal(ev)}
                      className={`w-full text-left flex gap-3 rounded-xl p-3 items-start border transition
                      ${
                        isSel
                          ? "border-rose-300 bg-rose-50"
                          : "border-gray-200 bg-white"
                      } hover:shadow-sm`}
                    >
                      <div className="w-12 text-center">
                        <div className="text-[11px] text-gray-500 font-gowun">
                          {d.getMonth() + 1}월
                        </div>
                        <div className="text-lg font-bold text-gray-800 font-jua">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ring-1 ${color.bg} ${color.text} ${color.ring} font-gowun`}
                          >
                            {ev.category}
                          </span>
                          <div className="truncate font-semibold text-gray-900 font-jua">
                            {ev.title}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 font-gowun">
                            <Clock className="w-3.5 h-3.5" />
                            {formatWhen(ev)}
                          </span>
                          {ev.location && (
                            <span className="inline-flex items-center gap-1 font-gowun">
                              <Pin className="w-3.5 h-3.5" />
                              {ev.location}
                            </span>
                          )}
                          {typeof ev.attendees === "number" && ev.capacity && (
                            <span className="font-gowun">
                              {ev.attendees}/{ev.capacity}명
                            </span>
                          )}
                          {ev.note && (
                            <span className="text-gray-500 font-gowun">
                              · {ev.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {monthEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-16 font-gowun">
                    이번 달에는 등록된 일정이 없습니다.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>

        {/* ===== Day list modal ===== */}
        {dayModalOpen && dayModalDate && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDayModalOpen(false)}
          >
            <div
              className="w-full max-w-screen-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-gray-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <div className="text-lg font-bold text-gray-900 font-jua">
                  {dayModalDate.getFullYear()}년 {dayModalDate.getMonth() + 1}월{" "}
                  {dayModalDate.getDate()}일 일정
                </div>
                <button
                  onClick={() => setDayModalOpen(false)}
                  className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(byDay.get(ymd(dayModalDate)) ?? []).map((ev) => {
                  const color = catColor[ev.category];
                  return (
                    <button
                      key={`${ev.id}-${ev.sliceDate}`}
                      onClick={() => {
                        setDayModalOpen(false);
                        openEventModal(ev);
                      }}
                      className={`w-full text-left rounded-xl p-4 border ring-1 ${color.bg} ${color.ring} border-transparent hover:bg-white`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${color.bg} ${color.text} ring-1 ${color.ring}`}
                        >
                          {ev.category}
                        </span>
                        <div className="font-semibold text-gray-900 font-jua">
                          {ev.title}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1 font-gowun">
                          <Clock className="w-4 h-4" />
                          {ev.timeLabel}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1 font-gowun">
                            <Pin className="w-4 h-4" />
                            {ev.location}
                          </span>
                        )}
                        {typeof ev.attendees === "number" && ev.capacity && (
                          <span>
                            {ev.attendees}/{ev.capacity}명
                          </span>
                        )}
                        {ev.note && (
                          <span className="text-gray-600 font-gowun">
                            · {ev.note}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {(byDay.get(ymd(dayModalDate)) ?? []).length === 0 && (
                  <div className="text-center text-gray-500 py-10 font-gowun">
                    등록된 일정이 없습니다.
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 text-right">
                <button
                  onClick={() => setDayModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 font-gowun"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Event detail modal ===== */}
        {eventModalOpen && eventModalItem && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEventModalOpen(false)}
          >
            <div
              className="w-full max-w-screen-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="text-lg font-bold text-gray-900 font-jua">
                  {eventModalItem.title}
                </div>
                <button
                  onClick={() => setEventModalOpen(false)}
                  className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <dl className="space-y-3">
                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">카테고리</dt>
                    <dd>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ring-1 ${
                          catColor[eventModalItem.category].bg
                        } ${catColor[eventModalItem.category].text} ${
                          catColor[eventModalItem.category].ring
                        }`}
                      >
                        {eventModalItem.category}
                      </span>
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">일시</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {formatWhen(eventModalItem)}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">장소</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {eventModalItem.location ?? "미정"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">참가 인원</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {typeof eventModalItem.attendees === "number" &&
                      eventModalItem.capacity
                        ? `${eventModalItem.attendees}/${eventModalItem.capacity}명`
                        : "미정"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">준비물</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {eventModalItem.materials ?? "-"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                    <dt className="text-sm text-gray-500 font-gowun">상세 내용</dt>
                    <dd>
                      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 min-h-[64px] font-gowun">
                        {eventModalItem.description ?? "내용 없음"}
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  {canEdit(eventModalItem) && (
                    <>
                      <button
                        onClick={() => {
                          setEditOpen(true);
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-jua"
                      >
                        ✎ 수정
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("정말 삭제할까요?")) {
                            deleteEvent(eventModalItem.id);
                            setEventModalOpen(false);
                          }
                        }}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-jua"
                      >
                        🗑 삭제
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-jua"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      setEvents((prev) =>
                        prev.map((e) =>
                          e.id === eventModalItem.id && e.capacity
                            ? {
                                ...e,
                                attendees: Math.min(
                                  (e.attendees ?? 0) + 1,
                                  e.capacity
                                ),
                              }
                            : e
                        )
                      );
                    }}
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm font-jua"
                  >
                    참여신청
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Create/Edit Event Modal ===== */}
        {createOpen && (
          <EventFormModal
            title="새 일정 등록"
            onClose={() => setCreateOpen(false)}
            onSubmit={(form) => {
              // 날짜 검증
              const start = parseYMD(form.startDate);
              const end = parseYMD(form.endDate);
              if (end < start) {
                alert("종료 날짜가 시작 날짜보다 앞설 수 없습니다.");
                return;
              }
              if (
                !form.allDay &&
                form.startTime &&
                form.endTime &&
                form.startDate === form.endDate &&
                form.startTime > form.endTime
              ) {
                alert("종료 시간이 시작 시간보다 빠릅니다.");
                return;
              }

              const id = `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;
              const ev: EventItem = {
                id,
                title: form.title,
                date: form.startDate,
                endDate: form.endDate,
                time: form.allDay ? undefined : form.startTime || undefined,
                endTime: form.allDay ? undefined : form.endTime || undefined,
                allDay: form.allDay,
                location: form.location || undefined,
                category: form.category as Category,
                note: form.note || undefined,
                capacity: form.capacity ? Number(form.capacity) : undefined,
                materials: form.materials || undefined,
                description: form.description || undefined,
                createdById: currentUser.id,
              };
              addEvent(ev);
              setCreateOpen(false);
            }}
            role={currentUser.role}
          />
        )}

        {editOpen && eventModalItem && canEdit(eventModalItem) && (
          <EventFormModal
            title="일정 수정"
            initial={{
              category: eventModalItem.category,
              title: eventModalItem.title,
              description: eventModalItem.description ?? "",
              startDate: eventModalItem.date,
              endDate: eventModalItem.endDate ?? eventModalItem.date,
              startTime: eventModalItem.time ?? "",
              endTime: eventModalItem.endTime ?? "",
              allDay: !!eventModalItem.allDay,
              location: eventModalItem.location ?? "",
              capacity: eventModalItem.capacity
                ? String(eventModalItem.capacity)
                : "",
              materials: eventModalItem.materials ?? "",
              note: eventModalItem.note ?? "",
            }}
            onClose={() => setEditOpen(false)}
            onSubmit={(form) => {
              updateEvent(eventModalItem.id, {
                category: form.category as Category,
                title: form.title,
                description: form.description || undefined,
                date: form.startDate,
                endDate: form.endDate,
                time: form.allDay ? undefined : form.startTime || undefined,
                endTime: form.allDay ? undefined : form.endTime || undefined,
                allDay: form.allDay,
                location: form.location || undefined,
                capacity: form.capacity ? Number(form.capacity) : undefined,
                materials: form.materials || undefined,
                note: form.note || undefined,
              });
              setEditOpen(false);
              setEventModalItem((e) =>
                e
                  ? {
                      ...e,
                      category: form.category as Category,
                      title: form.title,
                      description: form.description || undefined,
                      date: form.startDate,
                      endDate: form.endDate,
                      time: form.allDay ? undefined : form.startTime || undefined,
                      endTime: form.allDay
                        ? undefined
                        : form.endTime || undefined,
                      allDay: form.allDay,
                      location: form.location || undefined,
                      capacity: form.capacity
                        ? Number(form.capacity)
                        : undefined,
                      materials: form.materials || undefined,
                      note: form.note || undefined,
                    }
                  : e
              );
            }}
            role={currentUser.role}
          />
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNavigateToOnboarding={onNavigateToOnboarding}
        />
      </div>
    </div>
  );
};

/* =========================================================
   EventFormModal: 일정 등록/수정 공용 모달
   ========================================================= */
type FormShape = {
  category: Category | "";
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  capacity: string;
  materials: string;
  note: string;
};
function EventFormModal({
  title,
  onClose,
  onSubmit,
  initial,
  role,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (form: FormShape) => void;
  initial?: Partial<FormShape>;
  role: Role;
}) {
  const today = ymd(new Date());

  const [form, setForm] = useState<FormShape>({
    category: (initial?.category as Category) ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    startDate: initial?.startDate ?? today,
    endDate: initial?.endDate ?? today,
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    allDay: initial?.allDay ?? false,
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? "",
    materials: initial?.materials ?? "",
    note: initial?.note ?? "",
  });

  const [sameDate, setSameDate] = useState<boolean>(
    (initial?.startDate ?? today) === (initial?.endDate ?? today)
  );

  // 동일 날짜 체크 시 endDate를 startDate와 동기화
  useEffect(() => {
    if (sameDate) {
      setForm((f) => ({ ...f, endDate: f.startDate }));
    }
  }, [sameDate]);

  // 시작 날짜가 바뀌면 동일날짜 체크 상태면 endDate 동기화
  useEffect(() => {
    if (sameDate) {
      setForm((f) => ({ ...f, endDate: f.startDate }));
    }
  }, [form.startDate]);

  const canUseAdminCategory = role === "officer" || role === "president";

  const categoryOptions: Array<{
    key: Category;
    label: string;
    desc: string;
    emoji: string;
    adminOnly?: boolean;
  }> = [
    { key: "번개모임", label: "번개모임", desc: "즉석 모임", emoji: "⚡" },
    { key: "정모", label: "정모", desc: "정기 모임", emoji: "📅", adminOnly: true },
    { key: "MT", label: "MT", desc: "멤버십 트레이닝", emoji: "🏔️", adminOnly: true },
  ];

  const pickCategory = (c: Category, adminOnly?: boolean) => {
    if (adminOnly && !canUseAdminCategory) {
      alert("관리자 전용 카테고리입니다. (회장/임원만 가능)");
      return;
    }
    setForm((f) => ({ ...f, category: c }));
  };

  // 종일 토글: 00:00 ~ 23:59
  const onToggleAllDay = (checked: boolean) => {
    if (checked) {
      setForm((f) => ({ ...f, allDay: true, startTime: "00:00", endTime: "23:59" }));
    } else {
      setForm((f) => ({ ...f, allDay: false }));
    }
  };

  const submit = () => {
    if (!form.category) return alert("카테고리를 선택하세요.");
    if (!form.title.trim()) return alert("모임 제목을 입력하세요.");
    if (!form.startDate || !form.endDate) return alert("날짜를 입력하세요.");
    if (
      !form.allDay &&
      form.startTime &&
      form.endTime &&
      form.startDate === form.endDate &&
      form.startTime > form.endTime
    ) {
      return alert("종료 시간이 시작 시간보다 빠릅니다.");
    }
    onSubmit(form);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-screen-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-lg font-bold text-gray-900 font-jua">{title}</div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 카테고리 */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
              카테고리 *
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categoryOptions.map((c) => {
                const disabled = !!c.adminOnly && !canUseAdminCategory;
                const selected = form.category === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => pickCategory(c.key, c.adminOnly)}
                    className={`relative h-28 sm:h-32 rounded-2xl border transition
                      flex flex-col items-center justify-center text-center gap-1.5
                      ${selected ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:bg-gray-50"}
                      ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-3xl">{c.emoji}</div>
                    <div className="font-semibold text-gray-900 font-jua">
                      {c.label}
                    </div>
                    <div className="text-xs text-gray-500 font-gowun">{c.desc}</div>
                    {c.adminOnly && (
                      <span className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-gowun">
                        관리자 전용
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
              모임 제목 *
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="모임 제목을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
            />
          </div>

          {/* 날짜 + 동일 날짜 체크박스 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-gowun">
                  시작 날짜 *
                </div>
              </div>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-gowun">
                  종료 날짜 *
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 font-gowun">
                  <input
                    type="checkbox"
                    checked={sameDate}
                    onChange={(e) => setSameDate(e.target.checked)}
                  />
                  동일 날짜
                </label>
              </div>
              <input
                type="date"
                value={form.endDate}
                disabled={sameDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-gowun"
              />
            </div>
          </div>

          {/* 시간 + 종일 체크박스 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-gowun">
                  시작 시간 (선택)
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 font-gowun">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => onToggleAllDay(e.target.checked)}
                  />
                  종일 일정(00:00~23:59)
                </label>
              </div>
              <input
                type="time"
                value={form.startTime}
                disabled={form.allDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-gowun"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
                종료 시간 (선택)
              </div>
              <input
                type="time"
                value={form.endTime}
                disabled={form.allDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endTime: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-gowun"
              />
            </div>
          </div>

          {/* 기타 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
                장소
              </div>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="장소"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
                정원(명)
              </div>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity: e.target.value }))
                }
                placeholder="예: 20"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
                준비물
              </div>
              <input
                value={form.materials}
                onChange={(e) =>
                  setForm((f) => ({ ...f, materials: e.target.value }))
                }
                placeholder="예: 교재, 노트"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
                메모
              </div>
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="추가 메모"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-gowun"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2 font-gowun">
              상세 내용
            </div>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="모임에 대한 상세한 설명을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white min-h-[110px] font-gowun"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-gowun"
          >
            취소
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm font-jua"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
