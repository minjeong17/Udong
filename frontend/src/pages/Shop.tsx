import { useEffect, useState } from "react";
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import { useRouter } from '../hooks/useRouter';
import { ShopApi } from "../apis/shop";
import type { ItemResponse, InventoryResponse } from "../apis/shop";
import { useAuthStore } from "../stores/authStore";

/** 텍스트만 링크 (밑줄은 hover 때만) */
function MyPageTextLink({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm text-slate-600 hover:text-slate-800 hover:underline underline-offset-4 no-underline bg-transparent border-none cursor-pointer font-gowun ${className}`}
    >
      마이페이지에서 보기 →
    </button>
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
      className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-white shadow-sm hover:shadow-md transition no-underline"
      aria-label="마이페이지 포인트 현황으로 이동"
    >
      <CoinIcon />
      <span className="text-sm font-bold tabular-nums font-jua">{(points ?? 0).toLocaleString()}P</span>
    </a>
  );
}

interface ShopProps {
  onNavigateToOnboarding: () => void;
}

export default function Shop({ onNavigateToOnboarding }: ShopProps) {
  const { navigate } = useRouter();
  const [points, setPoints] = useState(0);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const clubId = useAuthStore((state) => state.clubId);

  const itemIcons: Record<number, string> = {
    1: "🧪",  // 포션
    2: "⚔️",  // 검
    3: "🛡️",  // 방패
    4: "🔑",  // 열쇠
    5: "💎",  // 보석
    6: "📖",  // 책
    7: "🎯",  // 표적 
    8: "🔥",  // 불꽃 
    9: "❄️",  // 얼음 
    10: "🪙", // 코인
    11: "🍀", // 클로버 
    12: "🧲", // 자석 
  };

  const handleBuy = async (itemId: number, itemName: string) => {
    if (clubId == null) {
      alert("클럽 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!window.confirm(`정말 '${itemName}'을 구매하시겠습니까?`)) return;
    
    try {
      await ShopApi.purchase(clubId, itemId);
      const [updatedInventory, updatedLedger] = await Promise.all([
        ShopApi.getInventory(clubId),
        ShopApi.getPoint(clubId),
      ]);

      setInventory(updatedInventory);
      setPoints(updatedLedger.currPoint);

      alert(`[${itemName}] 구매 완료!`);

    } catch (err) {
      console.error(err);
      alert("구매에 실패했습니다.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (clubId == null) {
          alert("클럽 정보가 없습니다. 다시 로그인해주세요.");
          return;
        }

        const [shopItems, myInventory, myLedger] = await Promise.all([
          ShopApi.getItems(),
          ShopApi.getInventory(clubId),
          ShopApi.getPoint(clubId)
        ]);
        setItems(shopItems);
        setInventory(myInventory);
        setPoints(myLedger.currPoint);
      } catch (err) {
        console.error(err);
        alert("상점 정보를 불러오는 중 오류가 발생했습니다.");
      }
    })();
  }, [clubId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* Main Content */}
        <div className="flex-1">
        {/* 헤더 */}
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 font-jua">아이템 상점</h1>
            <p className="text-slate-500 text-sm mt-1 font-gowun">포인트로 아이템을 구매하세요</p>
          </div>
          <div />
        </header>

        <div className="px-6 md:px-8 py-6 space-y-8">
          {/* 아이템 상점 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 font-jua">🛍️ 아이템 상점</h3>
                <p className="text-sm text-slate-500 font-gowun">아이템을 선택해 구매하세요</p>
              </div>
              <PointsBadge points={points} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => (
                <div key={it.id} className="group rounded-xl border border-slate-200 hover:border-slate-300 bg-white p-4 transition shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0">{itemIcons[it.id] ?? "❔"}</div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate font-jua">{it.name}</h4>
                      <p className="text-sm text-slate-600 font-gowun">{it.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-orange-500 font-bold font-jua">{it.price}P</div>
                    <button
                      className="h-9 px-4 rounded-lg text-sm font-medium bg-orange-400 text-white hover:bg-orange-500 active:translate-y-[1px] transition font-jua"
                      onClick={() => handleBuy(it.id, it.name)}
                    >
                      구매
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 내 아이템 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl" aria-hidden>📦</span>
              <h3 className="text-lg font-semibold text-slate-800 font-jua">내 아이템</h3>
            </div>
            <p className="text-sm text-slate-500 font-gowun">보유 중인 아이템과 사용 현황</p>
            <div className="mt-1">
              <MyPageTextLink onClick={() => navigate('mypage')} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-2xl">{itemIcons[inv.itemId] ?? "❔"}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate font-jua">{inv.itemName}</div>
                    <div className="text-xs text-slate-500 font-gowun">{inv.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    </div>
  );
}
