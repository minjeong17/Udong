import { useEffect, useMemo, useState } from "react"
import Sidebar from '../components/Sidebar';
import NotificationModal from '../components/NotificationModal';

/** 현재 로그인 사용자 (더미) */
const currentUserId = 1

/** 타입들 */
type PollStatus = "open" | "closed"

type VoteOption = {
  id: number
  label: string
  votesByUser: Record<number, number> // userId -> 그 옵션에 넣은 표 수
}
type Poll = {
  id: number
  title: string
  description?: string
  createdAt: string
  deadline: string // ISO-like string ("2025-09-16 21:00" 등)
  status: PollStatus
  allowMultiple: boolean
  createdBy: string
  createdById: number
  options: VoteOption[]
  eligibleCount?: number
  bonusVotesByUser?: Record<number, number> // 사용자별 추가 표 (추가 투표권 사용 시 +1 누적)
}

/** 유틸 */
const parseDate = (d: string) => new Date(d.replace(/-/g, "/"))
const isClosed = (p: Poll) => p.status === "closed" || parseDate(p.deadline).getTime() <= Date.now()

// 표 합계
const getOptionTotalVotes = (o: VoteOption) =>
  Object.values(o.votesByUser).reduce((a, b) => a + b, 0)

const getTotalVotes = (p: Poll) =>
  p.options.reduce((sum, o) => sum + getOptionTotalVotes(o), 0)

// 한 명이라도 1표 이상 넣은 사용자 수
const getUniqueVotersCount = (p: Poll) => {
  const s = new Set<number>()
  p.options.forEach(o => {
    Object.entries(o.votesByUser).forEach(([uid, n]) => {
      if ((n ?? 0) > 0) s.add(Number(uid))
    })
  })
  return s.size
}

const getOptionPercent = (p: Poll, count: number) => {
  const total = getTotalVotes(p)
  return total > 0 ? Math.round((count / total) * 100) : 0
}

// 참여 인원 = 최소 1표 이상 던진 유저 수
const getParticipantsCount = (p: Poll) => getUniqueVotersCount(p)

// 참여율 = 참여 인원 / 전체 인원 (보너스표는 참여율에 영향을 주지 않음)
const getParticipationRate = (p: Poll) => {
  const participants = getParticipantsCount(p)
  const denom = p.eligibleCount ?? participants // eligibleCount 없으면 100%로 보이게
  return Math.min(100, Math.round((participants / Math.max(1, denom)) * 100))
}

// ===== 개인 용량/사용량 =====
// 설계: 단일 = 기본 1표 (+보너스만큼 스택/분산 가능)
//      다중 = 옵션당 기본 1표(총합은 무제한), 보너스만큼 특정 옵션에 스택 가능
const getBaseCapacity = (p: Poll) =>
  p.allowMultiple ? Number.POSITIVE_INFINITY : 1

const getUserBonus = (p: Poll, uid = currentUserId) =>
  p.bonusVotesByUser?.[uid] ?? 0

const getUserVoteCapacity = (p: Poll, uid = currentUserId) =>
  getBaseCapacity(p) + getUserBonus(p, uid)

interface VoteProps {
  onNavigateToOnboarding: () => void;
}

export default function VotingPage({
  onNavigateToOnboarding,
}: VoteProps) {
  // 예시 인벤토리
  const [inventory, setInventory] = useState({ extraVoteTickets: 2 })

  const useExtraVote = (pollId: number) => {
    if (inventory.extraVoteTickets <= 0) return

    setPolls(prev =>
      prev.map(p =>
        p.id !== pollId
          ? p
          : {
              ...p,
              bonusVotesByUser: {
                ...(p.bonusVotesByUser ?? {}),
                [currentUserId]: (p.bonusVotesByUser?.[currentUserId] ?? 0) + 1,
              },
            }
      )
    )
    setInventory(i => ({ ...i, extraVoteTickets: i.extraVoteTickets - 1 }))

    // 드래프트는 현재 상태를 유지 (추가 용량만 반영)
    // 별도 초기화 불필요 - getUserVoteCapacity가 업데이트된 bonusVotesByUser를 참조함
  }

  /** 더미 데이터 */
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 10,
      title: "MT 장소 선정",
      description: "단일 선택 + 추가 투표권으로 같은 선택지에 여러 표 가능",
      createdAt: "2025-09-10 09:00",
      deadline: "2025-10-31 23:59",
      status: "open",
      allowMultiple: false, // ✅ 단일선택
      createdBy: "김민수",
      createdById: 1,
      eligibleCount: 24,
      bonusVotesByUser: {},
      options: [
        { id: 1, label: "강원도 평창", votesByUser: { 2: 1 } },
        { id: 2, label: "경기도 가평", votesByUser: { 4: 1, 5: 1 } },
        { id: 3, label: "충남 태안", votesByUser: { 3: 1 } },
      ],
    },
    {
      id: 11,
      title: "점심 메뉴 투표",
      description: "다중 선택, 옵션당 1표 (추가 투표권으로 스택 가능)",
      createdAt: "2025-09-12 12:00",
      deadline: "2025-10-01 12:00",
      status: "open",
      allowMultiple: true, // ✅ 다중선택
      createdBy: "이지은",
      createdById: 2,
      eligibleCount: 18,
      bonusVotesByUser: {},
      options: [
        { id: 1, label: "한식", votesByUser: { 2: 1, 4: 1 } },
        { id: 2, label: "양식", votesByUser: { 3: 1 } },
        { id: 3, label: "중식", votesByUser: { 5: 1 } },
        { id: 4, label: "분식", votesByUser: {} },
      ],
    },
    {
      id: 12,
      title: "정기 스터디 요일",
      description: "다중 선택, 기본(옵션 수)만큼 표 가능",
      createdAt: "2025-08-20 09:00",
      deadline: "2025-08-25 21:00",
      status: "closed",
      allowMultiple: true, // ✅ 다중선택(종료됨)
      createdBy: "박준호",
      createdById: 3,
      eligibleCount: 12,
      bonusVotesByUser: {},
      options: [
        { id: 1, label: "월", votesByUser: { 1: 1, 2: 1 } },
        { id: 2, label: "수", votesByUser: { 1: 1, 3: 1, 4: 1 } },
        { id: 3, label: "금", votesByUser: { 2: 1, 5: 1 } },
      ],
    },
    {
      id: 13,
      title: "워크샵 장소",
      description: "단일 선택(기본 1표), 종료됨",
      createdAt: "2025-07-01 10:00",
      deadline: "2025-07-15 18:00",
      status: "closed",
      allowMultiple: false, // ✅ 단일선택(종료됨)
      createdBy: "최유진",
      createdById: 4,
      eligibleCount: 20,
      bonusVotesByUser: {},
      options: [
        { id: 1, label: "서울", votesByUser: { 1: 1, 2: 1, 3: 1 } },
        { id: 2, label: "대전", votesByUser: { 5: 1 } },
        { id: 3, label: "부산", votesByUser: {} },
      ],
    },
    {
      id: 14,
      title: "연말 선물 선택",
      description: "다중 선택, 옵션당 1표 + 추가 투표권으로 스택",
      createdAt: "2025-09-15 09:00",
      deadline: "2025-12-10 23:59",
      status: "open",
      allowMultiple: true, // ✅ 다중선택
      createdBy: "김민수",
      createdById: 1,
      eligibleCount: 30,
      bonusVotesByUser: { 6: 1 }, // 유저6 한 장 추가
      options: [
        { id: 1, label: "머그컵", votesByUser: { 6: 2 } },
        { id: 2, label: "담요", votesByUser: {} },
        { id: 3, label: "보조배터리", votesByUser: { 2: 1 } },
        { id: 4, label: "텀블러", votesByUser: {} },
      ],
    },
  ])

  /** UI 상태 */
  const [selectedPollId, setSelectedPollId] = useState<number | null>(polls[0]?.id ?? null)
  const [showClosed, setShowClosed] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)

  // 초안(내 표 수만), 잠금(확정 후 +/− 비활성), 제출중 상태
  const [draftByPoll, setDraftByPoll] =
    useState<Record<number, Record<number, number>>>({}) // {pollId: {optionId: myCount}}
  const [locked, setLocked] =
    useState<Record<number, boolean>>({}) // {pollId: true}면 +/− 막힘
  const [submitting, setSubmitting] =
    useState<Record<number, boolean>>({}) // 제출 버튼 로딩/비활성


  /** 파생 */
  const visiblePolls = useMemo(
    () => polls.filter((p) => (showClosed ? isClosed(p) : !isClosed(p))),
    [polls, showClosed]
  )
  const selectedPoll = polls.find((p) => p.id === selectedPollId) || null
  const iAmOwner = selectedPoll?.createdById === currentUserId
  const iCanVote = !!selectedPoll && !isClosed(selectedPoll)

  /** 마감이 지난 open 항목은 렌더 때 자동 closed 표기 유지 */
  useEffect(() => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.status === "open" && isClosed(p)) return { ...p, status: "closed" }
        return p
      })
    )
  }, [])

  /** 탭 바뀌거나 데이터 변해서 현재 선택이 가려졌다면 보정 */
  useEffect(() => {
    if (selectedPollId != null && !visiblePolls.some((p) => p.id === selectedPollId)) {
      setSelectedPollId(visiblePolls[0]?.id ?? null)
    }
  }, [showClosed, polls]) // eslint-disable-line

  // 선택된 투표의 “초안” 초기화 (selectedPoll 바뀔 때 1회)
  useEffect(() => {
    if (!selectedPoll) return
    setDraftByPoll(d => {
      if (d[selectedPoll.id]) return d // 이미 있으면 재초기화 X
      const init: Record<number, number> = {}
      selectedPoll.options.forEach(o => {
        init[o.id] = o.votesByUser[currentUserId] ?? 0 // 서버값을 초안으로 복사
      })
      return { ...d, [selectedPoll.id]: init }
    })
  }, [selectedPoll])

  /** 드래프트 헬퍼 */
  const getMyDraftCount = (p: Poll, optionId: number) =>
    draftByPoll[p.id]?.[optionId]
    ?? (p.options.find(o => o.id === optionId)?.votesByUser[currentUserId] ?? 0)

  const getMyDraftUsed = (p: Poll) =>
    p.options.reduce((s, o) => s + (draftByPoll[p.id]?.[o.id]
      ?? (o.votesByUser[currentUserId] ?? 0)), 0)

  const getMyDraftRemaining = (p: Poll) =>
    Math.max(0, getUserVoteCapacity(p) - getMyDraftUsed(p))

  // 드래프트 +/− (서버 반영 X, 로컬만 수정)
  const incDraft = (p: Poll, optionId: number) => {
    if (locked[p.id] || isClosed(p)) return

    const cap = getUserVoteCapacity(p) // 단일: 1+bonus, 다중: Infinity
    const used = getMyDraftUsed(p)
    const here = getMyDraftCount(p, optionId)

    // 단일 + cap=1일 때 분산 금지
    if (!p.allowMultiple && cap === 1 && used > 0 && here === 0) return

    // 총합 남은 표 (다중은 무제한)
    if (getMyDraftRemaining(p) <= 0) return

    // 옵션당 상한: 다중 = 1+bonus, 단일 = cap
    const perOptionCap = p.allowMultiple ? 1 + getUserBonus(p) : cap
    if (here >= perOptionCap) return

    setDraftByPoll(d => ({
      ...d,
      [p.id]: { ...(d[p.id] ?? {}), [optionId]: here + 1 }
    }))
  }

  const decDraft = (p: Poll, optionId: number) => {
    if (locked[p.id] || isClosed(p)) return
    const here = getMyDraftCount(p, optionId)
    if (here === 0) return

    const next = Math.max(0, here - 1)
    setDraftByPoll(d => {
      const map = { ...(d[p.id] ?? {}) }
      if (next === 0) delete map[optionId]
      else map[optionId] = next
      return { ...d, [p.id]: map }
    })
  }

  // 확정(서버 반영) 핸들러
  const handleSubmitVotes = async (p: Poll) => {
    if (!p) return
    const draft = draftByPoll[p.id] ?? {}

    // 서버에 보낼 payload (optionId -> 내 표 수)
    const payload: Record<number, number> = {}
    p.options.forEach(o => { payload[o.id] = draft[o.id] ?? 0 })

    try {
      setSubmitting(s => ({ ...s, [p.id]: true }))

      // 🔌 실제 API 호출 위치
      // await api.updateVotes({ pollId: p.id, votes: payload })

      // 성공 시: polls에 반영 + 잠금
      setPolls(prev => prev.map(x => {
        if (x.id !== p.id) return x
        const nextOptions = x.options.map(o => {
          const me = payload[o.id] ?? 0
          const map = { ...o.votesByUser }
          if (me === 0) delete map[currentUserId]
          else map[currentUserId] = me
          return { ...o, votesByUser: map }
        })
        return { ...x, options: nextOptions }
      }))
      setLocked(l => ({ ...l, [p.id]: true }))
      alert("투표가 확정되었습니다.")
    } catch (e) {
      alert("제출 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setSubmitting(s => ({ ...s, [p.id]: false }))
    }
  }

  // 변경사항 여부 (서버값 vs 드래프트)
  const hasChanges = useMemo(() => {
    if (!selectedPoll) return false
    const draft = draftByPoll[selectedPoll.id] ?? {}
    return selectedPoll.options.some(o => {
      const server = o.votesByUser[currentUserId] ?? 0
      const mine = draft[o.id] ?? 0
      return server !== mine
    })
  }, [selectedPoll, draftByPoll])

  const handleClosePoll = (pollId: number) => {
    setPolls((prev) =>
      prev.map((p): Poll => (p.id === pollId ? { ...p, status: "closed" } : p))
    )
  }

  const handleDeletePoll = (pollId: number) => {
    setPolls((prev) => {
      const next = prev.filter((p) => p.id !== pollId)
      if (selectedPollId === pollId) {
        const nextVisible = next.filter((p) => (showClosed ? isClosed(p) : !isClosed(p)))
        setSelectedPollId(nextVisible[0]?.id ?? null)
      }
      return next
    })
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
                  진행중 ({polls.filter((p) => !isClosed(p)).length})
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
                  완료 ({polls.filter((p) => isClosed(p)).length})
                </button>
              </div>
            </div>

            {/* 리스트 */}
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              {visiblePolls.length === 0 ? (
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
                visiblePolls.map((p) => {
                  const voters = getUniqueVotersCount(p)
                  const total = getTotalVotes(p)
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPollId(p.id)}
                      className={`p-4 border-b border-orange-200 cursor-pointer transition-colors hover:bg-orange-50 ${
                        selectedPollId === p.id ? "bg-orange-100 border-l-4 border-l-green-400" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                            isClosed(p) ? "bg-orange-400" : "bg-green-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate font-jua">{p.title}</h3>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2 font-gowun">{p.description}</p>
                          <div className="text-xs space-y-1">
                            <div className="text-gray-600 font-gowun">
                              {p.allowMultiple ? "다중선택" : "단일선택"} · 참여 {voters}명 · 총 {total}표
                            </div>
                            <div className="text-gray-600 font-gowun">마감 {p.deadline}</div>
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
            {selectedPoll ? (
              <div className="p-8">
                {/* 헤더 */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-gray-800 font-jua">🗳️ 투표</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold font-jua ${
                        isClosed(selectedPoll)
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gradient-to-r from-green-400 to-green-600 text-white"
                      }`}
                    >
                      {isClosed(selectedPoll) ? "완료" : "진행중"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200 font-gowun">
                      {selectedPoll.allowMultiple ? "다중 선택" :
                        getUserVoteCapacity(selectedPoll) > 1 ? "단일 선택 (추가 표로 분산 가능)" : "단일 선택"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800 font-jua">{selectedPoll.title}</h1>
                    <p className="text-gray-600 text-sm font-gowun">{selectedPoll.description}</p>
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
                      {/* 좌측: 제목 + 추가 투표권 수 */}
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-800 text-lg font-jua">투표 선택지</h3>
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold font-jua">
                          추가 투표권 : {selectedPoll ? (selectedPoll.bonusVotesByUser?.[currentUserId] ?? 0) : 0}
                        </span>
                      </div>

                      {/* 우측: 추가 투표권 버튼 (confirm) */}
                      <button
                        onClick={() => {
                          if (!selectedPoll) return
                          if (isClosed(selectedPoll) || locked[selectedPoll.id] || inventory.extraVoteTickets <= 0) return
                          const ok = window.confirm("추가 투표권을 사용하시겠습니까?\n사용 후 취소할 수 없습니다.")
                          if (ok) useExtraVote(selectedPoll.id)
                        }}
                        disabled={!selectedPoll || isClosed(selectedPoll) || locked[selectedPoll.id] || inventory.extraVoteTickets <= 0}
                        className={`px-3 py-2 rounded-lg font-semibold
                          ${!selectedPoll || isClosed(selectedPoll) || locked[selectedPoll.id] || inventory.extraVoteTickets <= 0
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700"}`}
                      >
                        <span className="font-jua">추가 투표권 사용 ({inventory.extraVoteTickets})</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {selectedPoll.options.map((opt) => {
                        const total = getOptionTotalVotes(opt)
                        const pct = getOptionPercent(selectedPoll, total)
                        const myCount = getMyDraftCount(selectedPoll, opt.id)
                        const myUsed = getMyDraftUsed(selectedPoll)
                        const remaining = getMyDraftRemaining(selectedPoll)
                        const isLocked = !!locked[selectedPoll.id]

                        const cap = getUserVoteCapacity(selectedPoll)
                        const perOptionCap = selectedPoll.allowMultiple ? 1 + getUserBonus(selectedPoll) : cap

                        // 단일 + cap===1일 때만 분산 금지
                        const splitBlocked = !selectedPoll.allowMultiple && cap === 1 && myUsed > 0 && myCount === 0
                        // 옵션당 상한 도달
                        const perOptionLimitReached = myCount >= perOptionCap

                        const disablePlus = !iCanVote || isLocked || remaining <= 0 || splitBlocked || perOptionLimitReached
                        const disableMinus = !iCanVote || isLocked || myCount === 0

                        return (
                          <div key={opt.id} className="rounded-xl border border-orange-200 p-4 shadow-sm bg-white">
                            {/* 상단 헤더: 라벨 / 현재표수(%) / 내 증감 컨트롤 */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-800 font-jua">{opt.label}</div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-gowun">{total}표 ({pct}%)</span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => decDraft(selectedPoll, opt.id)}
                                    disabled={disableMinus}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center
                                      ${disableMinus ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                                    aria-label="decrease"
                                  >−</button>

                                  <div className="min-w-[2rem] text-center font-semibold text-gray-800 font-jua">{myCount}</div>

                                  <button
                                    onClick={() => incDraft(selectedPoll, opt.id)}
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
                        onClick={() => selectedPoll && handleSubmitVotes(selectedPoll)}
                        disabled={!selectedPoll || !!locked[selectedPoll.id] || submitting[selectedPoll.id] || !hasChanges}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg font-jua"
                      >
                        {submitting[selectedPoll.id] ? "제출 중..." : "투표 확정"}
                      </button>
                    </div>

                    {!iCanVote && (
                      <div className="mt-4 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-sm font-gowun">
                        마감되었거나 종료된 투표입니다.
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
                        <span className="font-extrabold text-green-500 font-jua text-sm">{selectedPoll.deadline}</span>
                        </div>

                        {/* 상태 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">상태</span>
                        <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold font-jua ${
                            isClosed(selectedPoll) ? "bg-orange-100 text-orange-700" : "bg-green-400 text-white"
                            }`}
                        >
                            {isClosed(selectedPoll) ? "완료" : "진행중"}
                        </span>
                        </div>

                        {/* 선택 방식 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">선택 방식</span>
                        <span className="font-medium font-gowun text-sm">
                            {selectedPoll.allowMultiple ? "다중 선택" : "단일 선택"}
                        </span>
                        </div>

                        {/* 전체 인원 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">전체 인원</span>
                        <span className="font-medium font-jua text-sm">
                            {selectedPoll.eligibleCount ?? getUniqueVotersCount(selectedPoll)}명
                        </span>
                        </div>

                        {/* 참여 인원 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">참여 인원</span>
                        <span className="font-medium font-jua text-sm">{getParticipantsCount(selectedPoll)}명</span>
                        </div>

                        {/* 참여율 + 막대 */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span className="font-gowun">참여율</span>
                            <span className="text-orange-600 font-semibold font-jua">
                            {getParticipationRate(selectedPoll)}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                            <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-[width] duration-500"
                            style={{ width: `${getParticipationRate(selectedPoll)}%` }}
                            />
                        </div>
                        </div>

                        {/* 총 투표수 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">총 투표수</span>
                        <span className="font-extrabold text-orange-600 font-jua text-sm">
                            {getTotalVotes(selectedPoll)} <span className="text-xs font-semibold">표</span>
                        </span>
                        </div>

                        {/* 생성자 / 생성일 */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">생성자</span>
                        <span className="font-medium font-gowun text-sm">{selectedPoll.createdBy}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-gowun">생성일</span>
                        <span className="font-medium font-gowun text-sm">{selectedPoll.createdAt}</span>
                        </div>
                    </div>

                    {/* 소유자 버튼: 종료는 진행중일 때만, 삭제는 항상 */}
                    {iAmOwner && (
                        <div className="mt-6 flex gap-3">
                        {!isClosed(selectedPoll) && (
                            <button
                            onClick={() => handleClosePoll(selectedPoll.id)}
                            className="flex-1 px-6 py-3 bg-green-400 hover:bg-green-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg font-jua text-sm"
                            >
                            투표 종료
                            </button>
                        )}
                        <button
                            onClick={() => handleDeletePoll(selectedPoll.id)}
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
