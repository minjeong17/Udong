import React, { useMemo, useRef, useState } from "react";
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';

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
  amount: number; // +값
  balance: number; // 해당 거래 후 잔액
  receiptUrl?: string; // 첨부된 영수증 URL
};

const clsx = (...xs: Array<string | false | undefined>) => xs.filter(Boolean).join(" ");
const krw = (n: number) => n.toLocaleString("ko-KR") + "원";

function downloadCSV(filename: string, rows: Transaction[]) {
  // CSV 셀 이스케이프 (콤마/따옴표/개행 포함 시 RFC4180 규칙)
  const toCell = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = ["id","date","description","type","amount","balance","receiptUrl"];
  const lines: string[] = [];
  lines.push(header.map(toCell).join(","));
  for (const r of rows) {
    lines.push([r.id, r.date, r.description, r.type, r.amount, r.balance, r.receiptUrl ?? ""].map(toCell).join(","));
  }

  // CRLF + BOM(Excel 호환)
  const csv = lines.join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename || "export.csv"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"|"lg"; }>
= ({ className, variant = "primary", size = "md", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-2xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed font-jua";
  const sizes = { sm:"h-8 px-3 text-sm", md:"h-10 px-4 text-sm", lg:"h-12 px-5 text-base" };
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600",
    secondary: "bg-white text-orange-600 border border-orange-300 hover:border-orange-400",
    ghost: "text-orange-700 hover:bg-orange-100",
  } as const;
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
};

// ✅ Badge 타입 안전하게 재구성
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


// 모달(업그레이드)
type ModalProps = { open: boolean; title?: string; onClose: () => void; children?: React.ReactNode };
const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dim + blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[min(92vw,980px)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="relative border-b bg-gradient-to-br from-slate-50 to-white px-6 py-5">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <button aria-label="close" onClick={onClose} className="absolute right-3 top-3 rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">✕</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ============== Main
const ClubFund: React.FC<ClubFundProps> = ({ onNavigateToOnboarding }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // 데모 데이터 (실서비스는 API 응답으로 대체)
  const demoTxs: Transaction[] = [
    { id: "1", date: "2024-01-03", description: "부원 회비 입금", type: "입금", amount: 500_000, balance: 2_500_000 },
    { id: "2", date: "2024-01-05", description: "동아리 방 청소 용품", type: "출금", amount: 45_000, balance: 2_455_000 },
    { id: "3", date: "2024-01-08", description: "정기 모임 간식 구입", type: "출금", amount: 30_000, balance: 2_425_000 },
    { id: "4", date: "2024-01-09", description: "후원금", type: "입금", amount: 70_000, balance: 2_495_000 },
    { id: "5", date: "2024-01-11", description: "장비 구매 - 카메라", type: "출금", amount: 150_000, balance: 2_345_000, receiptUrl: "/camera-equipment-purchase-receipt.jpg" },
  ];

  // Data
  const [balance, setBalance] = useState<number>(2_695_000);
  const [txs, setTxs] = useState<Transaction[]>(() => {
    // 초기 로드 시 최신순으로 정렬된 거래내역 표시
    return [...demoTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(true); // 초기 로드 시 이미 조회된 상태
  const [from, setFrom] = useState("2024-01-01");
  const [to, setTo] = useState("2024-12-31");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const income = useMemo(() => txs.filter(t=>t.type==="입금").reduce((s,t)=>s+t.amount,0), [txs]);
  const expense = useMemo(() => txs.filter(t=>t.type==="출금").reduce((s,t)=>s+t.amount,0), [txs]);
  const net = income - expense;

  const refreshBalance = async () => {
    setIsLoading(true);
    await new Promise(r=>setTimeout(r,700));
    const delta = Math.round((Math.random() - 0.5) * 120_000);
    setBalance(b=>Math.max(0,b+delta));
    setIsLoading(false);
  };

  const queryTransactions = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    // 날짜 범위 필터링
    const filteredTxs = demoTxs.filter(tx => {
      const txDate = new Date(tx.date);
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return txDate >= fromDate && txDate <= toDate;
    });

    // 날짜 기준 역순 정렬 (최신순)
    const sortedTxs = filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTxs(sortedTxs);
    setHasQueried(true);
    setIsLoading(false);
  };

  const onPick = () => fileRef.current?.click();
  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]; if(!f) return;
    const url = URL.createObjectURL(f); setPreview(url);
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); const f = e.dataTransfer.files?.[0]; if(!f) return;
    const url = URL.createObjectURL(f); setPreview(url);
  };
  const saveReceipt = () => {
    if(!selected || !preview) return;
    setTxs(prev=>prev.map(t=>t.id===selected.id?{...t, receiptUrl:preview}:t));
    setSelected(null); setPreview(null);
  };
  const removeReceipt = () => {
    if(!selected) return;
    setTxs(prev=>prev.map(t=>t.id===selected.id?{...t, receiptUrl:undefined}:t));
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex">
      <Sidebar
        onNavigateToOnboarding={onNavigateToOnboarding}
        onShowNotification={() => setShowNotificationModal(true)}
      />

      {/* Main inset */}
      <div className="flex-1">

        <main className="flex-1 p-8">
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800 font-jua">공금 사용 내역</h1>
              <p className="text-gray-600 font-gowun">동아리 계좌 내역 및 잔액을 관리하세요</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 p-6 shadow-lg">
              <div className="absolute right-4 top-4">
                {/* 잔액 조회(=잔액+내역 동시) */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async ()=>{ await refreshBalance(); await queryTransactions(); }}
                  disabled={isLoading}
                  className="rounded-full"
                >
                  <span className={clsx("mr-2", isLoading && "animate-spin")}>🔄</span> 잔액 조회
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg">💰</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 font-gowun">현재 잔액</div>
                  <div className="mt-1 text-4xl font-extrabold tracking-tight md:text-5xl font-jua">{krw(balance)}</div>
                  <div className="mt-1 text-xs text-gray-500 font-gowun">마지막 업데이트: {new Date().toLocaleString("ko-KR")}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-orange-200 bg-white/70 p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-500 font-gowun">이번 달 입금</div>
                  <div className="mt-1 text-xl font-semibold text-green-600 font-jua">+ {krw(income)}</div>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-white/70 p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-500 font-gowun">이번 달 출금</div>
                  <div className="mt-1 text-xl font-semibold text-red-600 font-jua">- {krw(expense)}</div>
                </div>
                <div className={clsx("rounded-2xl border border-orange-200 bg-white/70 p-4 backdrop-blur-sm")}>
                  <div className="text-xs text-gray-500 font-gowun">순 증감</div>
                  <div className={clsx("mt-1 text-xl font-semibold font-jua", net>=0?"text-green-600":"text-red-600")}>
                    {net>=0?"+":"-"} {krw(Math.abs(net))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Query row */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-gowun">조회 시작일</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="h-10 rounded-2xl border border-orange-300 px-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none font-gowun" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-gowun">조회 종료일</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="h-10 rounded-2xl border border-orange-300 px-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none font-gowun" />
            </div>
            <div className="flex items-end gap-2">
              {/* 한 줄 배치: 거래 내역 조회 → CSV 내보내기 */}
              <Button className="w-full md:w-auto" onClick={queryTransactions} disabled={isLoading}>
                <span className={clsx("mr-2", isLoading && "animate-spin")}>📥</span> 거래 내역 조회
              </Button>
              <Button variant="secondary" className="w-full md:w-auto" onClick={()=>downloadCSV("transactions.csv", txs)}>
                CSV 내보내기
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-orange-100 px-5 py-3">
              <span>📑</span>
              <h3 className="text-base font-semibold font-jua">거래 내역</h3>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-orange-50/80 backdrop-blur text-left text-gray-600 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-5 py-3 font-medium font-gowun">날짜</th>
                    <th className="px-5 py-3 font-medium font-gowun">내역</th>
                    <th className="px-5 py-3 font-medium font-gowun">구분</th>
                    <th className="px-5 py-3 font-medium text-right font-gowun">금액</th>
                    <th className="px-5 py-3 font-medium text-right font-gowun">잔액</th>
                    <th className="px-5 py-3 font-medium text-center font-gowun">영수증</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasQueried ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-500 font-gowun">
                        아직 조회되지 않았습니다. 위의 <strong>거래 내역 조회</strong> 버튼을 눌러 주세요.
                      </td>
                    </tr>
                  ) : txs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-500 font-gowun">조회 결과가 없습니다.</td>
                    </tr>
                  ) : (
                    txs.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-orange-50">
                        <td className="px-5 py-4 whitespace-nowrap font-gowun">{t.date}</td>
                        <td className="px-5 py-4 min-w-[16rem] font-gowun">{t.description}</td>
                        <td className="px-5 py-4">
                          <Badge tone={t.type === "입금" ? "green" : "red"}>{t.type}</Badge>
                        </td>
                        <td className={clsx("px-5 py-4 text-right tabular-nums font-jua", t.type === "입금" ? "text-green-600" : "text-red-600")}>
                          {t.type === "입금" ? "+" : "-"}{krw(t.amount)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums font-jua">{krw(t.balance)}</td>
                        <td className="px-5 py-4 text-center">
                          {t.type === "출금" ? (
                            <Button size="sm" variant="secondary" className="rounded-full px-3" onClick={() => { setSelected(t); setPreview(t.receiptUrl ?? null); }}>
                              🧾 영수증
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-orange-100 px-5 py-3 text-sm text-gray-600">
              <div className="font-gowun">표시: {txs.length}건</div>
              <div className="flex items-center gap-2 font-gowun">{hasQueried ? <span>최근 조회 반영</span> : <span className="text-gray-400">상단에서 '거래 내역 조회'</span>}</div>
            </div>
          </div>
        </main>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />

      {/* Receipt Modal */}
      <Modal open={!!selected} onClose={()=>{ setSelected(null); setPreview(null); }} title="영수증 첨부/수정">
        {selected && (
          <div className="space-y-6">
            {/* 상단 그리드: 좌(미리보기) / 우(파일 정보) */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* 좌측: 대상 + 드롭존/미리보기 */}
              <section className="md:col-span-2">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">대상 내역</div>
                  <div className="mt-1">
                    {selected.date} · {selected.description} · {krw(selected.amount)}
                  </div>
                </div>

                <div
                  onDrop={onDrop}
                  onDragOver={(e)=>e.preventDefault()}
                  className={clsx(
                    // aspect 비율로 안정적인 높이 확보
                    "mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 text-sm text-gray-500 transition",
                    preview ? "border-emerald-200" : "border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30"
                  )}
                >
                  {preview ? (
                    <img alt="preview" src={preview} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center">
                      이미지를 드래그&드롭 하거나 오른쪽의 <span className="ml-1 font-medium text-gray-700">파일 선택</span>을 사용하세요.
                    </div>
                  )}
                </div>
              </section>

              {/* 우측: 파일 정보 + 액션 */}
              <aside className="md:col-span-1">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">파일</div>
                  <div className="rounded-2xl border px-3 py-2 text-sm text-gray-500">
                    {preview ? "선택됨" : "선택된 파일 없음"}
                  </div>

                  <div className="flex gap-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                    <Button onClick={onPick} className="flex-1">파일 선택</Button>
                    {selected.receiptUrl && (
                      <Button variant="secondary" onClick={removeReceipt} className="flex-1">
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
                      기존 영수증 보기
                    </a>
                  )}
                </div>
              </aside>
            </div>

            {/* 푸터 액션: 우측 정렬 */}
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button variant="secondary" onClick={()=>{ setSelected(null); setPreview(null); }}>취소</Button>
              <Button onClick={saveReceipt} disabled={!preview}>저장</Button>
            </div>

            <p className="text-xs text-gray-400">
              ※ 데모: 실제 업로드 시 S3 Presigned URL 등으로 교체하세요.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ClubFund;
