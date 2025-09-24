import React, { useState, useEffect } from 'react';
import type { MyUnpaidDuesItem } from '../apis/clubdues/response';
import { UserApi } from '../apis/user/api';
import { ClubDuesApi } from '../apis/clubdues/api';
import { InventoryApi } from '../apis/inventory';
import type { InventoryResponse } from '../apis/inventory/response';
import { useAuthStore } from '../stores/authStore';
import AccountChangeModal from './AccountChangeModal';

interface DuesPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duesInfo: MyUnpaidDuesItem;
}

const DuesPaymentModal: React.FC<DuesPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  duesInfo
}) => {
  const clubId = useAuthStore((state) => state.clubId);
  const [inventory, setInventory] = useState<InventoryResponse[]>([]);
  const [useDiscountCoupon, setUseDiscountCoupon] = useState(false);
  const [userAccount, setUserAccount] = useState({
    bankName: '로딩중...',
    accountNumber: '로딩중...'
  });
  const [isAccountChangeModalOpen, setIsAccountChangeModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && clubId) {
      // 계좌 정보와 인벤토리 정보를 병렬로 조회
      Promise.all([
        UserApi.getMyAccount(),
        InventoryApi.getUserInventory(clubId)
      ]).then(([accountData, inventoryData]) => {
        setUserAccount(accountData);
        setInventory(inventoryData);
      }).catch(error => {
        console.error('정보 조회 실패:', error);
        setUserAccount({
          bankName: '계좌 정보 오류',
          accountNumber: '정보를 불러올 수 없습니다'
        });
        setInventory([]);
      });
    }
  }, [isOpen, clubId]);

  if (!isOpen) return null;

  // 회비 감면권 보유 수량 계산 (itemName에 '회비감면권' 또는 '감면권'이 포함된 아이템)
  const discountCouponItem = inventory.find(item =>
    item.itemName.includes('회비감면권') || item.itemName.includes('감면권')
  );
  const discountCouponCount = discountCouponItem?.qty || 0;
  const hasDiscountCoupon = discountCouponCount > 0;

  // 10% 할인 계산
  const discountAmount = useDiscountCoupon ? Math.floor(duesInfo.membershipDues * 0.1) : 0;
  const finalAmount = duesInfo.membershipDues - discountAmount;

  const handleConfirm = async () => {
    try {
      if (!clubId) {
        throw new Error('동아리 정보를 찾을 수 없습니다.');
      }

      // 감면권 사용 시 아이템 사용 API 호출
      if (useDiscountCoupon && discountCouponItem) {
        await InventoryApi.useItem(clubId, discountCouponItem.itemId);
      }

      const paymentRequest = {
        originalAmount: duesInfo.membershipDues,
        discountAmount: discountAmount
      };

      const result = await ClubDuesApi.payDues(clubId, duesInfo.duesId, paymentRequest);

      alert(`결제가 완료되었습니다!\n결제 금액: ${result.finalAmount.toLocaleString()}원`);
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('결제 실패:', error);

      let errorMessage = '결제에 실패했습니다.';

      // fetchClient에서 이미 파싱된 에러 응답 처리
      if (error?.data) {
        errorMessage = error.data;
      } else if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData?.data || errorData?.message || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }

      // 특정 에러 메시지에 대한 사용자 친화적 처리
      if (errorMessage.includes('잔액이 부족')) {
        errorMessage = '💳 계좌 잔액이 부족합니다.\n계좌에 충분한 금액이 있는지 확인해 주세요.';
      } else if (errorMessage.includes('계좌번호')) {
        errorMessage = '🏦 계좌 정보에 문제가 있습니다.\n계좌번호를 다시 확인해 주세요.';
      } else if (errorMessage.includes('이체')) {
        errorMessage = '⚠️ ' + errorMessage;
      }

      alert(errorMessage);
    }
  };

  const handleAccountChange = () => {
    setIsAccountChangeModalOpen(true);
  };

  const handleAccountUpdate = async (newAccountNumber: string) => {
    try {
      await UserApi.updateMyAccount(newAccountNumber);
      const updatedAccount = await UserApi.getMyAccount();
      setUserAccount(updatedAccount);
      alert('계좌가 성공적으로 변경되었습니다.');
    } catch (error: any) {
      console.error('계좌 변경 실패:', error);

      let errorMessage = '계좌 변경에 실패했습니다.';

      // fetchClient에서 throw한 에러 메시지 파싱
      if (error?.message) {
        try {
          // JSON 형태의 에러 응답인지 확인
          const errorData = JSON.parse(error.message);
          // ApiResponse 구조: { success: false, data: "메시지", status: 400 }
          errorMessage = errorData?.data || errorData?.message || errorMessage;
        } catch {
          // JSON이 아니면 그대로 사용
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-[500px] max-h-[700px] relative overflow-y-auto">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-700 font-jua">회비 결제</h2>
          <p className="text-sm text-gray-600 font-gowun mt-2">
            제 {duesInfo.duesNo}회차 회비를 결제합니다
          </p>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 회비 정보 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-700 font-gowun">결제 대상</span>
              <span className="text-blue-600 font-jua">제 {duesInfo.duesNo}회차</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 font-gowun">회비 금액</span>
              <span className="text-lg font-bold text-blue-700 font-jua">
                {duesInfo.membershipDues.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 회비 감면권 사용 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-700 font-jua mb-3">회비 감면권 사용</h3>

          {hasDiscountCoupon ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600">🎫</span>
                  <span className="font-medium text-green-700 font-gowun">회비 감면권 보유</span>
                </div>
                <div className="text-sm text-green-600 font-gowun">
                  사용 가능한 감면권: {discountCouponCount}개 (10% 할인)
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    value="none"
                    checked={!useDiscountCoupon}
                    onChange={() => setUseDiscountCoupon(false)}
                    className="text-orange-500"
                  />
                  <span className="font-gowun text-sm">감면권 사용 안함</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    value="use"
                    checked={useDiscountCoupon}
                    onChange={() => setUseDiscountCoupon(true)}
                    className="text-orange-500"
                  />
                  <span className="font-gowun text-sm">
                    감면권 1개 사용 (10% 할인 - {Math.floor(duesInfo.membershipDues * 0.1).toLocaleString()}원 할인)
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🎫</span>
                <span className="text-gray-500 font-gowun text-sm">보유한 회비 감면권이 없습니다</span>
              </div>
              <p className="text-xs text-gray-400 font-gowun mt-1">
                활동 포인트로 상점에서 감면권을 구매할 수 있습니다
              </p>
            </div>
          )}
        </div>

        {/* 결제 계좌 정보 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-700 font-jua mb-3">결제 계좌 정보</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-600 text-lg">🏦</span>
                <div>
                  <div className="font-medium text-blue-700 font-gowun text-sm">
                    {userAccount.bankName}
                  </div>
                  <div className="text-blue-600 font-jua">
                    {userAccount.accountNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={handleAccountChange}
                className="bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-gowun text-xs transition-colors"
              >
                계좌 변경
              </button>
            </div>
            <p className="text-xs text-blue-500 font-gowun mt-2">
              위 계좌에서 회비가 자동 출금됩니다
            </p>
          </div>
        </div>

        {/* 결제 금액 요약 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-gowun">원래 금액</span>
              <span className="text-sm text-gray-700 font-jua">{duesInfo.membershipDues.toLocaleString()}원</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-gowun">감면권 할인</span>
                <span className="text-sm text-green-600 font-jua">-{discountAmount.toLocaleString()}원</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 font-gowun">최종 결제 금액</span>
                <span className="text-xl font-bold text-orange-500 font-jua">
                  {finalAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="bg-white border-2 border-gray-300 text-gray-600 rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="bg-orange-500 border-2 border-orange-600 text-white rounded-xl px-6 py-2 font-semibold font-jua text-sm hover:bg-orange-600 transition-colors"
            >
              {finalAmount.toLocaleString()}원 결제하기
            </button>
          </div>
        </div>
      </div>

      {/* 계좌 변경 모달 */}
      <AccountChangeModal
        isOpen={isAccountChangeModalOpen}
        onClose={() => setIsAccountChangeModalOpen(false)}
        onConfirm={handleAccountUpdate}
      />
    </div>
  );
};

export default DuesPaymentModal;