import React, { useMemo, useRef, useState } from "react";

// =============================
// ClubFund (Original-look Replica)
// Vite + React + Tailwind + TypeScript — Single file
// =============================

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

// ============== Tiny primitives
const IconBtn: React.FC<{label?: string; active?: boolean; onClick?: () => void; children: React.ReactNode}> = ({label, active, onClick, children}) => (
  <button onClick={onClick} title={label}
    className={clsx("grid h-12 w-12 place-items-center rounded-2xl transition", active?"bg-gray-900 text-white shadow-sm":"text-gray-600 hover:bg-gray-100")}>{children}</button>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"|"lg"; }>
= ({ className, variant = "primary", size = "md", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-2xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm:"h-8 px-3 text-sm", md:"h-10 px-4 text-sm", lg:"h-12 px-5 text-base" };
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-white text-gray-900 border border-gray-300 hover:border-gray-400",
    ghost: "text-gray-700 hover:bg-gray-100",
  } as const;
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />
};

const Badge: React.FC<{ tone?: "gray"|"blue"|"green"|"red" }>= ({tone="gray", children}) => (
  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
  }[tone])}>{children}</span>
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
export default function ClubFund() {
  // Data
  const [balance, setBalance] = useState<number>(2_695_000);
  const [txs, setTxs] = useState<Transaction[]>([]); // 초기엔 비어 있음

  // 데모 데이터 (실서비스는 API 응답으로 대체)
  const demoTxs: Transaction[] = [
    { id: "1", date: "2024-01-03", description: "부원 회비 입금", type: "입금", amount: 500_000, balance: 2_500_000 },
    { id: "2", date: "2024-01-05", description: "동아리 방 청소 용품", type: "출금", amount: 45_000, balance: 2_455_000 },
    { id: "3", date: "2024-01-08", description: "정기 모임 간식 구입", type: "출금", amount: 30_000, balance: 2_425_000 },
    { id: "4", date: "2024-01-09", description: "후원금", type: "입금", amount: 70_000, balance: 2_495_000 },
    { id: "5", date: "2024-01-11", description: "장비 구매 - 카메라", type: "출금", amount: 150_000, balance: 2_345_000, receiptUrl: "/camera-equipment-purchase-receipt.jpg" },
  ];

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
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
    setTxs(demoTxs);
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
    <div className="flex min-h-screen w-full bg-white text-gray-900">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-20 flex-col items-center border-r border-gray-200 bg-white">
        <div className="p-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-xl shadow">🐻</div>
        </div>
        <nav className="flex-1 space-y-3 px-4">
          <IconBtn label="대시보드">🏠</IconBtn>
          <IconBtn label="캘린더">📅</IconBtn>
          <IconBtn label="채팅">💬</IconBtn>
          <IconBtn label="회비 관리" active>💳</IconBtn>
          <IconBtn label="정산">🧾</IconBtn>
          <IconBtn label="상점">🛍️</IconBtn>
          <IconBtn label="투표">🗳️</IconBtn>
          <IconBtn label="클럽 선택">👥</IconBtn>
        </nav>
        <div className="mt-auto w-full px-4 pb-4">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-700">⚙️</div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-900 text-white">🙂</div>
        </div>
      </aside>

      {/* Main inset */}
      <div className="flex-1">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-semibold">회비 관리</h1>
              <p className="text-xs text-gray-500">원본 레이아웃 느낌으로 재현</p>
            </div>
            <div className="flex items-center gap-2"></div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-6">
          {/* Page Title */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">공금 관리</h2>
            <p className="mt-1 text-sm text-gray-600">동아리 계좌 내역 및 잔액을 관리하세요</p>
          </div>

          {/* Hero */}
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-yellow-50 to-emerald-50 p-6 shadow-sm">
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
                  <div className="text-sm font-semibold text-gray-900">현재 잔액</div>
                  <div className="mt-1 text-4xl font-extrabold tracking-tight md:text-5xl">{krw(balance)}</div>
                  <div className="mt-1 text-xs text-gray-500">마지막 업데이트: {new Date().toLocaleString("ko-KR")}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-500">이번 달 입금</div>
                  <div className="mt-1 text-xl font-semibold text-emerald-700">+ {krw(income)}</div>
                </div>
                <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-500">이번 달 출금</div>
                  <div className="mt-1 text-xl font-semibold text-rose-700">- {krw(expense)}</div>
                </div>
                <div className={clsx("rounded-2xl border bg-white/70 p-4 backdrop-blur-sm")}>
                  <div className="text-xs text-gray-500">순 증감</div>
                  <div className={clsx("mt-1 text-xl font-semibold", net>=0?"text-emerald-700":"text-rose-700")}>
                    {net>=0?"+":"-"} {krw(Math.abs(net))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Query row */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">조회 시작일</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="h-10 rounded-2xl border border-gray-300 px-3 text-sm shadow-sm focus:border-black focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">조회 종료일</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="h-10 rounded-2xl border border-gray-300 px-3 text-sm shadow-sm focus:border-black focus:outline-none" />
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
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <span>📑</span>
              <h3 className="text-base font-semibold">거래 내역</h3>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-amber-50/80 backdrop-blur text-left text-gray-600 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">날짜</th>
                    <th className="px-5 py-3 font-medium">내역</th>
                    <th className="px-5 py-3 font-medium">구분</th>
                    <th className="px-5 py-3 font-medium text-right">금액</th>
                    <th className="px-5 py-3 font-medium text-right">잔액</th>
                    <th className="px-5 py-3 font-medium text-center">영수증</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasQueried ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-500">
                        아직 조회되지 않았습니다. 위의 <strong>거래 내역 조회</strong> 버튼을 눌러 주세요.
                      </td>
                    </tr>
                  ) : txs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-500">조회 결과가 없습니다.</td>
                    </tr>
                  ) : (
                    txs.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap">{t.date}</td>
                        <td className="px-5 py-4 min-w-[16rem]">{t.description}</td>
                        <td className="px-5 py-4">
                          <Badge tone={t.type === "입금" ? "green" : "red"}>{t.type}</Badge>
                        </td>
                        <td className={clsx("px-5 py-4 text-right tabular-nums", t.type === "입금" ? "text-emerald-700" : "text-rose-700")}>
                          {t.type === "입금" ? "+" : "-"}{krw(t.amount)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">{krw(t.balance)}</td>
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

            <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-gray-600">
              <div>표시: {txs.length}건</div>
              <div className="flex items-center gap-2">{hasQueried ? <span>최근 조회 반영</span> : <span className="text-gray-400">상단에서 '거래 내역 조회'</span>}</div>
            </div>
          </div>
        </main>
      </div>

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
}
