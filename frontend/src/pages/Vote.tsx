import { useEffect, useMemo, useState } from "react"
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';
import { VoteApi } from '../apis/vote';
import type { VoteParticipateRequest, VoteSelectionRequest, VoteResponse } from '../apis/vote';
import { ItemApi } from '../apis/item';
import { useAuthStore } from '../stores/authStore';

/** 타입들 - API와 호환되는 형태 */
// API 타입을 그대로 사용
type Vote = VoteResponse

/** 유틸 - API 데이터 기반 */
const isClosed = (v: Vote) => !v.isActive || v.isExpired || new Date(v.endsAt).getTime() <= Date.now()

// API에서 이미 계산된 데이터 사용
const getTotalVotes = (v: Vote) => v.totalVotes
const getParticipantsCount = (v: Vote) => v.totalParticipants
const getParticipationRate = (v: Vote) => v.participationRate

// 옵션당 최대 투표 수 계산 (기본 1표 + 추가 투표권)
const getPerOptionCapacity = (v: Vote, additionalCapacity: Record<number, number> = {}) => {
  const basePerOption = 1 // 기본적으로 옵션당 1표
  const additional = additionalCapacity[v.id] || 0
  return basePerOption + additional // 추가 투표권만큼 증가
}

// 총 투표 용량 계산 (검증용)
const getTotalCapacity = (v: Vote, additionalCapacity: Record<number, number> = {}) => {
  const perOption = getPerOptionCapacity(v, additionalCapacity)
  if (v.multiSelect) {
    return perOption * v.options.length // 다중: 각 옵션당 최대 * 옵션 수
  } else {
    return perOption // 단일: 한 옵션에만 투표 가능
  }
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = () => {
  const { user } = useAuthStore.getState()
  return user?.id ?? 1
}

interface VoteProps {
  onNavigateToOnboarding: () => void;
}

export default function VotingPage({
  onNavigateToOnboarding,
}: VoteProps) {

  /** 실제 투표 데이터 */
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { clubId } = useAuthStore();

  /** UI 상태 */
  const [selectedVoteId, setSelectedVoteId] = useState<number | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)

  // 내 투표 초안, 제출 상태
  const [draftByVote, setDraftByVote] =
    useState<Record<number, Record<number, number>>>({}) // {voteId: {optionId: myCount}}
  const [submitting, setSubmitting] =
    useState<Record<number, boolean>>({}) // 제출 버튼 로딩 상태

  // 추가 투표권 관련 상태
  const [userVoteCapacity, setUserVoteCapacity] =
    useState<Record<number, number>>({}) // {voteId: additionalCapacity}
  const [additionalVoteItems, setAdditionalVoteItems] = useState<number>(0) // 보유한 추가 투표권 수량


  // API 데이터 로드
  useEffect(() => {
    const loadVotes = async () => {
      if (!clubId) {
        setError('동아리 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true)
        setError(null)
        const voteList = await VoteApi.getVoteListByClub(clubId)
        // VoteListResponse를 VoteResponse 형태로 변환 (옵션은 빈 배열)
        setVotes(voteList.map(v => ({
          ...v,
          description: v.title, // description이 VoteResponse에 필요하므로
          chatRoomId: 0, // 임시값 - 상세 조회에서 채움
          chatRoomName: '', // 임시값
          totalChatMembers: 0, // 임시값
          participationRate: 0, // 임시값
          totalVotes: 0, // 임시값
          options: [] // 리스트에서는 옵션 없음
        })))
        if (voteList.length > 0 && !selectedVoteId) {
          setSelectedVoteId(voteList[0].id)
        }
      } catch (err) {
        console.error('투표 로드 실패:', err)
        setError('투표 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadVotes()
  }, [clubId])

  // 사용자 인벤토리 (추가 투표권) 로드
  useEffect(() => {
    const loadInventory = async () => {
      if (!clubId) return

      try {
        const inventory = await ItemApi.getInventory(clubId)
        // id=2인 추가 투표권 아이템 찾기
        const additionalVoteItem = inventory.find(item => item.itemId === 2)
        setAdditionalVoteItems(additionalVoteItem?.qty || 0)
      } catch (err) {
        console.error('인벤토리 로드 실패:', err)
      }
    }

    loadInventory()
  }, [clubId])

  // 선택된 투표의 상세 정보 로드
  useEffect(() => {
    if (selectedVoteId === null) return;

    // 이미 상세 정보가 로드되었으면 다시 로드하지 않음
    const currentVote = votes.find(v => v.id === selectedVoteId);
    if (currentVote && currentVote.options.length > 0) {
      return;
    }

    const loadVoteDetail = async () => {
      try {
        const detailedVote = await VoteApi.getVoteDetail(selectedVoteId);
        setVotes(prevVotes => 
          prevVotes.map(v => v.id === selectedVoteId ? detailedVote : v)
        );
      } catch (err) {
        console.error('투표 상세 정보 로드 실패:', err);
        setError('투표 상세 정보를 불러오는 데 실패했습니다.');
      }
    };

    loadVoteDetail();
  }, [selectedVoteId, votes]);

  /** 파생 */
  const visibleVotes = useMemo(
    () => votes.filter((v) => (showClosed ? isClosed(v) : !isClosed(v))),
    [votes, showClosed]
  )
  const selectedVote = votes.find((v) => v.id === selectedVoteId) || null
  const currentUserId = getCurrentUserId()
  const iAmOwner = selectedVote?.createdBy === currentUserId
  const iCanVote = !!selectedVote && selectedVote.canParticipate && !isClosed(selectedVote) && !selectedVote.hasParticipated

  /** 마감이 지난 open 항목은 렌더 때 자동 closed 표기 유지 */
  useEffect(() => {
    // 이 로직은 더 이상 필요하지 않음 - API에서 정확한 상태를 받아옴
  }, [])

  /** 탭 바뀌거나 데이터 변해서 현재 선택이 가려졌다면 보정 */
  useEffect(() => {
    if (selectedVoteId != null && !visibleVotes.some((v) => v.id === selectedVoteId)) {
      setSelectedVoteId(visibleVotes[0]?.id ?? null)
    }
  }, [showClosed, votes, selectedVoteId, visibleVotes])

  // 선택된 투표의 “초안” 초기화 (selectedPoll 바뀔 때 1회)
  useEffect(() => {
    if (!selectedVote) return
    setDraftByVote(d => {
      if (d[selectedVote.id]) return d // 이미 있으면 재초기화 X
      const init: Record<number, number> = {}
      selectedVote.options.forEach(o => {
        init[o.id] = o.myVoteCount ?? 0 // API에서 내 투표 수 가져오기
      })
      return { ...d, [selectedVote.id]: init }
    })
  }, [selectedVote])

  /** 드래프트 헬퍼 */
  const getMyDraftCount = (v: Vote, optionId: number) =>
    draftByVote[v.id]?.[optionId]
    ?? (v.options.find(o => o.id === optionId)?.myVoteCount ?? 0)

  const getMyDraftUsed = (v: Vote) =>
    v.options.reduce((s, o) => s + (draftByVote[v.id]?.[o.id]
      ?? (o.myVoteCount ?? 0)), 0)

  const getMyDraftRemaining = (v: Vote) =>
    Math.max(0, getTotalCapacity(v, userVoteCapacity) - getMyDraftUsed(v))

  // 드래프트 +/− (서버 반영 X, 로컬만 수정)
  const incDraft = (v: Vote, optionId: number) => {
    if (isClosed(v)) return

    const used = getMyDraftUsed(v)
    const here = getMyDraftCount(v, optionId)

    // 단일 선택에서는 항상 한 옵션에만 투표 가능 (추가 투표권 관계없이)
    if (!v.multiSelect && used > 0 && here === 0) return

    // 총합 남은 표 확인
    if (getMyDraftRemaining(v) <= 0) return

    // 옵션당 상한: 각 옵션당 최대 투표 수
    const perOptionCap = getPerOptionCapacity(v, userVoteCapacity)
    if (here >= perOptionCap) return

    setDraftByVote(d => ({
      ...d,
      [v.id]: { ...(d[v.id] ?? {}), [optionId]: here + 1 }
    }))
  }

  const decDraft = (v: Vote, optionId: number) => {
    if (isClosed(v)) return
    const here = getMyDraftCount(v, optionId)
    if (here === 0) return

    const next = Math.max(0, here - 1)
    setDraftByVote(d => {
      const map = { ...(d[v.id] ?? {}) }
      if (next === 0) delete map[optionId]
      else map[optionId] = next
      return { ...d, [v.id]: map }
    })
  }

  // 확정(서버 반영) 핸들러
  const handleSubmitVotes = async (v: Vote) => {
    if (!v || !clubId) return
    const draft = draftByVote[v.id] ?? {}
    const additionalVotesNeeded = userVoteCapacity[v.id] || 0

    // 사용할 추가 투표권이 있으면 확인 요청
    if (additionalVotesNeeded > 0) {
      const confirmMessage = `추가 투표권 ${additionalVotesNeeded}개를 사용하여 투표하시겠습니까?`
      if (!confirm(confirmMessage)) return

      // 투표권 보유 수량 확인
      if (additionalVotesNeeded > additionalVoteItems) {
        alert('추가 투표권이 부족합니다.')
        return
      }
    }

    // API 요구에 맞는 payload 생성
    const selections: VoteSelectionRequest[] = []
    v.options.forEach(o => {
      const count = draft[o.id] ?? 0
      if (count > 0) {
        selections.push({
          voteOptionId: o.id,
          optionCount: count
        })
      }
    })

    const participateRequest: VoteParticipateRequest = { selections }

    try {
      setSubmitting(s => ({ ...s, [v.id]: true }))

      // 먼저 추가 투표권 차감
      if (additionalVotesNeeded > 0) {
        for (let i = 0; i < additionalVotesNeeded; i++) {
          await ItemApi.useItem(clubId, 2) // itemId = 2 (추가 투표권)
        }
        // 인벤토리 상태 업데이트
        setAdditionalVoteItems(prev => prev - additionalVotesNeeded)
      }

      // 실제 투표 API 호출
      const updatedVote = await VoteApi.participateVote(v.id, participateRequest)

      // 성공 시: votes에 반영
      setVotes(prev => prev.map(x => x.id === v.id ? updatedVote : x))

      // 드래프트 및 용량 상태 초기화
      setDraftByVote(d => ({ ...d, [v.id]: {} }))
      setUserVoteCapacity(prev => ({ ...prev, [v.id]: 0 }))

      alert("투표가 확정되었습니다.")
    } catch (e) {
      console.error('투표 제출 실패:', e)

      // 투표권이 차감되었지만 투표에 실패한 경우 인벤토리 다시 로드
      if (additionalVotesNeeded > 0) {
        try {
          const inventory = await ItemApi.getInventory(clubId)
          const additionalVoteItem = inventory.find(item => item.itemId === 2)
          setAdditionalVoteItems(additionalVoteItem?.qty || 0)
        } catch (inventoryError) {
          console.error('인벤토리 재로드 실패:', inventoryError)
        }
      }

      alert("제출 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setSubmitting(s => ({ ...s, [v.id]: false }))
    }
  }

  // 변경사항 여부 (서버값 vs 드래프트)
  const hasChanges = useMemo(() => {
    if (!selectedVote) return false
    const draft = draftByVote[selectedVote.id] ?? {}
    return selectedVote.options.some(o => {
      const server = o.myVoteCount ?? 0
      const mine = draft[o.id] ?? 0
      return server !== mine
    })
  }, [selectedVote, draftByVote])

  const handleCloseVote = async (voteId: number) => {
    try {
      const updatedVote = await VoteApi.closeVote(voteId)
      setVotes(prev => prev.map(v => v.id === voteId ? updatedVote : v))
      alert('투표가 종료되었습니다.')
    } catch (err) {
      console.error('투표 종료 실패:', err)
      alert('투표 종료에 실패했습니다.')
    }
  }

  // 추가 투표권 사용 (로컬에서만 용량 증가, 실제 차감 X)
  const handleUseAdditionalVote = (voteId: number) => {
    const currentUsed = userVoteCapacity[voteId] || 0

    // 보유한 투표권보다 많이 사용할 수 없음
    if (currentUsed >= additionalVoteItems) {
      alert('추가 투표권이 부족합니다.')
      return
    }

    // 로컬 상태에서만 용량 증가
    setUserVoteCapacity(prev => ({
      ...prev,
      [voteId]: currentUsed + 1
    }))
  }

  const handleDeleteVote = async (voteId: number) => {
    if (!confirm('정말로 투표를 삭제하시겠습니까?')) return

    try {
      await VoteApi.deleteVote(voteId)
      setVotes(prev => {
        const next = prev.filter(v => v.id !== voteId)
        if (selectedVoteId === voteId) {
          const nextVisible = next.filter(v => showClosed ? isClosed(v) : !isClosed(v))
          setSelectedVoteId(nextVisible[0]?.id ?? null)
        }
        return next
      })
      alert('투표가 삭제되었습니다.')
    } catch (err) {
      console.error('투표 삭제 실패:', err)
      alert('투표 삭제에 실패했습니다.')
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* 메인 */}
        <div className="flex-1 flex">
          {/* 투표 리스트 사이드바 */}
          <div className="w-80 bg-white border-r border-orange-200 shadow-lg">
            <div className="p-6 border-b border-orange-200 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 font-jua">투표 목록</h2>
              </div>

              {/* 탭: 진행중 / 완료 */}
              <div className="flex gap-1 bg-orange-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setShowClosed(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-jua ${
                    !showClosed
                      ? "bg-green-400 text-white shadow-sm"
                      : "text-orange-700 hover:bg-orange-200 bg-transparent "
                  }`}
                  aria-pressed={!showClosed}
                >
                  진행중 ({votes.filter((v) => !isClosed(v)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowClosed(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors font-jua ${
                    showClosed
                      ? "bg-green-400 text-white shadow-sm"
                      : "text-orange-700 hover:bg-orange-200 bg-transparent"
                  }`}
                  aria-pressed={showClosed}
                >
                  완료 ({votes.filter((v) => isClosed(v)).length})
                </button>
              </div>
            </div>

            {/* 리스트 */}
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg font-gowun text-gray-600">로딩 중...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-center px-4">
                <div className="text-red-600 font-gowun">{error}</div>
              </div>
            ) : visibleVotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="text-4xl mb-3">🗳️</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 font-jua">
                    {showClosed ? "완료된 투표 없음" : "현재 진행중인 투표 없음"}
                  </h3>
                  <p className="text-sm text-gray-600 font-gowun">
                    {showClosed ? "완료된 투표가 여기 표시됩니다." : "새로운 투표를 생성해보세요!"}
                  </p>
                </div>
              ) : (
                visibleVotes.map((v) => {
                  const voters = getParticipantsCount(v)
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoteId(v.id)}
                      className={`p-4 border-b border-orange-200 cursor-pointer transition-colors hover:bg-orange-50 ${
                        selectedVoteId === v.id ? "bg-orange-100 border-l-4 border-l-green-400" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                                              <div
                                                className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                                                  isClosed(v) ? "bg-orange-400" : v.hasParticipated ? "bg-gray-400" : "bg-green-400"
                                                }`}
                                              />                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate font-jua">{v.title}</h3>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2 font-gowun">{v.description}</p>
                          <div className="text-xs space-y-1">
                            <div className="text-gray-600 font-gowun">
                              {v.multiSelect ? "다중선택" : "단일선택"} · 참여 {voters}명
                            </div>
                            <div className="text-gray-600 font-gowun">마감 {new Date(v.endsAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 상세 */}
          <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100">
            {selectedVote ? (
              <div className="p-8">
                {/* 헤더 */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-gray-800 font-jua">🗳️ 투표</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold font-jua ${
                        isClosed(selectedVote)
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gradient-to-r from-green-400 to-green-600 text-white"
                      }`}
                    >
                      {isClosed(selectedVote) ? "완료" : "진행중"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200 font-gowun">
                      {selectedVote.multiSelect ? "다중 선택" : "단일 선택"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800 font-jua">{selectedVote.title}</h1>
                    <p className="text-gray-600 text-sm font-gowun">{selectedVote.description}</p>
                  </div>

                  {/* 요약 카드 (상단) */}  
                  {/* <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-[0_6px_20px_rgba(255,149,0,0.08)]">
                    <div className="grid grid-cols-3 gap-6 items-center">
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-orange-600">
                          {getTotalVotes(selectedPoll)}
                          <span className="ml-1 text-base font-semibold">표</span>
                        </div>
                        <div className="text-gray-600 text-sm mt-1">총 투표수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-gray-800">
                          {selectedPoll.eligibleCount ?? getUniqueVotersCount(selectedPoll)}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">전체 인원</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-extrabold text-green-600">{selectedPoll.deadline}</div>
                        <div className="text-gray-600 text-sm mt-1">마감일</div>
                      </div>
                    </div> */}

                    {/* 참여율 바 */}
                    {/* <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>참여율</span>
                        <span className="text-orange-600 font-semibold">{getParticipationRate(selectedPoll)}%</span>
                      </div>
                      <div className="h-2 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-[width] duration-500"
                          style={{ width: `${getParticipationRate(selectedPoll)}%` }}
                        />
                      </div>
                    </div>
                  </div> */}

                </div>

                {/* 본문 */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                  {/* 옵션/투표 영역 */}
                  <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg lg:col-span-7">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {/* 좌측: 제목 + 투표 정보 */}
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-800 text-lg font-jua">투표 선택지</h3>
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold font-jua">
                          내 투표 수 : {selectedVote ? getMyDraftUsed(selectedVote) : 0}
                        </span>
                        {additionalVoteItems > 0 && (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold font-jua">
                            🎫 {additionalVoteItems}개 보유
                          </span>
                        )}
                      </div>

                      {/* 우측: 추가 투표권 영역 */}
                      <div className="flex items-center gap-2">
                        {/* 추가 투표권 사용 버튼 */}
                        {selectedVote && !isClosed(selectedVote) && (
                          <div className="flex items-center gap-2">
                            {/* 보유 및 사용 예정 투표권 표시 */}
                            <div className="text-sm text-gray-600 font-jua">
                              보유: {additionalVoteItems}개
                              {userVoteCapacity[selectedVote.id] > 0 && (
                                <span className="text-orange-600 ml-1">
                                  (사용 예정: {userVoteCapacity[selectedVote.id]}개)
                                </span>
                              )}
                            </div>

                            {/* 추가 투표권 사용 버튼 */}
                            <button
                              onClick={() => handleUseAdditionalVote(selectedVote.id)}
                              disabled={(userVoteCapacity[selectedVote.id] || 0) >= additionalVoteItems}
                              className={`px-3 py-2 rounded-lg font-semibold transition-all duration-200 ${
                                (userVoteCapacity[selectedVote.id] || 0) < additionalVoteItems
                                  ? "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <span className="font-jua">
                                {(userVoteCapacity[selectedVote.id] || 0) < additionalVoteItems
                                  ? "🎫 추가 투표권 +"
                                  : "🎫 추가 투표권 없음"
                                }
                              </span>
                            </button>
                          </div>
                        )}

                        {/* 투표 가이드 버튼 */}
                        <button
                          onClick={() => {
                            if (!selectedVote || isClosed(selectedVote)) return
                            alert("투표는 아래 옵션의 +/- 버튼으로 조절한 뒤 '투표 확정'을 눌러주세요.\n\n한 번 확정된 투표는 재투표가 불가능합니다.")
                          }}
                          disabled={!selectedVote || isClosed(selectedVote)}
                          className={`px-3 py-2 rounded-lg font-semibold
                            ${!selectedVote || isClosed(selectedVote)
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700"}`}
                        >
                          <span className="font-jua">투표 가이드</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedVote.options.map((opt) => {
                        const total = opt.voteCount
                        const pct = opt.percentage
                        const myCount = getMyDraftCount(selectedVote, opt.id)
                        const myUsed = getMyDraftUsed(selectedVote)
                        const remaining = getMyDraftRemaining(selectedVote)

                        const perOptionCap = getPerOptionCapacity(selectedVote, userVoteCapacity)

                        // 단일 선택에서 추가 투표권이 없을 때만 분산 금지
                        const hasAdditionalCapacity = (userVoteCapacity[selectedVote.id] || 0) > 0
                        const splitBlocked = !selectedVote.multiSelect && !hasAdditionalCapacity && myUsed > 0 && myCount === 0
                        // 옵션당 상한 도달
                        const perOptionLimitReached = myCount >= perOptionCap

                        const disablePlus = !iCanVote || remaining <= 0 || splitBlocked || perOptionLimitReached
                        const disableMinus = !iCanVote || myCount === 0

                        return (
                          <div key={opt.id} className="rounded-xl border border-orange-200 p-4 shadow-sm bg-white">
                            {/* 상단 헤더: 라벨 / 현재표수(%) / 내 증감 컨트롤 */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-800 font-jua">{opt.text}</div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-gowun">{total}표 ({pct}%)</span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => decDraft(selectedVote, opt.id)}
                                    disabled={disableMinus}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center
                                      ${disableMinus ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                                    aria-label="decrease"
                                  >−</button>

                                  <div className="min-w-[2rem] text-center font-semibold text-gray-800 font-jua">{myCount}</div>

                                  <button
                                    onClick={() => incDraft(selectedVote, opt.id)}
                                    disabled={disablePlus}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center
                                      ${disablePlus ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                                    aria-label="increase"
                                  >＋</button>
                                </div>
                              </div>
                            </div>

                            {/* 득표율 막대 */}
                            <div className="h-3 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-[width] duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* ✅ 확정 버튼: 선택지 리스트 바깥에서 한 번만 렌더 */}
                    <div className="mt-6">
                      <button
                        onClick={() => selectedVote && handleSubmitVotes(selectedVote)}
                        disabled={!iCanVote || !selectedVote || submitting[selectedVote.id] || !hasChanges}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg font-jua"
                      >
                        {submitting[selectedVote.id] ? "제출 중..." : "투표 확정"}
                      </button>
                    </div>

                    {!iCanVote && selectedVote && (
                      <div className="mt-4 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-sm font-gowun">
                        {selectedVote.hasParticipated ? '이미 참여한 투표입니다.' : '마감되었거나 종료된 투표입니다.'}
                      </div>
                    )}
                  </div>

                  {/* 소유자 액션 / 메타 */}
                  {/* <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-lg">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">투표 정보</h3>

                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">생성자</span>
                        <span className="font-medium">{selectedPoll.createdBy}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">생성일</span>
                        <span className="font-medium">{selectedPoll.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">선택 방식</span>
                        <span className="font-medium">{selectedPoll.allowMultiple ? "다중 선택" : "단일 선택"}</span>
                      </div>
                    </div> */}

                    {/* 소유자 버튼: 종료는 진행중일 때만, 삭제는 항상 */}
                    {/* {iAmOwner && (
                      <div className="mt-6 flex gap-3">
                        {!isClosed(selectedPoll) && (
                          <button
                            onClick={() => handleClosePoll(selectedPoll.id)}
                            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg"
                          >
                            투표 종료
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePoll(selectedPoll.id)}
                          className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg"
                        >
                          투표 삭제
                        </button>
                      </div>
                    )}
                  </div> */}

                    {/* 소유자 액션 / 메타 */}
                    <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-lg lg:col-span-3">
                    <h3 className="font-semibold text-gray-800 text-base mb-3 font-jua">투표 정보</h3>

                    <div className={`space-y-2 text-sm text-gray-700 ${iAmOwner ? 'max-h-80 overflow-y-auto calendar-scrollbar' : 'max-h-none'}`}>
                        {/* 마감일 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">마감일</span>
                        <span className="font-extrabold text-green-500 font-jua text-sm">{new Date(selectedVote.endsAt).toLocaleString()}</span>
                        </div>

                        {/* 상태 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">상태</span>
                        <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold font-jua ${
                            isClosed(selectedVote) ? "bg-orange-100 text-orange-700" : "bg-green-400 text-white"
                            }`}
                        >
                            {isClosed(selectedVote) ? "완료" : "진행중"}
                        </span>
                        </div>

                        {/* 선택 방식 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">선택 방식</span>
                        <span className="font-medium font-gowun text-sm">
                            {selectedVote.multiSelect ? "다중 선택" : "단일 선택"}
                        </span>
                        </div>

                        {/* 전체 인원 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">전체 인원</span>
                        <span className="font-medium font-jua text-sm">
                            {selectedVote.totalChatMembers}명
                        </span>
                        </div>

                        {/* 참여 인원 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">참여 인원</span>
                        <span className="font-medium font-jua text-sm">{getParticipantsCount(selectedVote)}명</span>
                        </div>

                        {/* 참여율 + 막대 */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span className="font-gowun">참여율</span>
                            <span className="text-orange-600 font-semibold font-jua">
                            {getParticipationRate(selectedVote)}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                            <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-[width] duration-500"
                            style={{ width: `${getParticipationRate(selectedVote)}%` }}
                            />
                        </div>
                        </div>

                        {/* 총 투표수 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">총 투표수</span>
                        <span className="font-extrabold text-orange-600 font-jua text-sm">
                            {getTotalVotes(selectedVote)} <span className="text-xs font-semibold">표</span>
                        </span>
                        </div>

                        {/* 생성자 / 생성일 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">생성자</span>
                        <span className="font-medium font-gowun text-sm">{selectedVote.createdByName}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">생성일</span>
                        <span className="font-medium font-gowun text-sm">{new Date(selectedVote.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 소유자 버튼: 종료는 진행중일 때만, 삭제는 항상 */}
                    {iAmOwner && (
                        <div className="mt-6 flex gap-3">
                        {!isClosed(selectedVote) && (
                            <button
                            onClick={() => handleCloseVote(selectedVote.id)}
                            className="flex-1 px-6 py-3 bg-green-400 hover:bg-green-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg font-jua text-sm"
                            >
                            투표 종료
                            </button>
                        )}
                        <button
                            onClick={() => handleDeleteVote(selectedVote.id)}
                            className="flex-1 px-6 py-3 bg-red-400 hover:bg-red-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg font-jua text-sm"
                        >
                            투표 삭제
                        </button>
                        </div>
                    )}
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗳️</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 font-jua">투표를 선택해주세요</h2>
                  <p className="text-gray-600 font-gowun">왼쪽 목록에서 투표를 선택하면 상세 내용을 확인할 수 있습니다.</p>
                </div>
              </div>
            )}
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
  )
}
