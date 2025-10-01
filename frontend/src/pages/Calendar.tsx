// src/pages/Calendar.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import {
  CalendarApi,
  CalendarJoinApi,
  eventTypeToUi,
  uiToEventType,
  toIsoDateTime,
} from "../apis/calendar";
import { useAuthStore } from "../stores/authStore";
import { RouterContext } from "../hooks/useRouter";
import { useEscapeKey } from '../hooks/useEscapeKey';
import FeedbackDialog from "../components/FeedbackDialog";

/* =========================================
  Types
  ========================================= */
type Role = "LEADER" | "MANAGER" | "MEMBER";
type Category = "정모" | "번개모임" | "MT";

type EventItem = {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
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

type DaySlice = EventItem & {
  sliceDate: string; // YYYY-MM-DD
  sliceKind: "single" | "start" | "middle" | "end";
  timeLabel: string;
};

/* =========================================
  Utils
  ========================================= */
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
  end.setDate(start.getDate() + (6 * 7 - 1));
  return end;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** 문자열이면 JSON 파싱 시도 */
function parseMaybeJsonString(s?: unknown) {
  if (typeof s !== "string") return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
/** HTTP 상태코드 추출(axios, fetch, 커스텀 throw, JSON문자열 모두 대응) */
function getHttpStatus(err: unknown): number | undefined {
  const any = err as any;
  // axios 스타일
  if (typeof any?.response?.status === "number") return any.response.status;
  if (typeof any?.response?.data?.status === "number")
    return any.response.data.status;

  // fetch/커스텀
  if (typeof any?.status === "number") return any.status;

  // message나 data가 JSON 문자열인 케이스
  const fromMsg = parseMaybeJsonString(any?.message);
  if (typeof fromMsg?.status === "number") return fromMsg.status;

  const fromData = parseMaybeJsonString(any?.response?.data);
  if (typeof fromData?.status === "number") return fromData.status;

  return undefined;
}

/** 사용자용 메시지 추출 */
function getBackendMessage(err: unknown): string | undefined {
  const any = err as any;

  // axios: { data }
  const data = any?.response?.data ?? any?.data ?? any;
  // 1) 객체 형태
  if (typeof data === "object" && data) {
    if (typeof data.data === "string") return data.data; // { success:false, data:"메시지", status:409 }
    if (typeof data.message === "string") return data.message; // { message:"..." }
  }
  // 2) 서버가 문자열(JSON텍스트)로 준 경우
  if (typeof data === "string") {
    const parsed = parseMaybeJsonString(data);
    if (parsed) {
      if (typeof parsed.data === "string") return parsed.data;
      if (typeof parsed.message === "string") return parsed.message;
    }
    return data; // 그냥 일반 문자열
  }
  // 3) Error.message가 JSON 텍스트인 경우
  if (typeof any?.message === "string") {
    const parsed = parseMaybeJsonString(any.message);
    if (parsed) {
      if (typeof parsed.data === "string") return parsed.data;
      if (typeof parsed.message === "string") return parsed.message;
    }
  }
  return undefined;
}
/* ===== 에러 파서 강화 끝 ===== */

/* =========================================
  Labels & Visual
  ========================================= */
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

/* =========================================
  Icons
  ========================================= */
type IconProps = React.ComponentPropsWithoutRef<"svg">;
const ChevronLeft: React.FC<IconProps> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ChevronRight: React.FC<IconProps> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Clock: React.FC<IconProps> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
    <path
      d="M12 7v5l3 3"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Pin: React.FC<IconProps> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <path
      d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
      stroke="currentColor"
      strokeWidth={2}
    />
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth={2} />
  </svg>
);

/* =========================================
  BE ↔ UI 매핑
  ========================================= */
const toDateOnly = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const toHm = (iso?: string | null) => (iso ? iso.slice(11, 16) : undefined);
const mapListItem = (d: any): EventItem => {
  const start = String(d.startAt ?? "");
  const end = String(d.endAt ?? start);
  const startDate = toDateOnly(start);
  const endDate = toDateOnly(end);
  const isAllDay = toHm(start) === "00:00" && toHm(end) === "23:59";
  return {
    id: d.id,
    title: d.title,
    date: startDate,
    endDate,
    time: isAllDay ? undefined : toHm(start),
    endTime: isAllDay ? undefined : toHm(end),
    allDay: isAllDay,
    location: d.place ?? undefined,
    category: eventTypeToUi(d.type),
    capacity: d.capacity ?? undefined,
    description: d.content ?? undefined,
    createdById: d.createdBy ?? undefined,
  };
};

/* =========================================
  Modals
  ========================================= */
function JoinConfirmModal({
  open,
  onClose,
  eventItem,
  onJoined,
  clubId,
  onShowFeedback,
  onNavigateToChat,
}: {
  open: boolean;
  onClose: () => void;
  eventItem: EventItem;
  onJoined: (res: { attendees?: number; capacity?: number }) => void;
  clubId: number | null;
  onShowFeedback: (
    title: string,
    message: string,
    actions?: Array<{
      label: string;
      onClick: () => void;
      tone?: "primary" | "default";
    }>
  ) => void;
  onNavigateToChat: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const doJoin = async () => {
    if (!clubId) {
      onShowFeedback("오류", "클럽 정보가 없습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await CalendarJoinApi.join(clubId, Number(eventItem.id));
      onJoined({ attendees: res.attendees, capacity: res.capacity });

      // ★ 응답에서 chatId 후보들 확인 후 저장 (Chat.tsx에서 읽어 포커스)
      const chatId = res.roomId;
      if (chatId) {
        sessionStorage.setItem("focusChatId", String(chatId));
      }

      onShowFeedback(
        "참여 신청 완료",
        "참여 신청이 완료되었습니다.\n바로 채팅방으로 이동하시겠습니까?",
        [
          {
            label: "채팅방으로 이동",
            onClick: onNavigateToChat,
            tone: "primary",
          },
        ]
      );
      onClose();
    } catch (err) {
      const status = getHttpStatus(err);
      const serverMsg = getBackendMessage(err);

      if (status === 409) {
        onShowFeedback("알림", "이미 행사에 참여했습니다.");
      } else if (status === 404 || status === 400) {
        onShowFeedback("알림", "채팅방을 찾을 수 없습니다.");
      } else if (serverMsg) {
        onShowFeedback("오류", serverMsg);
      } else {
        onShowFeedback("오류", "참여 신청 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const whenText = (() => {
    const s = parseYMD(eventItem.date);
    const e = parseYMD(eventItem.endDate ?? eventItem.date);
    const left = `${s.getFullYear()}. ${s.getMonth() + 1}. ${s.getDate()}.`;
    const same = isSameDay(s, e);
    if (eventItem.allDay) {
      return same
        ? `${left} 종일`
        : `${left} ~ ${e.getFullYear()}. ${
            e.getMonth() + 1
          }. ${e.getDate()}. 종일`;
    }
    if (same) {
      if (eventItem.time && eventItem.endTime)
        return `${left} ${eventItem.time} ~ ${eventItem.endTime}`;
      if (eventItem.time) return `${left} ${eventItem.time}`;
      if (eventItem.endTime) return `${left} ~ ${eventItem.endTime}`;
      return `${left} 시간 미정`;
    }
    const right = `${e.getFullYear()}. ${e.getMonth() + 1}. ${e.getDate()}.`;
    const timeLeft = eventItem.time ? `${eventItem.time} ~` : "시작 ~";
    const timeRight = eventItem.endTime ? ` ${eventItem.endTime}` : "";
    return `${left} ${timeLeft}  ${right}${timeRight}`;
  })();

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-lg font-bold text-gray-900 font-jua">
            참여 신청 확인
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-black font-maplestory font-bold">이벤트</div>
            <div className="text-base font-semibold text-gray-900 font-jua">
              {eventItem.title}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-black font-maplestory font-bold">일시</div>
            <div className="text-sm text-black font-maplestory font-bold">{whenText}</div>
          </div>
          {eventItem.description && (
            <div className="space-y-1">
              <div className="text-sm text-black font-maplestory font-bold">설명</div>
              <div className="text-sm text-black whitespace-pre-wrap font-maplestory font-bold">
                {eventItem.description}
              </div>
            </div>
          )}
          <div className="pt-2 text-[15px] font-jua">
            정말 참여하시겠습니까?
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-maplestory font-bold"
            disabled={submitting}
          >
            취소
          </button>
          <button
            onClick={doJoin}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm font-jua disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "처리 중..." : "참여하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// function FeedbackDialog({
//   open,
//   title,
//   message,
//   onClose,
//   actions,
// }: {
//   open: boolean;
//   title: string;
//   message: string;
//   onClose: () => void;
//   actions?: Array<{
//     label: string;
//     onClick: () => void;
//     tone?: "primary" | "default";
//   }>;
// }) {
//   if (!open) return null;
//   return (
//     <div
//       className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div
//         className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className="px-6 py-4 border-b">
//           <div className="text-lg font-bold text-gray-900 font-jua">
//             {title}
//           </div>
//         </div>
//         <div className="px-6 py-5">
//           <p className="text-sm text-gray-800 whitespace-pre-line font-maplestory font-bold">
//             {message}
//           </p>
//         </div>
//         <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-maplestory font-bold"
//           >
//             닫기
//           </button>
//           {actions?.map((a, i) => (
//             <button
//               key={i}
//               onClick={a.onClick}
//               className={`px-4 py-2 rounded-lg text-sm font-jua ${
//                 a.tone === "primary"
//                   ? "bg-orange-500 hover:bg-orange-600 text-white"
//                   : "border border-gray-300 bg-white hover:bg-gray-100"
//               }`}
//             >
//               {a.label}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

/* =========================================
  Component
  ========================================= */
const Calendar: React.FC<{ onNavigateToOnboarding: () => void }> = ({
  onNavigateToOnboarding,
}) => {
  const router = useContext(RouterContext);
  if (!router) {
    console.error("RouterContext is not provided.");
    return <div>라우팅 오류가 발생했습니다.</div>;
  }
  const { navigate } = router;
  const { user, clubId, myRole } = useAuthStore();
  const currentUserId = user?.id;
  const role: Role =
    myRole === "LEADER"
      ? "LEADER"
      : myRole === "MANAGER"
      ? "MANAGER"
      : "MEMBER";

  // 피드백 다이얼로그 상태
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      onClick: () => void;
      tone?: "primary" | "default";
    }>;
  }>({ title: "", message: "" });
  const showFeedback = (
    title: string,
    message: string,
    actions?: Array<{
      label: string;
      onClick: () => void;
      tone?: "primary" | "default";
    }>
  ) => {
    setFeedback({ title, message, actions });
    setFeedbackOpen(true);
  };

  // 캘린더 상태
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date | null>(new Date());

  // 모달 상태
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalItem, setEventModalItem] = useState<EventItem | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);

  // ESC 키로 모달 닫기
  useEscapeKey(() => setEventModalOpen(false), eventModalOpen);
  useEscapeKey(() => setDayModalOpen(false), dayModalOpen);
  useEscapeKey(() => setCreateOpen(false), createOpen);
  useEscapeKey(() => setEditOpen(false), editOpen);
  useEscapeKey(() => setJoinConfirmOpen(false), joinConfirmOpen);

  // ★ 참여자 상태 (목록/로딩/에러)
  const calStart = startOfCalendar(cursor);
  const calEnd = endOfCalendar(cursor);
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date(calStart);
    while (d <= calEnd) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [calStart.getTime(), calEnd.getTime()]);

  /* ============ API: 월 목록 로드 (현재 달 + 다음 달) ============ */
  const refreshMonth = async () => {
    if (!clubId) return;
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    try {
      // 현재 달과 다음 달 데이터를 동시에 가져오기
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      const [currentMonthList, nextMonthList] = await Promise.all([
        CalendarApi.getMonth({ clubId, year, month }),
        CalendarApi.getMonth({ clubId, year: nextYear, month: nextMonth })
      ]);

      // 두 달의 데이터를 합치기
      const combinedList = [...currentMonthList, ...nextMonthList];
      const mappedEvents = combinedList.map(mapListItem);
      setEvents(mappedEvents);

      // 자동 선택 로직
      const autoSelectEventId = localStorage.getItem('autoSelectEvent');
      if (autoSelectEventId && mappedEvents.length > 0) {
        const targetEventId = parseInt(autoSelectEventId);
        const targetEvent = mappedEvents.find(event => event.id == targetEventId);
        if (targetEvent) {
          // 이벤트 모달 자동으로 열기
          setTimeout(() => {
            openEventModal(targetEvent);
          }, 100);
          // 한 번 사용한 후 제거
          localStorage.removeItem('autoSelectEvent');
        }
      }
    } catch (e) {
      console.error("getMonth failed", e);
    }
  };
  useEffect(() => {
    refreshMonth(); /* eslint-disable-next-line */
  }, [clubId, cursor]);

  // 캘린더에 표시되는 모든 날짜 범위의 이벤트 (이전달 끝 + 현재달 + 다음달 시작)
  const monthEvents = useMemo(() => {
    // 캘린더에 실제로 표시되는 전체 범위 사용
    const calendarStart = calStart.getTime();
    const calendarEnd = calEnd.getTime();
    return events
      .filter((e) => {
        const s = parseYMD(e.date).getTime();
        const eEnd = parseYMD(e.endDate ?? e.date).getTime();
        return !(eEnd < calendarStart || s > calendarEnd);
      })
      .sort(
        (a, b) =>
          parseYMD(a.date).getTime() - parseYMD(b.date).getTime() ||
          (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
      );
  }, [cursor, events]);

  // 이벤트 → 날짜별 슬라이스
  const expandEventToSlices = (ev: EventItem): DaySlice[] => {
    const start = parseYMD(ev.date);
    const end = parseYMD(ev.endDate ?? ev.date);
    const same = (a: Date, b: Date) => isSameDay(a, b);
    const slices: DaySlice[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const first = same(cur, start);
      const last = same(cur, end);
      const kind: DaySlice["sliceKind"] =
        first && last ? "single" : first ? "start" : last ? "end" : "middle";
      const timeLabel = ev.allDay
        ? "종일"
        : kind === "single"
        ? ev.time && ev.endTime
          ? `${ev.time} ~ ${ev.endTime}`
          : ev.time ?? ev.endTime ?? "시간 미정"
        : kind === "start"
        ? ev.time
          ? `${ev.time} ~`
          : "시작"
        : kind === "end"
        ? ev.endTime
          ? `~ ${ev.endTime}`
          : "종료"
        : "종일";
      slices.push({ ...ev, sliceDate: ymd(cur), sliceKind: kind, timeLabel });
    }
    return slices;
  };

  // 날짜별 map
  const byDay = useMemo(() => {
    const map = new Map<string, DaySlice[]>();
    for (const ev of monthEvents) {
      for (const s of expandEventToSlices(ev)) {
        const arr = map.get(s.sliceDate) ?? [];
        arr.push(s);
        map.set(s.sliceDate, arr);
      }
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          (a.allDay ? -1 : 1) - (b.allDay ? -1 : 1) ||
          (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
      );
    }
    return map;
  }, [monthEvents]);

  // 우측 리스트 스크롤 동기화
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected || !listRef.current) return;
    const key = ymd(selected);
    const el = listRef.current.querySelector<HTMLDivElement>(
      `[data-date="${key}"]`
    );
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  // 키보드 단축키
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

  // 시간 포맷
  const formatWhen = (ev: EventItem) => {
    const s = parseYMD(ev.date);
    const e = parseYMD(ev.endDate ?? ev.date);
    const left = `${s.getFullYear()}. ${s.getMonth() + 1}. ${s.getDate()}.`;
    const same = isSameDay(s, e);
    if (ev.allDay)
      return same
        ? `${left} 종일`
        : `${left} ~ ${e.getFullYear()}. ${
            e.getMonth() + 1
          }. ${e.getDate()}. 종일`;
    if (same) {
      if (ev.time && ev.endTime) return `${left} ${ev.time} ~ ${ev.endTime}`;
      if (ev.time) return `${left} ${ev.time}`;
      if (ev.endTime) return `${left} ~ ${ev.endTime}`;
      return `${left} 시간 미정`;
    }
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

  // ★ 상세 열기: 참여자 목록도 동시 로드 + 인원 반영
  const openEventModal = async (ev: EventItem) => {
    setEventModalItem(ev);
    setEventModalOpen(true);
    if (!clubId) return;
    try {
      const full = await CalendarApi.getOne(clubId, Number(ev.id));
      const mapped = mapListItem(full);
      setEventModalItem((prev) => (prev ? { ...prev, ...mapped } : mapped));
    } catch {}

    const list = await CalendarJoinApi.participants(clubId, Number(ev.id));
    const joined = list.filter((p) => p.participated);
    setEventModalItem((prev) =>
      prev ? { ...prev, attendees: joined.length } : prev
    );
  };

  const canEdit = (ev: EventItem | null) =>
    !!ev &&
    currentUserId != null &&
    String(ev.createdById ?? "") === String(currentUserId);

  /* =========================================
    Render
    ========================================= */
  return (
    <div className="min-h-screen bg-[#fcf9f5] relative overflow-hidden">
      {/* 배경 장식 */}
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
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        <main className="flex-1 px-6 pt-12 pb-8">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-extrabold text-gray-900 font-jua">
                일정 관리
              </h1>
              <p className="text-m text-gray-800  font-maplestory">
                동아리 모임과 일정을 체계적으로 관리하세요
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-4 items-start">
            {/* 좌측: 캘린더 */}
            <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
              {/* 캘린더 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)
                      )
                    }
                    className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                    aria-label="이전"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() =>
                      setView((v) =>
                        v === "month"
                          ? "year"
                          : v === "year"
                          ? "decade"
                          : "month"
                      )
                    }
                    className="px-2 py-1 rounded-lg text-lg font-bold tracking-tight text-gray-900 hover:bg-gray-100 font-jua"
                    title="클릭: 월 ↔ 연 ↔ 십년"
                  >
                    {view === "month"
                      ? monthLabel(cursor)
                      : view === "year"
                      ? yearLabel(cursor)
                      : (() => {
                          const ds = decadeStart(cursor.getFullYear());
                          return `${ds} ~ ${ds + 9}`;
                        })()}
                  </button>
                  <button
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)
                      )
                    }
                    className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
                    aria-label="다음"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
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

              {/* 본문(월/연/십년) */}
              {view === "month" && (
                <>
                  <div className="grid grid-cols-7 text-center text-[13px] text-gray-600 px-4 pt-1 font-maplestory font-bold">
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
                        const all = byDay.get(key) ?? [];
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
                              ${
                                inMonth
                                  ? "bg-white/90 border-gray-200"
                                  : "bg-gray-50 border-gray-200/60 text-gray-400"
                              }
                              ${weekend && inMonth ? "bg-orange-50/70" : ""}
                              ${
                                isToday && inMonth
                                  ? "bg-gradient-to-br from-orange-100 to-orange-150 border-orange-300 border-[3px]"
                                  : ""
                              }
                              ${
                                sel ? "ring-2 ring-blue-400" : "hover:shadow-sm"
                              }`}
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
                              {preview.map((ev) => {
                                const color =
                                  ev.category in catColor
                                    ? catColor[ev.category]
                                    : null;
                                if (!color) return null;
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
                                    <span className="font-medium text-gray-900 truncate font-maplestory font-bold">
                                      {ev.title}
                                    </span>
                                    <span className="ml-1 text-gray-500 font-maplestory font-bold">
                                      {ev.timeLabel}
                                    </span>
                                  </button>
                                );
                              })}
                              {more > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDayModal(d);
                                  }}
                                  className="w-full text-[11px] text-gray-600 hover:text-gray-900 text-left font-maplestory font-bold"
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
                  for (let i = -1; i <= 10; i++)
                    years.push({ y: start + i, inRange: i >= 0 && i <= 10 });
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

            {/* 우측: 리스트 */}
            <aside className="bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden min-h-[calc(100vh-220px)] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="text-base font-semibold text-gray-900 font-jua">
                  이번 달 일정
                </div>
                <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-maplestory font-bold">
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
                  if (!(ev.category in catColor)) return null;
                  const color = catColor[ev.category as Category];
                  const hasCap = typeof ev.capacity === "number";
                  const hasAtt = typeof ev.attendees === "number";
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
                        <div className="text-[11px] text-gray-500 font-maplestory font-bold">
                          {d.getMonth() + 1}월
                        </div>
                        <div className="text-lg font-bold text-gray-800 font-jua">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ring-1 ${color.bg} ${color.text} ${color.ring} font-maplestory font-bold`}
                          >
                            {ev.category}
                          </span>
                          <div className="truncate font-semibold text-gray-900 font-jua">
                            {ev.title}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 font-maplestory font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {formatWhen(ev)}
                          </span>
                          {ev.location && (
                            <span className="inline-flex items-center gap-1 font-maplestory font-bold">
                              <Pin className="w-3.5 h-3.5" />
                              {ev.location}
                            </span>
                          )}
                          {/* 참석 수 표기: 정원 있으면 A/B, 없으면 A명 */}
                          {hasAtt && hasCap && (
                            <span className="font-maplestory font-bold">
                              {ev.attendees}/{ev.capacity}명
                            </span>
                          )}
                          {hasAtt && !hasCap && (
                            <span className="font-maplestory font-bold">{ev.attendees}명</span>
                          )}
                          {ev.note && (
                            <span className="text-black font-maplestory font-bold">
                              · {ev.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {monthEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-16 font-maplestory font-bold">
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
                  if (!(ev.category in catColor)) return null;
                  const color = catColor[ev.category as Category];
                  const hasCap = typeof ev.capacity === "number";
                  const hasAtt = typeof ev.attendees === "number";
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
                        {hasAtt && hasCap && (
                          <span className="ml-auto text-xs text-gray-600 font-maplestory font-bold">
                            {ev.attendees}/{ev.capacity}명
                          </span>
                        )}
                        {hasAtt && !hasCap && (
                          <span className="ml-auto text-xs text-gray-600 font-maplestory font-bold">
                            {ev.attendees}명
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1 font-maplestory font-bold">
                          <Clock className="w-4 h-4" />
                          {ev.timeLabel}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1 font-maplestory font-bold">
                            <Pin className="w-4 h-4" />
                            {ev.location}
                          </span>
                        )}
                        {ev.note && (
                          <span className="text-gray-600 font-maplestory font-bold">
                            · {ev.note}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {(byDay.get(ymd(dayModalDate)) ?? []).length === 0 && (
                  <div className="text-center text-gray-500 py-10 font-maplestory font-bold">
                    등록된 일정이 없습니다.
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 text-right">
                <button
                  onClick={() => setDayModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 font-maplestory font-bold"
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
                    <dt className="text-sm text-gray-500 font-maplestory font-bold">
                      카테고리
                    </dt>
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
                    <dt className="text-sm text-gray-500 font-maplestory font-bold">일시</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {formatWhen(eventModalItem)}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-maplestory font-bold">장소</dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {eventModalItem.location ?? "미정"}
                    </dd>
                  </div>

                  {/* 참가 인원 */}
                  <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                    <dt className="text-sm text-gray-500 font-maplestory font-bold">
                      참가 인원
                    </dt>
                    <dd className="text-sm text-gray-900 font-jua">
                      {typeof eventModalItem.attendees === "number" &&
                      typeof eventModalItem.capacity === "number"
                        ? `${eventModalItem.attendees}/${eventModalItem.capacity}명`
                        : typeof eventModalItem.attendees === "number"
                        ? `${eventModalItem.attendees}명`
                        : "미정"}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                    <dt className="text-sm text-gray-500 font-maplestory font-bold">
                      상세 내용
                    </dt>
                    <dd>
                      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 min-h-[64px] font-maplestory font-bold">
                        {eventModalItem.description ?? "내용 없음"}
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 하단 액션 */}
              <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  {canEdit(eventModalItem) && (
                    <>
                      <button
                        onClick={() => setEditOpen(true)}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-jua"
                      >
                        ✎ 수정
                      </button>
                      <button
                        onClick={async () => {
                          if (!clubId) return;
                          if (!confirm("정말 삭제할까요?")) return;
                          try {
                            await CalendarApi.remove(
                              clubId,
                              Number(eventModalItem.id)
                            );
                            setEventModalOpen(false);
                            refreshMonth();
                          } catch (e) {
                            showFeedback("오류", "삭제 실패");
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

                  {/* ★ 정원 초과 시 참여신청 비활성화 */}
                  {(() => {
                    const cap =
                      typeof eventModalItem.capacity === "number"
                        ? eventModalItem.capacity
                        : undefined;
                    const att =
                      typeof eventModalItem.attendees === "number"
                        ? eventModalItem.attendees
                        : 0;
                    const isFull = cap != null && att >= cap;
                    return (
                      <button
                        onClick={() => setJoinConfirmOpen(true)}
                        disabled={isFull}
                        className={`px-4 py-2 rounded-lg text-white font-semibold text-sm font-jua ${
                          isFull
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                        title={
                          isFull
                            ? "정원이 가득 찼습니다"
                            : "이 이벤트에 참여 신청합니다"
                        }
                      >
                        {isFull ? "정원 마감" : "참여신청"}
                      </button>
                    );
                  })()}
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
            onSubmit={async (form) => {
              if (!clubId) {
                showFeedback("오류", "클럽 정보가 없습니다.");
                return;
              }
              const s = parseYMD(form.startDate);
              const e = parseYMD(form.endDate);
              if (e < s) {
                showFeedback(
                  "오류",
                  "종료 날짜가 시작 날짜보다 앞설 수 없습니다."
                );
                return;
              }
              if (
                !form.allDay &&
                form.startDate === form.endDate &&
                form.startTime &&
                form.endTime &&
                form.startTime > form.endTime
              ) {
                showFeedback("오류", "종료 시간이 시작 시간보다 빠릅니다.");
                return;
              }
              const startAt = toIsoDateTime(
                form.startDate,
                form.allDay ? "00:00" : form.startTime || "00:00"
              );
              const endAt = toIsoDateTime(
                form.endDate,
                form.allDay ? "23:59" : form.endTime || "23:59"
              );
              try {
                await CalendarApi.create(clubId, {
                  title: form.title.trim(),
                  content: form.description || "",
                  place: form.location || "",
                  capacity: form.capacity ? Number(form.capacity) : undefined,
                  expectedCost: undefined,
                  startAt,
                  endAt,
                  type: uiToEventType(form.category as Category),
                } as any);
                setFeedback({
                  title: "완료",
                  message: "이벤트가 등록되고 단톡방이 생성되었습니다!!",
                });
                setFeedbackOpen(true);
                setCreateOpen(false);
                refreshMonth();
              } catch (e) {
                const serverMsg = getBackendMessage(e);
                showFeedback("오류", serverMsg || "일정 등록 실패");
              }
            }}
            role={role}
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
            onSubmit={async (form) => {
              if (!clubId) {
                showFeedback("오류", "클럽 정보가 없습니다.");
                return;
              }
              const s = parseYMD(form.startDate);
              const e = parseYMD(form.endDate);
              if (e < s) {
                showFeedback(
                  "오류",
                  "종료 날짜가 시작 날짜보다 앞설 수 없습니다."
                );
                return;
              }
              if (
                !form.allDay &&
                form.startDate === form.endDate &&
                form.startTime &&
                form.endTime &&
                form.startTime > form.endTime
              ) {
                showFeedback("오류", "종료 시간이 시작 시간보다 빠릅니다.");
                return;
              }
              const startAt = toIsoDateTime(
                form.startDate,
                form.allDay ? "00:00" : form.startTime || "00:00"
              );
              const endAt = toIsoDateTime(
                form.endDate,
                form.allDay ? "23:59" : form.endTime || "23:59"
              );
              try {
                await CalendarApi.update(clubId, Number(eventModalItem.id), {
                  title: form.title.trim(),
                  content: form.description || "",
                  place: form.location || "",
                  capacity: form.capacity ? Number(form.capacity) : undefined,
                  expectedCost: undefined,
                  startAt,
                  endAt,
                } as any);
                setEditOpen(false);
                setEventModalOpen(false);
                refreshMonth();
              } catch (e) {
                const serverMsg = getBackendMessage(e);
                showFeedback("오류", serverMsg || "수정 실패");
              }
            }}
            role={role}
          />
        )}

        {/* ===== Join Confirm / Feedback ===== */}
        {joinConfirmOpen && eventModalOpen && eventModalItem && (
          <JoinConfirmModal
            open={joinConfirmOpen}
            onClose={() => setJoinConfirmOpen(false)}
            eventItem={eventModalItem}
            clubId={clubId ?? null}
            onJoined={(res) => {
              // 상세 모달 카드 갱신
              setEventModalItem((e) =>
                e
                  ? {
                      ...e,
                      attendees: res.attendees,
                      capacity: res.capacity ?? e.capacity,
                    }
                  : e
              );
              // 우측 리스트(월 이벤트)도 갱신
              const targetId = eventModalItem.id;
              setEvents((prev) =>
                prev.map((ev) =>
                  String(ev.id) === String(targetId)
                    ? {
                        ...ev,
                        attendees: res.attendees,
                        capacity: res.capacity ?? ev.capacity,
                      }
                    : ev
                )
              );
            }}
            onShowFeedback={showFeedback}
            onNavigateToChat={() => navigate("chat")}
          />
        )}
        <FeedbackDialog
          open={feedbackOpen}
          title={feedback.title}
          message={feedback.message}
          actions={feedback.actions}
          onClose={() => setFeedbackOpen(false)}
        />

        {/* ===== Notification ===== */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onNavigateToOnboarding={onNavigateToOnboarding}
        />
      </div>
    </div>
  );
};

/* =========================================
  EventFormModal
  ========================================= */
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
  onSubmit: (form: FormShape) => void | Promise<void>;
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
  useEffect(() => {
    if (sameDate) setForm((f) => ({ ...f, endDate: f.startDate }));
  }, [sameDate]);
  useEffect(() => {
    if (sameDate) setForm((f) => ({ ...f, endDate: f.startDate }));
  }, [form.startDate]);

  const canUseAdminCategory = role === "LEADER" || role === "MANAGER";
  const categoryOptions: Array<{
    key: Category;
    label: string;
    desc: string;
    emoji: string;
    adminOnly?: boolean;
  }> = [
    { key: "번개모임", label: "번개모임", desc: "즉석 모임", emoji: "⚡" },
    {
      key: "정모",
      label: "정모",
      desc: "정기 모임",
      emoji: "📅",
      adminOnly: true,
    },
    {
      key: "MT",
      label: "MT",
      desc: "멤버십 트레이닝",
      emoji: "🏔️",
      adminOnly: true,
    },
  ];

  const pickCategory = (c: Category, adminOnly?: boolean) => {
    if (adminOnly && !canUseAdminCategory)
      return alert("관리자 전용 카테고리입니다. (회장/임원만 가능)");
    setForm((f) => ({ ...f, category: c }));
  };
  const onToggleAllDay = (checked: boolean) => {
    setForm((f) =>
      checked
        ? { ...f, allDay: true, startTime: "00:00", endTime: "23:59" }
        : { ...f, allDay: false }
    );
  };

  const submit = () => {
    if (!form.category) {
      alert("카테고리를 선택하세요.");
      return;
    }
    if (!form.title.trim()) {
      alert("모임 제목을 입력하세요.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      alert("날짜를 입력하세요.");
      return;
    }
    if (
      !form.allDay &&
      form.startDate === form.endDate &&
      form.startTime &&
      form.endTime &&
      form.startTime > form.endTime
    ) {
      alert("종료 시간이 시작 시간보다 빠릅니다.");
      return;
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
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-lg font-bold text-gray-900 font-jua">
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 카테고리 */}
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
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
                      ${
                        selected
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }
                      ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-3xl">{c.emoji}</div>
                    <div className="font-semibold text-gray-900 font-jua">
                      {c.label}
                    </div>
                    <div className="text-xs text-gray-500 font-maplestory font-bold">
                      {c.desc}
                    </div>
                    {c.adminOnly && (
                      <span className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-maplestory font-bold">
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
            <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
              모임 제목 *
            </div>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="모임 제목을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-maplestory font-bold"
            />
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-maplestory font-bold">
                  시작 날짜 *
                </div>
              </div>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-maplestory font-bold"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-maplestory font-bold">
                  종료 날짜 *
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 font-maplestory font-bold">
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-maplestory font-bold"
              />
            </div>
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 font-maplestory font-bold">
                  시작 시간 (선택)
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 font-maplestory font-bold">
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-maplestory font-bold"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
                종료 시간 (선택)
              </div>
              <input
                type="time"
                value={form.endTime}
                disabled={form.allDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endTime: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 font-maplestory font-bold"
              />
            </div>
          </div>

          {/* 기타 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
                장소
              </div>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="장소"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-maplestory font-bold"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white font-maplestory font-bold"
              />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2 font-maplestory font-bold">
              상세 내용
            </div>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="모임에 대한 상세한 설명을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white min-h-[110px] font-maplestory font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-maplestory font-bold"
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
