import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import { ClubFundApi, mapDtoToUi } from "../apis/clubfund/api";
import ExcelJS from "exceljs";

interface ClubFundProps {
  onNavigateToOnboarding: () => void;
  currentRoute?: string;
}

type TxType = "입금" | "출금";

type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TxType;
  amount: number;
  balance: number;
  receiptUrl?: string;
  // (참고) API에 '영수증 메모' 필드가 생기면 여기에 receiptMemo?: string; 추가하면 됩니다.
};

const clsx = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");
const krw = (n: number) => n.toLocaleString("ko-KR") + "원";

// Badge
type BadgeTone = "gray" | "blue" | "green" | "red";
const BADGE_TONES: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
} as const;
const Badge: React.FC<React.PropsWithChildren<{ tone?: BadgeTone }>> = ({
  tone = "gray",
  children,
}) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium font-gowun",
      BADGE_TONES[tone]
    )}
  >
    {children}
  </span>
);

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
  }
> = ({ className, variant = "primary", size = "md", ...props }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed font-jua";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600",
    secondary:
      "bg-white text-orange-600 border border-orange-300 hover:border-orange-400",
    ghost: "text-orange-700 hover:bg-orange-100",
  } as const;
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
};

// 모달
type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
};
const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[min(92vw,980px)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="relative border-b bg-gradient-to-br from-slate-50 to-white px-6 py-5">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <button
              aria-label="close"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const ClubFund: React.FC<ClubFundProps> = ({ onNavigateToOnboarding }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const CLUB_ID = useAuthStore((s) => s.clubId);
  const myRole = useAuthStore((s) => s.myRole);

  // 🔒 권한: 지금은 LEADER로 하드코딩
  const role: "LEADER" | "MANAGER" | "MEMBER" =
    myRole === "LEADER" || myRole === "MANAGER" || myRole === "MEMBER"
      ? myRole
      : "MEMBER";
  const canEditReceipt = role === "LEADER";

  if (CLUB_ID == null) return null;

  // 날짜 유틸
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayISO = toISO(new Date());
  const shiftMonths = (base: Date, months: number) => {
    const d = new Date(base);
    d.setMonth(d.getMonth() - months);
    return d;
  };
  const setQuickRange = (months: number) => {
    const end = new Date();
    const start = shiftMonths(end, months);
    setTo(toISO(end));
    setFrom(toISO(start));
  };

  // ⛳ 종료일 가드: 미래 불가, 시작일보다 앞서면 시작일을 끌어올림
  const clampTo = (v: string) => {
    if (!v) return;
    const clamped = v > todayISO ? todayISO : v; // 미래 금지
    if (from && clamped < from) setFrom(clamped); // 시작일 보정
    setTo(clamped);
  };

  // Data
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  // 로딩
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  // UI 상태 - 페이지 진입 시 1년치로 초기화
  const oneYearAgo = toISO(shiftMonths(new Date(), 12));
  const [from, setFrom] = useState(oneYearAgo);
  const [to, setTo] = useState(todayISO);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [uploading, setUploading] = useState(false);

  /** ✅ 페이지 진입 시 잔액 및 1년치 거래내역 자동 조회 */
  useEffect(() => {
    refreshBalance();
    queryTransactions(); // 1년치 거래내역 자동 조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== API 연동 =====
  const refreshBalance = async () => {
    try {
      setLoadingBalance(true);
      const data = await ClubFundApi.getBalance(CLUB_ID);
      setBalance(data.balance - 40000); // 수수료 2만원 차감
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "잔액 조회 중 오류가 발생했습니다.");
    } finally {
      setLoadingBalance(false);
    }
  };

  const queryTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await ClubFundApi.getTransactions({
        clubId: CLUB_ID!,
        from,
        to,
      });

      const toTs = (d?: string, t?: string) => {
        if (!d) return 0;
        const yyyy = +d.slice(0, 4);
        const mm = +d.slice(4, 6) - 1;
        const dd = +d.slice(6, 8);
        const hh = +(t ?? "000000").slice(0, 2);
        const mi = +(t ?? "000000").slice(2, 4);
        const ss = +(t ?? "000000").slice(4, 6);
        return Date.UTC(yyyy, mm, dd, hh, mi, ss);
      };

      const sorted = (res.transactions ?? [])
        .sort((a, b) => {
          const diff = toTs(b.date, b.time) - toTs(a.date, a.time);
          if (diff !== 0) return diff;
          return (b.transactionId ?? 0) - (a.transactionId ?? 0);
        })
        .map(mapDtoToUi);

      setTxs(sorted.slice(2)); // 첫 번째 항목 제외
      setHasQueried(true);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "거래 내역 조회 중 오류가 발생했습니다.");
    } finally {
      setLoadingTx(false);
    }
  };

  // ====== 엑셀(.xlsx) 내보내기 ======
  const downloadTxXLSX = async (filename: string, rows: Transaction[]) => {
    const wb = new ExcelJS.Workbook();
    wb.created = new Date();

    const ws = wb.addWorksheet("거래 내역", {
      views: [{ state: "frozen", ySplit: 1 }], // 헤더 고정
      properties: { defaultRowHeight: 18 },
    });

    // 열 정의
    ws.columns = [
      { header: "날짜", key: "date", width: 12 },
      { header: "내역", key: "desc", width: 36 },
      { header: "구분", key: "type", width: 10 },
      {
        header: "금액",
        key: "amount",
        width: 14,
        style: { numFmt: "₩#,##0;[Red]-₩#,##0" },
      },
      {
        header: "잔액",
        key: "balance",
        width: 14,
        style: { numFmt: "₩#,##0" },
      },
      { header: "영수증", key: "receiptUrl", width: 24 },
    ];

    // 헤더 스타일
    const header = ws.getRow(1);
    header.height = 22;
    header.eachCell((c) => {
      c.font = { bold: true };
      c.alignment = { vertical: "middle", horizontal: "center" };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF6F6F6" },
      };
      c.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // 데이터 입력
    rows.forEach((r) => {
      const signedAmount = r.type === "입금" ? r.amount : -r.amount;
      ws.addRow({
        date: r.date, // 텍스트로 보존(YYYY-MM-DD)
        desc: r.description ?? "",
        type: r.type,
        amount: signedAmount, // 숫자 (양/음표현)
        balance: r.balance, // 숫자
        receiptUrl: r.receiptUrl ?? "",
      });
    });

    // 본문 스타일 & 하이퍼링크 처리
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFEEEEEE" } },
          left: { style: "thin", color: { argb: "FFEEEEEE" } },
          bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
          right: { style: "thin", color: { argb: "FFEEEEEE" } },
        };
      });

      // 영수증 하이퍼링크
      const url = ws.getCell(`F${i}`).value as string;
      if (url && typeof url === "string") {
        ws.getCell(`F${i}`).value = { text: "열기", hyperlink: url };
        ws.getCell(`F${i}`).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      } else {
        ws.getCell(`F${i}`).value = "-";
        ws.getCell(`F${i}`).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }
    }

    // 자동필터
    ws.autoFilter = { from: "A1", to: "F1" };

    // 조건부 서식: 금액 열(양수=녹색, 음수=빨강)
    if (ws.rowCount >= 2) {
      ws.addConditionalFormatting({
        ref: `D2:D${ws.rowCount}`,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: ["0"],
            priority: 1, // ✅ 추가
            style: { font: { color: { argb: "FF1F7A1F" }, bold: true } },
          },
          {
            type: "cellIs",
            operator: "lessThan",
            formulae: ["0"],
            priority: 2, // ✅ 추가
            style: { font: { color: { argb: "FFB00000" }, bold: true } },
          },
        ],
      });
    }

    // 버퍼 → Blob → 다운로드
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

  // 파일 핸들링
  const onPick = () => fileRef.current?.click();
  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const saveReceipt = async () => {
    if (!selected || !selectedFile || !CLUB_ID) return;
    try {
      setUploading(true);
      await ClubFundApi.attachReceiptMultipart({
        clubId: CLUB_ID,
        transactionId: Number(selected.id),
        file: selectedFile,
        memo: memo || undefined,
      });
      await queryTransactions();
      setSelected(null);
      setPreview(null);
      setSelectedFile(null);
      setMemo("");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "영수증 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const removeReceipt = () => {
    if (!selected) return;
    setTxs((prev) =>
      prev.map((t) =>
        t.id === selected.id ? { ...t, receiptUrl: undefined } : t
      )
    );
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex">
      <Sidebar
        onNavigateToOnboarding={onNavigateToOnboarding}
        onShowNotification={() => setShowNotificationModal(true)}
      />

      <div className="flex-1">
        <main className="flex-1 p-8">
          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800 font-jua">
                공금 사용 내역
              </h1>
              <p className="text-gray-600 font-gowun">
                동아리 계좌 내역 및 잔액을 관리하세요
              </p>
            </div>
          </div>

          {/* 상단 두 카드 (2 : 3) */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-[2fr_3fr]">
            {/* 잔액 카드 */}
            <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 p-6 shadow-lg">
              <div className="absolute right-4 top-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshBalance}
                  disabled={loadingBalance}
                  className="rounded-full"
                >
                  <span
                    className={clsx("mr-2", loadingBalance && "animate-spin")}
                  >
                    🔄
                  </span>{" "}
                  잔액 조회
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg">
                  💰
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 font-gowun">
                    현재 잔액
                  </div>
                  <div className="mt-1 text-4xl font-extrabold tracking-tight md:text-5xl font-jua">
                    {krw(balance)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-gowun">
                    마지막 업데이트: {new Date().toLocaleString("ko-KR")}
                  </div>
                </div>
              </div>
            </div>

            {/* 조회 카드 */}
            <div className="rounded-2xl border border-orange-200 bg-white shadow-lg">
              <div className="flex items-center gap-2 border-b border-orange-100 px-5 py-3">
                <span>🔎</span>
                <h3 className="text-base font-semibold font-jua">거래 조회</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                  {/* 시작일 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 font-gowun">
                      조회 시작일
                    </label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFrom(v);
                        // 시작일이 종료일보다 크면 종료일을 시작일로 맞춤
                        if (to && v > to) setTo(v);
                      }}
                      max={todayISO}
                      className="h-10 rounded-2xl border border-orange-300 px-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none font-gowun"
                    />
                  </div>
                  {/* 종료일 (미래 금지, 시작일 이상으로 허용) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 font-gowun">
                      조회 종료일
                    </label>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => clampTo(e.target.value)}
                      max={todayISO}
                      min={from || undefined}
                      className="h-10 rounded-2xl border border-orange-300 px-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none font-gowun"
                    />
                  </div>
                  {/* 빠른 선택 */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className="text-sm text-gray-600 font-gowun">
                      빠른 선택
                    </label>
                    <div className="flex flex-nowrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickRange(1)}
                        className="px-3"
                      >
                        1개월
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickRange(3)}
                        className="px-3"
                      >
                        3개월
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickRange(6)}
                        className="px-3"
                      >
                        6개월
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickRange(12)}
                        className="px-3"
                      >
                        1년
                      </Button>
                    </div>
                  </div>
                  {/* 조회 버튼 */}
                  <div className="flex justify-end">
                    <Button
                      className="whitespace-nowrap px-5"
                      onClick={queryTransactions}
                      disabled={loadingTx}
                    >
                      <span
                        className={clsx("mr-2", loadingTx && "animate-spin")}
                      >
                        📥
                      </span>
                      거래 내역 조회
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 거래 내역 카드 (항상 렌더링) */}
          <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-orange-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <span>📑</span>
                <h3 className="text-base font-semibold font-jua">거래 내역</h3>
              </div>
              {hasQueried && txs.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // 파일명: clubfund_조회시작일_조회종료일.xlsx
                    const start = (from || "").replaceAll("-", "");
                    const end = (to || "").replaceAll("-", "");
                    const fname = `clubfund_${start}_${end}.xlsx`;
                    downloadTxXLSX(fname, txs);
                  }}
                  className="rounded-full"
                  title="현재 조회된 내역을 엑셀로 저장"
                >
                  ⬇️ 엑셀로 내보내기
                </Button>
              )}
            </div>

            {/* 본문 */}
            {!hasQueried ? (
              <div className="m-5 rounded-xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-6 text-center">
                <div className="text-sm text-gray-700 font-gowun">
                  기간을 선택하거나{" "}
                  <span className="font-semibold">빠른 선택</span>을 누른 뒤
                  <span className="font-semibold"> 거래 내역 조회</span> 버튼을
                  눌러 내역을 불러오세요.
                </div>
              </div>
            ) : loadingTx ? (
              <div className="px-5 py-16 text-center text-sm text-gray-500 font-gowun">
                불러오는 중입니다…
              </div>
            ) : txs.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-gray-500 font-gowun">
                조회 결과가 없습니다. 기간을 조정해 다시 시도해 보세요.
              </div>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-orange-50/80 backdrop-blur text-left text-gray-600 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)]">
                      <tr>
                        <th className="px-5 py-3 font-medium font-gowun">
                          날짜
                        </th>
                        <th className="px-5 py-3 font-medium font-gowun">
                          내역
                        </th>
                        <th className="px-5 py-3 font-medium font-gowun">
                          구분
                        </th>
                        <th className="px-5 py-3 font-medium text-right font-gowun">
                          금액
                        </th>
                        <th className="px-5 py-3 font-medium text-right font-gowun">
                          잔액
                        </th>
                        <th className="px-5 py-3 font-medium text-center font-gowun">
                          영수증
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((t) => (
                        <tr key={t.id} className="border-t hover:bg-orange-50">
                          <td className="px-5 py-4 whitespace-nowrap font-gowun">
                            {t.date}
                          </td>
                          <td className="px-5 py-4 min-w-[16rem] font-gowun">
                            {t.description}
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={t.type === "입금" ? "green" : "red"}>
                              {t.type}
                            </Badge>
                          </td>
                          <td
                            className={clsx(
                              "px-5 py-4 text-right tabular-nums font-jua",
                              t.type === "입금"
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {t.type === "입금" ? "+" : "-"}
                            {krw(t.amount)}
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums font-jua">
                            {krw(t.balance)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {t.type !== "출금" ? (
                              <span className="text-gray-400">-</span>
                            ) : canEditReceipt ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-full px-3"
                                onClick={() => {
                                  setSelected(t);
                                  setPreview(t.receiptUrl ?? null);
                                }}
                              >
                                🧾 영수증
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-full px-3"
                                onClick={() => {
                                  setSelected(t);
                                  setPreview(t.receiptUrl ?? null);
                                }}
                              >
                                🧾 영수증 보기
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-orange-100 px-5 py-3 text-sm text-gray-600">
                  <div className="font-gowun">표시: {txs.length}건</div>
                  <div className="flex items-center gap-2 font-gowun">
                    <span>최근 조회 반영</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />

      {/* Receipt Modal - 편집 가능(LEADER) / 보기 전용(그 외) 공용 */}
      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setPreview(null);
          setSelectedFile?.(null);
          setMemo?.("");
        }}
        title={canEditReceipt ? "영수증 첨부/수정" : "영수증"}
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* 미리보기 */}
              <section className="md:col-span-2">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">대상 내역</div>
                  <div className="mt-1">
                    {selected.date} · {selected.description} ·{" "}
                    {krw(selected.amount)}
                  </div>
                </div>

                <div
                  onDrop={canEditReceipt ? onDrop : undefined}
                  onDragOver={
                    canEditReceipt ? (e) => e.preventDefault() : undefined
                  }
                  className={clsx(
                    "mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 text-sm text-gray-500 transition",
                    preview ? "border-emerald-200" : "border-gray-300",
                    !canEditReceipt && "pointer-events-auto" // 보기 전용에서도 스크롤/클릭 가능
                  )}
                  title={canEditReceipt ? undefined : "보기 전용"}
                >
                  {preview ? (
                    <img
                      alt="preview"
                      src={preview}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center">
                      {canEditReceipt ? (
                        <>
                          이미지를 드래그&드롭 하거나 오른쪽의{" "}
                          <span className="ml-1 font-medium text-gray-700">
                            파일 선택
                          </span>
                          을 사용하세요.
                        </>
                      ) : (
                        <>등록된 영수증이 없어요.</>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* 우측 패널 */}
              <aside className="md:col-span-1">
                <div className="space-y-3">
                  {/* 보기 전용일 때: 메모(내역 메모) 표시 */}
                  {!canEditReceipt && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">
                        내역 메모
                      </div>
                      <div className="rounded-2xl border px-3 py-2 text-sm text-gray-700 bg-gray-50">
                        {selected.description || "메모 없음"}
                      </div>
                    </div>
                  )}

                  {canEditReceipt && (
                    <>
                      <div className="text-sm text-gray-600">파일</div>
                      <div className="rounded-2xl border px-3 py-2 text-sm text-gray-600">
                        {selectedFile
                          ? `${selectedFile.name} (${Math.round(
                              selectedFile.size / 1024
                            )} KB)`
                          : preview
                          ? "선택됨"
                          : "선택된 파일 없음"}
                      </div>

                      <div className="flex gap-2">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onFile}
                        />
                        <Button onClick={onPick} className="flex-1">
                          파일 선택
                        </Button>
                        {selected.receiptUrl && (
                          <Button
                            variant="secondary"
                            onClick={removeReceipt}
                            className="flex-1"
                          >
                            기존 제거
                          </Button>
                        )}
                      </div>

                      {selected.receiptUrl && !preview && (
                        <a
                          href={selected.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border px-3 py-2 text-center text-sm text-gray-600 hover:bg-gray-50"
                        >
                          기존 영수증 새 탭에서 보기
                        </a>
                      )}

                      <div className="space-y-2 pt-1">
                        <label className="text-sm text-gray-600">
                          메모 (선택)
                        </label>
                        <input
                          type="text"
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          placeholder="예: 계산서 번호, 비고 등"
                          className="w-full h-10 rounded-2xl border border-orange-300 px-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none font-gowun"
                        />
                      </div>
                    </>
                  )}
                </div>
              </aside>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(null);
                  setPreview(null);
                  setSelectedFile?.(null);
                  setMemo?.("");
                }}
              >
                닫기
              </Button>
              {canEditReceipt && (
                <Button
                  onClick={saveReceipt}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? "업로드 중…" : "저장"}
                </Button>
              )}
            </div>

            {!canEditReceipt && (
              <p className="text-xs text-gray-400">※ 권한: 보기 전용</p>
            )}
            {canEditReceipt && (
              <p className="text-xs text-gray-400">
                ※ 이미지 선택 후 <strong>저장</strong>을 누르면 서버에
                업로드되며, 성공 시 목록이 자동 새로고침됩니다.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClubFund;
