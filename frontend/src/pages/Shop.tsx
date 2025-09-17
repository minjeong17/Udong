import { useState } from "react";

/** 텍스트만 링크 (밑줄은 hover 때만) */
function MyPageTextLink({ href = "#", className = "" }: { href?: string; className?: string }) {
  return (
    <a
      href={href}
      className={`text-sm text-slate-600 hover:text-slate-800 hover:underline underline-offset-4 no-underline ${className}`}
    >
      마이페이지에서 보기 →
    </a>
  );
}

/** 노란색 동전 아이콘 */
function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#FACC15" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#EAB308" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="#FDE68A" strokeWidth="1" />
    </svg>
  );
}

/** 단색 포인트 배지(노란 동전 + 숫자) */
function PointsBadge({ points, href = "#" }: { points: number; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1.5 text-white shadow-sm hover:shadow-md transition no-underline"
      aria-label="마이페이지 포인트 현황으로 이동"
    >
      <CoinIcon />
      <span className="text-sm font-bold tabular-nums">{points.toLocaleString()}P</span>
    </a>
  );
}

type Item = {
  id: string;
  icon: string;
  name: string;
  description: string;
  price: number;
  // duration/stock 필드는 더 이상 UI에 노출하지 않음
  duration?: string;
  stock?: string;
};

type InventoryItem = {
  id: string;
  icon: string;
  name: string;
  quantity: string; // "보유: n개"만 표시
  expiry?: string;  // 표시 안 함
};

const SHOP_ITEMS: Item[] = [
  { id: "vote_plus", icon: "🗳️", name: "추가 투표권", description: "한 번의 투표에서 2표를 행사할 수 있습니다", price: 50 },
  { id: "fee_discount", icon: "💸", name: "회비 감면권 (10%)", description: "다음 회비 납부 시 10% 감면", price: 120 },
  { id: "title_king", icon: "🏅", name: "특별 칭호", description: "프로필에 특별 칭호가 표시됩니다", price: 200 },
  { id: "late_free", icon: "⏰", name: "지각 면제권", description: "지각 1회 면제 처리", price: 150 },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "vote_plus", icon: "🗳️", name: "추가 투표권", quantity: "보유: 2개" },
  { id: "title_king", icon: "🏅", name: "특별 칭호",   quantity: "보유: 1개" },
  { id: "late_free",  icon: "⏰", name: "지각 면제권", quantity: "보유: 1개" },
];

export default function Shop() {
  const [points] = useState(2450);
  const [inventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const handleBuy = (name: string) => {
    if (window.confirm("정말 구매하시겠습니까??")) {
      alert(`데모: '${name}' 구매 로직은 백엔드 연동 시 구현하세요.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 사이드바 (필요시 유지) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-20 flex-col items-center py-5 bg-gradient-to-br from-orange-500 to-amber-400 text-white">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur mb-6 text-2xl">🛒</div>
        <nav className="flex flex-col items-center gap-4">
          {["🛒", "💬", "📅", "🧾", "✅", "🏆", "🎨", "📦", "📊", "🏠"].map((icon, idx) => (
            <div key={idx} className={`w-12 h-12 grid place-items-center rounded-xl transition ${idx === 0 ? "bg-white text-orange-500 shadow-md" : "bg-white/10 hover:bg-white/20"}`} title="menu">
              <span className="text-2xl">{icon}</span>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-20">
        {/* 헤더 */}
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">아이템 상점</h1>
            <p className="text-slate-500 text-sm mt-1">포인트로 아이템을 구매하세요</p>
          </div>
          <div />
        </header>

        <div className="px-6 md:px-8 py-6 space-y-8">
          {/* 아이템 상점: 우측 끝에 2450P 배지 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">🛍️ 아이템 상점</h3>
                <p className="text-sm text-slate-500">아이템을 선택해 구매하세요</p>
              </div>
              <PointsBadge points={points} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SHOP_ITEMS.map((it) => (
                <div key={it.id} className="group rounded-xl border border-slate-200 hover:border-slate-300 bg-white p-4 transition shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0">{it.icon}</div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{it.name}</h4>
                      <p className="text-sm text-slate-600">{it.description}</p>
                      {/* 유효기간/재고 배지 제거됨 */}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-orange-600 font-bold">{it.price}P</div>
                    <button
                      className="h-9 px-4 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 active:translate-y-[1px] transition"
                      onClick={() => handleBuy(it.name)}
                    >
                      구매
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 내 아이템: 캡처 스타일 (만료 제거, 보유만 표시) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl" aria-hidden>📦</span>
              <h3 className="text-lg font-semibold text-slate-800">내 아이템</h3>
            </div>
            <p className="text-sm text-slate-500">보유 중인 아이템과 사용 현황</p>
            <div className="mt-1">
              <MyPageTextLink />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-2xl">{inv.icon}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{inv.name}</div>
                    <div className="text-xs text-slate-500">{inv.quantity}</div>
                    {/* 만료 정보 제거됨 */}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
