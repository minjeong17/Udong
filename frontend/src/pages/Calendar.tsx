import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from '../components/Sidebar';
import Notification from './Notification';

/* =========================
   Types
   ========================= */
type Role = "member" | "officer" | "president";
type Category = "정모" | "번개모임" | "행사" | "MT";
type EventItem = {
  id: string | number;
  title: string;
  date: string;     // YYYY-MM-DD
  time?: string;    // HH:mm
  endTime?: string; // HH:mm
  allDay?: boolean;
  location?: string;
  category: Category;
  note?: string;
  attendees?: number;
  capacity?: number;
  materials?: string;
  description?: string;
  createdById?: string;
};
type ViewMode = "month" | "year" | "decade";

/* =========================
   Mock current user
   ========================= */
const currentUser = {
  id: "u1",
  role: "member" as Role, // "member" | "officer" | "president"
};

/* =========================
   Utils
   ========================= */
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfCalendar = (d: Date) => {
  const first = startOfMonth(d);
  const dow = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - dow);
  return start;
};
const endOfCalendar = (d: Date) => {
  const last = endOfMonth(d);
  const dow = last.getDay();
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - dow));
  return end;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const korWeek = ["일", "월", "화", "수", "목", "금", "토"];
const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const monthLabel = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
const yearLabel = (d: Date) => `${d.getFullYear()}년`;
const decadeStart = (year: number) => Math.floor(year / 10) * 10;

/* =========================
   Visual map
   ========================= */
const catColor: Record<
  Category,
  { bg: string; text: string; ring: string; left: string }
> = {
  정모: { bg: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200",   left: "before:bg-blue-500" },
  번개모임: { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200",  left: "before:bg-amber-500" },
  행사: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", left: "before:bg-indigo-500" },
  MT:  { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200", left: "before:bg-purple-500" },
};

/* =========================
   Icons
   ========================= */
const ChevronLeft = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronRight = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Clock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Pin = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

/* =========================
   Props
   ========================= */
interface CalendarProps {
  onNavigateToOnboarding: () => void;
}

/* =========================
   Component
   ========================= */
const Calendar: React.FC<CalendarProps> = ({
  onNavigateToOnboarding
}) => {
  // Demo events — 1/12에 3개
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, title: "지난 모임", date: "2024-01-10", time: "19:00", category: "번개모임", createdById: "u2" },
    { id: 2, title: "오늘의 스터디", date: "2024-01-12", time: "14:00", endTime: "17:00", category: "번개모임", location: "도서관 3층", note: "알고리즘 - 투 포인터", attendees: 12, capacity: 15, materials: "교재, 노트", description: "오늘 진행되는 스터디 모임입니다.", createdById: "u1" },
    { id: 3, title: "운영 회의",     date: "2024-01-12", time: "18:00", endTime: "19:30", category: "정모", location: "스터디룸 A", attendees: 8, capacity: 12, createdById: "u2" },
    { id: 8, title: "친목 저녁식사", date: "2024-01-12", time: "20:00", category: "번개모임", location: "신촌", attendees: 10, capacity: 20, createdById: "u3" },
    { id: 4, title: "종일 행사",     date: "2024-01-18", allDay: true, location: "종일", category: "행사", createdById: "u2" },
    { id: 5, title: "MT 기획 회의",  date: "2024-01-20", time: "18:30", category: "MT", createdById: "u2" },
    { id: 6, title: "정기 모임",     date: "2024-01-15", time: "19:00", category: "정모", createdById: "u2" },
    { id: 7, title: "번개모임",      date: "2024-01-25", time: "20:00", category: "번개모임", createdById: "u3" },
  ]);

  // Calendar state
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date(2024, 0, 1)));
  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date | null>(parseYMD("2024-01-12"));

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

  // Events for current month
  const monthEvents = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return events
      .filter((e) => {
        const dt = parseYMD(e.date);
        return dt.getFullYear() === y && dt.getMonth() === m;
      })
      .sort((a, b) => parseYMD(a.date).getTime() - parseYMD(b.date).getTime());
  }, [cursor, events]);

  // By-day map
  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const ev of monthEvents) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
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
    const el = listRef.current.querySelector<HTMLDivElement>(`[data-date="${key}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCursor((c) =>
          view === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1)
          : view === "year" ? new Date(c.getFullYear() - 1, c.getMonth(), 1)
          : new Date(c.getFullYear() - 10, c.getMonth(), 1)
        );
      } else if (e.key === "ArrowRight") {
        setCursor((c) =>
          view === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1)
          : view === "year" ? new Date(c.getFullYear() + 1, c.getMonth(), 1)
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
    const d = parseYMD(ev.date);
    const left = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    if (ev.allDay) return `${left} 종일`;
    if (ev.time && ev.endTime) return `${left} ${ev.time} - ${ev.endTime}`;
    if (ev.time) return `${left} ${ev.time}`;
    return `${left} 시간 미정`;
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
    !!ev && ev.createdById === currentUser.id;

  const addEvent = (ev: EventItem) => setEvents((prev) => [...prev, ev]);
  const updateEvent = (id: EventItem["id"], patch: Partial<EventItem>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const deleteEvent = (id: EventItem["id"]) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  // Header label/mode
  const headerLabel = () =>
    view === "month" ? monthLabel(cursor)
    : view === "year" ? yearLabel(cursor)
    : (() => {
        const ds = decadeStart(cursor.getFullYear());
        return `${ds} ~ ${ds + 9}`;
      })();
  const goPrev = () => {
    setCursor((c) =>
      view === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1)
      : view === "year" ? new Date(c.getFullYear() - 1, c.getMonth(), 1)
      : new Date(c.getFullYear() - 10, c.getMonth(), 1)
    );
  };
  const goNext = () => {
    setCursor((c) =>
      view === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1)
      : view === "year" ? new Date(c.getFullYear() + 1, c.getMonth(), 1)
      : new Date(c.getFullYear() + 10, c.getMonth(), 1)
    );
  };
  const onHeaderClick = () => {
    setView((v) => (v === "month" ? "year" : v === "year" ? "decade" : "month"));
  };

  // Month cell chip
  const renderCellPreview = (ev: EventItem) => {
    const color = catColor[ev.category];
    const label = `${ev.title}${ev.allDay ? " (종일)" : ev.time ? ` • ${ev.time}` : ""}${ev.location ? ` • ${ev.location}` : ""}`;
    return (
      <button
        key={ev.id}
        onClick={(e) => { e.stopPropagation(); openEventModal(ev); }}
        title={label}
        className={`relative w-full text-[11px] truncate pl-2 pr-2 py-1 rounded-md border text-left
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${color.left}
          bg-white/70 border-gray-200/60 hover:bg-white`}
      >
        <span className="font-medium text-gray-900 truncate">{ev.title}</span>
        <span className="ml-1 text-gray-500">{ev.allDay ? "종일" : ev.time ?? ""}</span>
      </button>
    );
  };

  /* =========================
     Render
     ========================= */
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
        <main className="flex-1 px-8 py-6 bg-gradient-to-br from-orange-50 via-white to-orange-100">
        {/* 헤더 */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900">일정 관리</h1>
          <p className="text-sm text-gray-600 mt-1">동아리 모임과 일정을 체계적으로 관리하세요</p>
        </div>

        {/* 좌/우 2칸 */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-6 items-start">
          {/* Left: Calendar */}
          <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center gap-2">
                <button onClick={goPrev} aria-label="이전" className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5 text-gray-600"/>
                </button>
                <button
                  onClick={onHeaderClick}
                  className="px-2 py-1 rounded-lg text-lg font-bold tracking-tight text-gray-900 hover:bg-gray-100"
                  title="클릭: 월 ↔ 연 ↔ 십년"
                >
                  {headerLabel()}
                </button>
                <button onClick={goNext} aria-label="다음" className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5 text-gray-600"/>
                </button>
                <span className="ml-3 text-xs text-gray-500">단축키: 월 · 연 · 십년 이동( ←/→ ) | 오늘 ( T / Home )</span>
              </div>

              <button
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow"
                onClick={() => { setCreateOpen(true); setEventModalOpen(false); setDayModalOpen(false); }}
              >
                <span>＋</span>
                <span>일정 등록</span>
              </button>
            </div>

            {/* 캘린더 바디 */}
            {view === "month" && (
              <>
                <div className="grid grid-cols-7 text-center text-[13px] text-gray-600 px-6 pt-4">
                  {korWeek.map((w) => <div key={w} className="py-2 font-medium">{w}</div>)}
                </div>
                <div className="px-4 pb-5">
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((d, idx) => {
                      const inMonth = d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
                      const key = ymd(d);
                      const all = (byDay.get(key) ?? []);
                      const preview = all.slice(0, 2);
                      const more = Math.max(0, all.length - preview.length);
                      const sel = selected && isSameDay(selected, d);
                      const weekend = d.getDay() === 0 || d.getDay() === 6;

                      return (
                        <div
                          key={idx}
                          onClick={() => openDayModal(d)}
                          className={`relative h-36 rounded-xl border transition cursor-pointer
                            ${inMonth ? "bg-white/90 border-gray-200" : "bg-gray-50 border-gray-200/60 text-gray-400"}
                            ${weekend && inMonth ? "bg-orange-50/70" : ""}
                            ${sel ? "ring-2 ring-blue-400" : "hover:shadow-sm"}`}
                        >
                          <div className="absolute top-2 left-2 text-[13px] font-semibold text-gray-700">{d.getDate()}</div>
                          <div className="absolute left-2 right-2 top-8 space-y-1.5">
                            {preview.map((ev) => renderCellPreview(ev))}
                            {more > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openDayModal(d); }}
                                className="w-full text-[11px] text-gray-600 hover:text-gray-900 text-left underline underline-offset-2"
                              >
                                +{more}개 더 보기
                              </button>
                            )}
                          </div>
                          {!inMonth && <div className="absolute inset-0 rounded-xl bg-white/30 pointer-events-none" />}
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
                      onClick={() => { setCursor(new Date(cursor.getFullYear(), i, 1)); setView("month"); }}
                      className="h-16 rounded-xl border border-gray-200 bg-white hover:bg-orange-50 text-gray-800 font-semibold"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "decade" && (() => {
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
                        onClick={() => { setCursor(new Date(y, cursor.getMonth(), 1)); setView("year"); }}
                        className={`h-16 rounded-xl border font-semibold
                          ${inRange ? "border-gray-200 bg-white text-gray-800 hover:bg-orange-50"
                                    : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-50"}`}
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

          {/* Right: list (전체 높이) */}
          <aside className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-base font-semibold text-gray-900">이번 달 일정</div>
              <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{monthEvents.length}개</div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                      ${isSel ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-white"} hover:shadow-sm`}
                  >
                    <div className="w-12 text-center">
                      <div className="text-[11px] text-gray-500">{d.getMonth() + 1}월</div>
                      <div className="text-lg font-bold text-gray-800">{d.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ring-1 ${color.bg} ${color.text} ${color.ring}`}>{ev.category}</span>
                        <div className="truncate font-semibold text-gray-900">{ev.title}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{ev.allDay ? "종일" : ev.time ?? "시간 미정"}{ev.endTime ? ` - ${ev.endTime}` : ""}</span>
                        {ev.location && <span className="inline-flex items-center gap-1"><Pin className="w-3.5 h-3.5"/>{ev.location}</span>}
                        {typeof ev.attendees === "number" && ev.capacity && <span>{ev.attendees}/{ev.capacity}명</span>}
                        {ev.note && <span className="text-gray-500">· {ev.note}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}

              {monthEvents.length === 0 && (
                <div className="text-center text-gray-500 py-16">이번 달에는 등록된 일정이 없습니다.</div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ===== Day list modal (responsive) ===== */}
      {dayModalOpen && dayModalDate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDayModalOpen(false)}>
          <div className="w-full max-w-screen-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div className="text-lg font-bold text-gray-900">
                {dayModalDate.getFullYear()}년 {dayModalDate.getMonth() + 1}월 {dayModalDate.getDate()}일 일정
              </div>
              <button onClick={() => setDayModalOpen(false)} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(byDay.get(ymd(dayModalDate)) ?? []).map((ev) => {
                const color = catColor[ev.category];
                return (
                  <button key={ev.id} onClick={() => { setDayModalOpen(false); openEventModal(ev); }}
                          className={`w-full text-left rounded-xl p-4 border ring-1 ${color.bg} ${color.ring} border-transparent hover:bg-white`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${color.bg} ${color.text} ring-1 ${color.ring}`}>{ev.category}</span>
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4"/>{ev.allDay ? "종일" : ev.time ?? "시간 미정"}{ev.endTime ? ` - ${ev.endTime}` : ""}</span>
                      {ev.location && <span className="inline-flex items-center gap-1"><Pin className="w-4 h-4"/>{ev.location}</span>}
                      {typeof ev.attendees === "number" && ev.capacity && <span>{ev.attendees}/{ev.capacity}명</span>}
                      {ev.note && <span className="text-gray-600">· {ev.note}</span>}
                    </div>
                  </button>
                );
              })}

              {(byDay.get(ymd(dayModalDate)) ?? []).length === 0 && (
                <div className="text-center text-gray-500 py-10">등록된 일정이 없습니다.</div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setDayModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Event detail modal (responsive) ===== */}
      {eventModalOpen && eventModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEventModalOpen(false)}>
          <div className="w-full max-w-screen-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-lg font-bold text-gray-900">{eventModalItem.title}</div>
              <button onClick={() => setEventModalOpen(false)} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <dl className="space-y-3">
                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                  <dt className="text-sm text-gray-500">카테고리</dt>
                  <dd>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ring-1 ${catColor[eventModalItem.category].bg} ${catColor[eventModalItem.category].text} ${catColor[eventModalItem.category].ring}`}>
                      {eventModalItem.category}
                    </span>
                  </dd>
                </div>

                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                  <dt className="text-sm text-gray-500">일시</dt>
                  <dd className="text-sm text-gray-900">{formatWhen(eventModalItem)}</dd>
                </div>

                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                  <dt className="text-sm text-gray-500">장소</dt>
                  <dd className="text-sm text-gray-900">{eventModalItem.location ?? "미정"}</dd>
                </div>

                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                  <dt className="text-sm text-gray-500">참가 인원</dt>
                  <dd className="text-sm text-gray-900">
                    {typeof eventModalItem.attendees === "number" && eventModalItem.capacity
                      ? `${eventModalItem.attendees}/${eventModalItem.capacity}명`
                      : "미정"}
                  </dd>
                </div>

                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                  <dt className="text-sm text-gray-500">준비물</dt>
                  <dd className="text-sm text-gray-900">{eventModalItem.materials ?? "-"}</dd>
                </div>

                <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                  <dt className="text-sm text-gray-500">상세 내용</dt>
                  <dd>
                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 min-h-[64px]">
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
                      onClick={() => { setEditOpen(true); }}
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm"
                    >
                      ✎ 수정
                    </button>
                    <button
                      onClick={() => { if (confirm("정말 삭제할까요?")) { deleteEvent(eventModalItem.id); setEventModalOpen(false); } }}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm"
                    >
                      🗑 삭제
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEventModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm">닫기</button>
                <button onClick={() => {
                  setEvents((prev) =>
                    prev.map((e) =>
                      e.id === eventModalItem.id && e.capacity
                        ? { ...e, attendees: Math.min((e.attendees ?? 0) + 1, e.capacity) }
                        : e
                    )
                  );
                }} className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold text-sm">
                  참여신청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Create/Edit Event Modal (responsive) ===== */}
      {createOpen && (
        <EventFormModal
          title="새 일정 등록"
          onClose={() => setCreateOpen(false)}
          onSubmit={(form) => {
            const start = parseYMD(form.startDate);
            const end = parseYMD(form.endDate);
            if (end < start) { alert("종료 날짜가 시작 날짜보다 앞설 수 없습니다."); return; }
            const days: Date[] = [];
            const cur = new Date(start);
            while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
            days.forEach((d, idx) => {
              const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
              const ev: EventItem = {
                id,
                title: form.title,
                date: ymd(d),
                time: form.allDay || idx > 0 ? undefined : form.startTime || undefined,
                endTime: form.allDay || idx > 0 ? undefined : form.endTime || undefined,
                allDay: form.allDay || idx > 0 ? true : false,
                location: form.location || undefined,
                category: form.category as Category,
                note: form.note || undefined,
                capacity: form.capacity ? Number(form.capacity) : undefined,
                materials: form.materials || undefined,
                description: form.description || undefined,
                createdById: currentUser.id,
              };
              addEvent(ev);
            });
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
            endDate: eventModalItem.date,
            startTime: eventModalItem.time ?? "",
            endTime: eventModalItem.endTime ?? "",
            allDay: !!eventModalItem.allDay,
            location: eventModalItem.location ?? "",
            capacity: eventModalItem.capacity ? String(eventModalItem.capacity) : "",
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
              time: form.allDay ? undefined : form.startTime || undefined,
              endTime: form.allDay ? undefined : form.endTime || undefined,
              allDay: form.allDay,
              location: form.location || undefined,
              capacity: form.capacity ? Number(form.capacity) : undefined,
              materials: form.materials || undefined,
              note: form.note || undefined,
            });
            setEditOpen(false);
            setEventModalItem((e) => (e ? { ...e, ...{
              category: form.category as Category,
              title: form.title,
              description: form.description || undefined,
              date: form.startDate,
              time: form.allDay ? undefined : form.startTime || undefined,
              endTime: form.allDay ? undefined : form.endTime || undefined,
              allDay: form.allDay,
              location: form.location || undefined,
              capacity: form.capacity ? Number(form.capacity) : undefined,
              materials: form.materials || undefined,
              note: form.note || undefined,
            }} : e));
          }}
          role={currentUser.role}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-700 font-jua">알림</h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0">
              <Notification onNavigateToOnboarding={onNavigateToOnboarding} />
            </div>
          </div>
        </div>
      )}
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
  const [form, setForm] = useState<FormShape>({
    category: (initial?.category as Category) ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    allDay: initial?.allDay ?? false,
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? "",
    materials: initial?.materials ?? "",
    note: initial?.note ?? "",
  });

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

  const submit = () => {
    if (!form.category) return alert("카테고리를 선택하세요.");
    if (!form.title.trim()) return alert("모임 제목을 입력하세요.");
    if (!form.startDate || !form.endDate) return alert("날짜를 입력하세요.");
    if (!form.allDay && (form.startTime && form.endTime) && form.startTime > form.endTime) {
      return alert("종료 시간이 시작 시간보다 빠릅니다.");
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-screen-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100">✕</button>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 카테고리 */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2">카테고리 *</div>
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
                    <div className="font-semibold text-gray-900">{c.label}</div>
                    <div className="text-xs text-gray-500">{c.desc}</div>
                    {c.adminOnly && (
                      <span className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
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
            <div className="text-sm font-semibold text-gray-800 mb-2">모임 제목 *</div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="모임 제목을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
            />
          </div>

          {/* 상세 내용 */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2">상세 내용</div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="모임에 대한 상세한 설명을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white min-h-[110px]"
            />
          </div>

          {/* 날짜/시간 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">시작 날짜 *</div>
              <input type="date" value={form.startDate}
                     onChange={(e)=>setForm((f)=>({...f, startDate: e.target.value}))}
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">종료 날짜 *</div>
              <input type="date" value={form.endDate}
                     onChange={(e)=>setForm((f)=>({...f, endDate: e.target.value}))}
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e)=>setForm((f)=>({...f, allDay: e.target.checked}))}
              />
              종일 일정
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">시작 시간 (선택사항)</div>
              <input type="time" value={form.startTime} disabled={form.allDay}
                     onChange={(e)=>setForm((f)=>({...f, startTime: e.target.value}))}
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">종료 시간 (선택사항)</div>
              <input type="time" value={form.endTime} disabled={form.allDay}
                     onChange={(e)=>setForm((f)=>({...f, endTime: e.target.value}))}
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50" />
            </div>
          </div>

          {/* 기타 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">장소</div>
              <input value={form.location}
                     onChange={(e)=>setForm((f)=>({...f, location: e.target.value}))}
                     placeholder="장소"
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">정원(명)</div>
              <input type="number" min={0} value={form.capacity}
                     onChange={(e)=>setForm((f)=>({...f, capacity: e.target.value}))}
                     placeholder="예: 20"
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">준비물</div>
              <input value={form.materials}
                     onChange={(e)=>setForm((f)=>({...f, materials: e.target.value}))}
                     placeholder="예: 교재, 노트"
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">메모</div>
              <input value={form.note}
                     onChange={(e)=>setForm((f)=>({...f, note: e.target.value}))}
                     placeholder="추가 메모"
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm">취소</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">등록</button>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
