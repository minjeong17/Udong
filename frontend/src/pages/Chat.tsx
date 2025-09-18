import type React from "react"
import { useState, useRef, useEffect } from "react"
import Sidebar from '../components/Sidebar';
import Notification from './Notification';

interface ChatProps {
  onNavigateToOnboarding: () => void;
}

export default function ChatPage({
  onNavigateToOnboarding,
}: ChatProps) {
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [message, setMessage] = useState("")
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [showMemberCheckModal, setShowMemberCheckModal] = useState(false)
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [isParticipantsConfirmed, setIsParticipantsConfirmed] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [settlementAmount, setSettlementAmount] = useState("")
  const [settlementReceipt, setSettlementReceipt] = useState<File | null>(null)
  const [settlementMemo, setSettlementMemo] = useState("")
  const [settlementParticipants, setSettlementParticipants] = useState<string[]>([])
  const [voteTitle, setVoteTitle] = useState("")
  const [voteDescription, setVoteDescription] = useState("")
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [deadline, setDeadline] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [isRoomOwner] = useState(true) // 현재 사용자가 방장인지 확인
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channels = [
    { id: "general", name: "일반", description: "일반적인 대화", unread: 3 },
    { id: "announcements", name: "공지사항", description: "중요한 공지", unread: 1 },
    { id: "events", name: "이벤트", description: "모임 및 이벤트", unread: 0 },
    { id: "random", name: "자유", description: "자유로운 대화", unread: 5 },
  ]

  const chatMembers = [
    { id: "1", name: "김민수", avatar: "KM" },
    { id: "2", name: "이지은", avatar: "LJ" },
    { id: "3", name: "박준호", avatar: "PJ" },
    { id: "4", name: "최유진", avatar: "CY" },
    { id: "5", name: "나", avatar: "ME" },
  ]

  const messages = [
    {
      id: 1,
      user: "김민수",
      avatar: "KM",
      message: "안녕하세요! 오늘 모임 어떠셨나요?",
      timestamp: "14:30",
      isOwn: false
    },
    {
      id: 2,
      user: "이지은",
      avatar: "LJ",
      message: "정말 좋았어요! 다음에도 이런 활동 했으면 좋겠네요 ㅎㅎ",
      timestamp: "14:32",
      isOwn: false
    },
    {
      id: 3,
      user: "박준호",
      avatar: "PJ",
      message: "저도 동감입니다! 특히 오늘 발표 내용이 인상깊었어요",
      timestamp: "14:35",
      isOwn: false
    },
    {
      id: 4,
      user: "나",
      avatar: "ME",
      message: "네, 모두 수고하셨습니다! 다음 주 MT 준비도 화이팅해요 💪",
      timestamp: "14:37",
      isOwn: true
    },
    {
      id: 5,
      user: "최유진",
      avatar: "CY",
      message: "MT 장소 투표 결과 나왔나요?",
      timestamp: "14:40",
      isOwn: false
    },
    {
      id: 6,
      user: "김민수",
      avatar: "KM",
      message: "아직 투표 진행중이에요! 모두 참여해주세요 🗳️",
      timestamp: "14:42",
      isOwn: false
    }
  ]

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleCreateVote = () => {
    console.log("투표 생성:", {
      title: voteTitle,
      description: voteDescription,
      allowMultiple,
      deadline,
      options: options.filter((opt) => opt.trim() !== ""),
    })
    setShowVoteModal(false)
    setVoteTitle("")
    setVoteDescription("")
    setAllowMultiple(false)
    setDeadline("")
    setOptions(["", ""])
  }

  const handleCreateSettlement = () => {
    console.log("정산 생성:", {
      amount: settlementAmount,
      receipt: settlementReceipt,
      memo: settlementMemo,
      participants: settlementParticipants,
    })
    setShowSettlementModal(false)
    setSettlementAmount("")
    setSettlementReceipt(null)
    setSettlementMemo("")
    setSettlementParticipants([])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setSelectedMembers(chatMembers.map((member) => member.id))
    setSettlementParticipants(chatMembers.map((member) => member.id))
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const handleConfirmParticipants = () => {
    setIsParticipantsConfirmed(true)
    setShowMemberCheckModal(false)
    setSettlementParticipants(selectedMembers)
  }

  const handleCancelMemberCheck = () => {
    setShowMemberCheckModal(false)
    setSelectedMembers(chatMembers.map((member) => member.id)) // 모든 멤버 다시 선택
  }

  const handleSettlementParticipantToggle = (memberId: string) => {
    setSettlementParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleLeaveRoom = () => {
    if (confirm("정말로 채팅방을 나가시겠습니까?")) {
      console.log("채팅방 나가기")
      // 실제로는 라우터로 이동하거나 API 호출
    }
  }

  const handleDeleteRoom = () => {
    if (confirm("정말로 채팅방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      console.log("채팅방 삭제")
      // 실제로는 API 호출 후 라우터로 이동
    }
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSettlementReceipt(file)
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

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex">
          {/* 채널 사이드바 */}
          <div className="w-80 bg-white border-r border-orange-200 shadow-lg">
            <div className="p-6 border-b border-orange-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">채널</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedChannel === channel.id
                      ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md"
                      : "bg-orange-50 text-gray-700 hover:bg-orange-100"
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold"># {channel.name}</div>
                      <div
                        className={`text-sm ${selectedChannel === channel.id ? "text-orange-100" : "text-gray-500"}`}
                      >
                        {channel.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-orange-200">
              <button
                onClick={() => setShowVoteModal(true)}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-3"
              >
                <span className="text-lg text-white">🗳️</span>
                <span className="text-white">투표 생성</span>
              </button>

              <button
                onClick={() => setShowMemberCheckModal(true)}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-3 ${
                  isParticipantsConfirmed
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-400 hover:bg-gray-500 text-white"
                }`}
              >
                <span className="text-lg text-white">👥</span>
                <span className="text-white">
                  {isParticipantsConfirmed ? `참여 인원 확정 (${selectedMembers.length}명)` : "실제 참여 인원 체크"}
                </span>
              </button>

              <button
                onClick={() => setShowSettlementModal(true)}
                disabled={!isParticipantsConfirmed}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-4 ${
                  isParticipantsConfirmed
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-green-300 text-green-100 cursor-not-allowed"
                }`}
              >
                <span className={`text-lg ${isParticipantsConfirmed ? "text-white" : "text-green-200"}`}>💰</span>
                <span className={isParticipantsConfirmed ? "text-white" : "text-green-200"}>정산 생성</span>
              </button>

              <div className="border-t border-orange-200 pt-4 space-y-2">
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-gray-700">🚪</span>
                  <span className="text-gray-700">채팅방 나가기</span>
                </button>

                {isRoomOwner && (
                  <button
                    onClick={handleDeleteRoom}
                    className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-red-700">🗑️</span>
                    <span className="text-red-700">채팅방 삭제</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 채팅 메인 */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 bg-white border-b border-orange-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    # {channels.find((c) => c.id === selectedChannel)?.name}
                  </h1>
                  <p className="text-gray-600">{channels.find((c) => c.id === selectedChannel)?.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowParticipantsModal(true)}
                    className="px-4 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 hover:bg-orange-200 transition-colors text-sm font-medium"
                    aria-haspopup="dialog"
                  >
                    참여자 보기
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-orange-50 to-white">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {msg.avatar}
                    </div>
                    <div className={`flex-1 max-w-lg ${msg.isOwn ? "text-right" : ""}`}>
                      {!msg.isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{msg.user}</span>
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl shadow-sm ${
                          msg.isOwn
                            ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                            : "bg-white border border-orange-100"
                        }`}
                      >
                        <p className={msg.isOwn ? "text-white" : "text-gray-800"}>{msg.message}</p>
                      </div>
                      {msg.isOwn && <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-6 bg-white border-t border-orange-200">
              <form onSubmit={handleSendMessage}>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 pr-20"
                      placeholder={`# ${channels.find((c) => c.id === selectedChannel)?.name}에 메시지 보내기...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    전송
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showMemberCheckModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">실제 참여 인원 체크</h2>
              </div>
              <button
                onClick={handleCancelMemberCheck}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">정산에 참여할 실제 인원을 선택해주세요.</p>
              <div className="space-y-3">
                {chatMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400"
                    />
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {member.avatar}
                    </div>
                    <label htmlFor={`member-${member.id}`} className="flex-1 font-medium text-gray-800 cursor-pointer">
                      {member.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-blue-800 font-semibold">선택된 인원: {selectedMembers.length}명</p>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelMemberCheck}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmParticipants}
                disabled={selectedMembers.length === 0}
                className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                확정
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">정산 생성</h2>
              </div>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-6">
              {/* 정산 받을 총 금액 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">정산 받을 총 금액 *</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors pr-12"
                    placeholder="150000"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">원</span>
                </div>
              </div>

              {/* 영수증 입력칸 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">영수증 *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {settlementReceipt ? (
                      <div className="space-y-2">
                        <div className="text-green-600 text-2xl">📄</div>
                        <div className="text-green-700 font-medium">{settlementReceipt.name}</div>
                        <div className="text-sm text-gray-500">클릭하여 다른 파일 선택</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-gray-400 text-2xl">📷</div>
                        <div className="text-gray-600">영수증 이미지를 업로드하세요</div>
                        <div className="text-sm text-gray-500">JPG, PNG 파일만 가능</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 정산 참여 인원 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">정산 참여 인원</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chatMembers
                    .filter((member) => selectedMembers.includes(member.id))
                    .map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <input
                          type="checkbox"
                          id={`settlement-${member.id}`}
                          checked={settlementParticipants.includes(member.id)}
                          onChange={() => handleSettlementParticipantToggle(member.id)}
                          className="w-5 h-5 text-green-500 rounded focus:ring-green-400"
                        />
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.avatar}
                        </div>
                        <label
                          htmlFor={`settlement-${member.id}`}
                          className="flex-1 font-medium text-gray-800 cursor-pointer"
                        >
                          {member.name}
                        </label>
                      </div>
                    ))}
                </div>
                <div className="mt-2 p-3 bg-green-50 rounded-xl">
                  <p className="text-green-800 font-semibold">
                    선택된 인원: {settlementParticipants.length}명
                    {settlementAmount && settlementParticipants.length > 0 && (
                      <span className="ml-2 text-sm">
                        (1인당 {Math.ceil(Number(settlementAmount) / settlementParticipants.length).toLocaleString()}원)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 정산 메모 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">정산 메모</label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors resize-none"
                  rows={4}
                  placeholder="정산에 대한 설명을 입력하세요 (예: MT 숙박비 및 식비 정산)"
                  value={settlementMemo}
                  onChange={(e) => setSettlementMemo(e.target.value)}
                />
              </div>

              {/* 정산 정보 미리보기 */}
              {settlementAmount && settlementParticipants.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="font-semibold text-green-800 mb-2">정산 정보 미리보기</div>
                  <div className="space-y-1 text-sm text-green-700">
                    <div>
                      총 금액: <span className="font-semibold">{Number(settlementAmount).toLocaleString()}원</span>
                    </div>
                    <div>
                      참여 인원: <span className="font-semibold">{settlementParticipants.length}명</span>
                    </div>
                    <div>
                      1인당 금액:{" "}
                      <span className="font-semibold">
                        {Math.ceil(Number(settlementAmount) / settlementParticipants.length).toLocaleString()}원
                      </span>
                    </div>
                    {settlementReceipt && <div>영수증: {settlementReceipt.name}</div>}
                    {settlementMemo && <div>메모: {settlementMemo}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettlementModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateSettlement}
                disabled={!settlementAmount.trim() || !settlementReceipt || settlementParticipants.length === 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">참여자</h2>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 바디 */}
            <div className="p-6">
              <ul className="divide-y">
                <div className="mt-4 text-sm text-gray-600">
                  총 <span className="font-semibold">{chatMembers.length}</span>명
                </div>
                {chatMembers.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {m.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{m.name}</div>
                      {/* 필요하면 역할/상태 등 추가 */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">투표 생성</h2>
              <button
                onClick={() => setShowVoteModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-6">
              {/* 투표 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">투표 제목 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="투표 제목을 입력하세요"
                  value={voteTitle}
                  onChange={(e) => setVoteTitle(e.target.value)}
                />
              </div>

              {/* 투표 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors resize-none"
                  rows={3}
                  placeholder="투표에 대한 설명을 입력하세요 (선택사항)"
                  value={voteDescription}
                  onChange={(e) => setVoteDescription(e.target.value)}
                />
              </div>

              {/* 다중 투표 허용 */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-800">다중 투표 허용</div>
                  <div className="text-sm text-gray-600">참여자가 여러 선택지를 선택할 수 있습니다</div>
                </div>
                <button
                  onClick={() => setAllowMultiple(!allowMultiple)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    allowMultiple ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      allowMultiple ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">마감일 *</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              {/* 선택지들 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">선택지 *</label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                        placeholder={`선택지 ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors flex items-center justify-center"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl text-gray-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">+</span>
                    선택지 추가
                  </button>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateVote}
                disabled={!voteTitle.trim() || !deadline || options.filter((opt) => opt.trim()).length < 2}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>
        </div>
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

  )
}


