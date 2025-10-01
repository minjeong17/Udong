import type React from "react";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NotificationModal from "../components/NotificationModal";
import type {
  Channel,
  WsChatIn,
  WsChatOut,
  UIMsg,
  Participant,
  CreateVoteRequest,
} from "../types/chat";
import { ChatApi } from "../apis/chat";
import { parseJwt } from "../utils/jwt";
import { useAuthStore } from "../stores/authStore";

interface ChatProps {
  onNavigateToOnboarding: () => void;
}

// 시스템 메시지 패턴 인식 및 렌더링 함수
const renderSystemMessage = (content: string) => {
  // ∈★ω투표:19ω★∋ 또는 ∈★ω정산:25ω★∋ 패턴 체크
  const systemPattern = /∈★ω(.+?):(\d+)ω★∋/;
  const match = content.match(systemPattern);

  // 디버깅용 콘솔 로그
  console.log('Checking message:', content);
  console.log('Pattern match:', match);

  // WebSocket 메시지 확인용 추가 로그
  if (content.includes('∈★ω')) {
    console.log('System message detected in content!');
  }

  if (match) {
    const [, type, id] = match;
    console.log('System message detected:', type, id);

    if (type === '투표') {
      return (
        <div
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all"
          onClick={() => {
            // 투표 페이지로 이동 (localStorage에 autoSelect 설정)
            localStorage.setItem('autoSelectVote', id);
            window.location.href = `/vote`;
          }}
        >
          <div className="text-2xl">📊</div>
          <div>
            <div className="font-semibold text-blue-700 font-jua">새로운 투표</div>
            <div className="text-sm text-blue-600 font-maplestory font-bold">투표에 참여해보세요</div>
          </div>
          <div className="ml-auto text-blue-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      );
    }

    if (type === '정산') {
      return (
        <div
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg cursor-pointer hover:from-green-100 hover:to-green-200 transition-all"
          onClick={() => {
            // 정산 페이지로 이동 (localStorage에 autoSelectSettlement 설정)
            localStorage.setItem('autoSelectSettlement', id);
            window.location.href = `/settlement`;
          }}
        >
          <div className="text-2xl">💰</div>
          <div>
            <div className="font-semibold text-green-700 font-jua">새로운 정산</div>
            <div className="text-sm text-green-600 font-maplestory font-bold">정산에 참여해보세요</div>
          </div>
          <div className="ml-auto text-green-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      );
    }
  }

  return null;
};

export default function ChatPage({ onNavigateToOnboarding }: ChatProps) {
  // 선택된 채널
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);

  // 입력 및 모달 상태
  const [message, setMessage] = useState("");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showMemberCheckModal, setShowMemberCheckModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // 투표/정산 관련 상태
  const [isParticipantsConfirmed, setIsParticipantsConfirmed] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementReceipt, setSettlementReceipt] = useState<File | null>(null);
  const [settlementMemo, setSettlementMemo] = useState("");
  const [settlementParticipants, setSettlementParticipants] = useState<
    string[]
  >([]);
  const [voteTitle, setVoteTitle] = useState("");
  const [voteDescription, setVoteDescription] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState(["", ""]);

  // 리스트 및 메시지
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [_isConnecting, setIsConnecting] = useState(false);
  const [chatMessages, setChatMessages] = useState<UIMsg[]>([]);

  // 참여자 모달용
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(
    null
  );

  // 더미 멤버(초기 선택값)
  // const chatMembers = [
  //   { id: "1", name: "김민수", avatar: "KM" },
  //   { id: "2", name: "이지은", avatar: "LJ" },
  //   { id: "3", name: "박준호", avatar: "PJ" },
  //   { id: "4", name: "최유진", avatar: "CY" },
  //   { id: "5", name: "나", avatar: "ME" },
  // ];

  // 옵션 조작
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  // 투표 생성
  const [isCreatingVote, setIsCreatingVote] = useState(false);
  const handleCreateVote = async () => {
    if (!selectedChannel) {
      alert("채팅방을 먼저 선택해주세요.");
      return;
    }
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!voteTitle.trim()) {
      alert("투표 제목을 입력해주세요.");
      return;
    }
    if (!deadline) {
      alert("마감일을 선택해주세요.");
      return;
    }
    // 마감일이 현재 시간보다 이후인지 검증
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      alert("마감일은 현재 시간보다 이후여야 합니다.");
      return;
    }
    if (opts.length < 2) {
      alert("선택지는 최소 2개 이상이어야 합니다.");
      return;
    }

    const payload: CreateVoteRequest = {
      title: voteTitle.trim(),
      description: voteDescription.trim() || undefined,
      allowMultiple,
      // datetime-local 값을 로컬 시간 기준으로 LocalDateTime 형식으로 변환 (시간대 변환 없이)
      deadline: deadline + ':00', // "2025-09-25T12:00" -> "2025-09-25T12:00:00"
      options: opts,
    };

    try {
      setIsCreatingVote(true);
      await ChatApi.createVote(selectedChannel, payload);
      alert("투표가 생성되었습니다.");
      setShowVoteModal(false);
      setVoteTitle("");
      setVoteDescription("");
      setAllowMultiple(false);
      setDeadline("");
      setOptions(["", ""]);
    } catch (e: any) {
      console.error(e);
      alert(
        e?.message ?? "투표 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsCreatingVote(false);
    }
  };

  // 정산 생성
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const handleCreateSettlement = async () => {
    if (!selectedChannel) {
      alert("채팅방을 먼저 선택해주세요.");
      return;
    }

    const amountNum = Number(String(settlementAmount).replace(/,/g, ""));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    const participantUserIds = settlementParticipants
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (participantUserIds.length === 0) {
      alert("정산 참여 인원을 선택해주세요.");
      return;
    }

    if (!settlementReceipt) {
      alert("영수증 이미지를 업로드해주세요.");
      return;
    }

    try {
      setIsCreatingSettlement(true);
      const res = await ChatApi.createDutchpayByChat(selectedChannel, {
        amount: amountNum,
        note: settlementMemo || undefined,
        participantUserIds,
        receipt: settlementReceipt,
      });

      if (res.success) {
        alert(res.data || "정산이 생성되었습니다.");
        setShowSettlementModal(false);
        setSettlementAmount("");
        setSettlementReceipt(null);
        setSettlementMemo("");
        setSettlementParticipants([]);
      } else {
        alert("정산 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "정산 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  // 유틸
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const twoLetters = (name: string = "") => {
    const t = name.trim();
    if (!t) return "??";
    if (/[\uAC00-\uD7A3]/.test(t)) return t.slice(0, 2);
    const parts = t.split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (a + b).toUpperCase();
  };

  // 현재 채널 정보
  const currentChannel = channels.find((c) => c.id === selectedChannel);
  const isGlobal = currentChannel?.typeCode === "GLOBAL";

  // 사용자 정보
  const token = localStorage.getItem("accessToken");
  const payload = token ? parseJwt(token) : null;
  const myUserId: number | null = payload?.userId
    ? Number(payload.userId)
    : null;

  const isRoomOwner =
    !!currentChannel &&
    myUserId != null &&
    currentChannel.createdByUserId === myUserId;

  // EVENT에서만 보이고, 참여 인원 확정 후에만 활성
  const isSettlementEnabled =
    !!selectedChannel && !isGlobal && isParticipantsConfirmed;

  // 스크롤 하단 고정
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 초기 선택 기본값
  // useEffect(() => {
  //   setSelectedMembers(chatMembers.map((m) => m.id));
  //   setSettlementParticipants(chatMembers.map((m) => m.id));
  // }, []);

  // 채널 목록 로드
  useEffect(() => {
    (async () => {
      try {
        const auth = useAuthStore.getState();
        const clubId = auth?.clubId;
        if (clubId == null) return;

        const rooms = await ChatApi.getRoomsByClub(clubId); // clubId = 4
        console.log("채팅방 목록:", rooms);
        setChannels(rooms); // rooms는 Channel[] 타입

        // 채널 목록을 불러온 후 자동 선택 확인
        const autoSelectRoom = localStorage.getItem('autoSelectRoom');
        if (autoSelectRoom === 'global') {
          // GLOBAL 채팅방을 찾아서 자동 선택
          const globalRoom = rooms.find(room => room.typeCode === 'GLOBAL');
          if (globalRoom) {
            setSelectedChannel(globalRoom.id);
          }
          // 한 번 사용한 후 제거
          localStorage.removeItem('autoSelectRoom');
        }

        // 🔸 추가: Calendar에서 저장한 focusChatId 우선 선택
        const focusIdStr = sessionStorage.getItem('focusChatId');
        if (focusIdStr) {
          const focusId = Number(focusIdStr);
          const target = rooms.find(r => r.id === focusId);
          if (target) setSelectedChannel(target.id);
          sessionStorage.removeItem('focusChatId');
        }

      } catch (err) {
        console.error("채팅방 목록 불러오기 실패:", err);
      }
    })();
  }, []);

    // 2) channels 변경 시 혹시 모를 레이스컨디션 보완
  useEffect(() => {
    if (selectedChannel != null || channels.length === 0) return;
    const focusIdStr = sessionStorage.getItem('focusChatId');
    if (!focusIdStr) return;
    const focusId = Number(focusIdStr);
    if (channels.some(r => r.id === focusId)) {
      setSelectedChannel(focusId);
      sessionStorage.removeItem('focusChatId');
    }
  }, [channels, selectedChannel]);


  // focusChatId 자동 선택
  useEffect(() => {
    if (!selectedChannel) return;

    let closedByEffect = false;

    (async () => {
      try {
        setIsConnecting(true);
        setChatMessages([]);

        const base = new URL(import.meta.env.VITE_API_BASE_URL);
        const WS_BASE =
          (base.protocol === "https:" ? "wss://" : "ws://") + base.host;

        // const WS_BASE = (location.protocol === "https:" ? "wss://" : "ws://") + (import.meta.env.VITE_API_HOST ?? "localhost:8080");

        const token = localStorage.getItem("accessToken");
        const url = `${WS_BASE}/api/ws/chat?roomId=${selectedChannel}${
          token ? `&token=${encodeURIComponent(token)}` : ""
        }`;

        try {
          wsRef.current?.close();
        } catch {}

        const payload = token ? parseJwt(token) : null;
        const myUserId: number | null = payload?.userId
          ? Number(payload?.userId)
          : null;

        const history = await ChatApi.getRecentMessages(selectedChannel, 50);
        setChatMessages(
          history.map((h) => ({
            id: String(h.messageId),
            user: h.senderName ?? "익명",
            message: h.content,
            timestamp: new Date(h.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isOwn: h.senderUserId === myUserId,
          }))
        );

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (closedByEffect) return;
          setIsConnecting(false);
          console.log("✅ WS open:", url);
        };

        ws.onmessage = (ev) => {
          if (closedByEffect) return;
          try {
            const data: WsChatIn = JSON.parse(ev.data);
            console.log("🔥 WebSocket 메시지 받음:", data);
            if (data.type !== "CHAT") return;

            setChatMessages((prev) => [
              ...prev,
              {
                id: data.messageId
                  ? String(data.messageId)
                  : `local-${Date.now()}`,
                user: data.senderName ?? "익명",
                message: data.content,
                timestamp: new Date(data.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isOwn:
                  myUserId != null ? data.senderUserId === myUserId : false,
              },
            ]);
          } catch (e) {
            console.warn("수신 파싱 실패:", e);
          }
        };

        ws.onclose = (e) => {
          console.log("❌ WS closed:", e.code, e.reason);
          if (!closedByEffect) setIsConnecting(false);
        };

        ws.onerror = (e) => {
          console.error("⚠️ WS error:", e);
        };
      } catch (e) {
        console.error("WS 연결 실패:", e);
        setIsConnecting(false);
      }
    })();

    return () => {
      closedByEffect = true;
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
      setIsConnecting(false);
    };
  }, [selectedChannel]);

  // 참여자 상태 초기화(채널 변경 시)
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  useEffect(() => {
    setParticipants([]);
    setSelectedMembers([]);
    setSettlementParticipants([]);
    setIsParticipantsConfirmed(false);
    setConfirmedCount(0);
  }, [selectedChannel]);

  // 참여자 불러오기
  useEffect(() => {
    (async () => {
      if (!selectedChannel) return;
      try {
        setParticipantsLoading(true);
        setParticipantsError(null);

        const resp = await ChatApi.getParticipants(selectedChannel);
        setParticipants(resp.participants);

        const ids = resp.participants.map((p) => String(p.id));
        setSelectedMembers(ids);
        setSettlementParticipants(ids);

        setIsParticipantsConfirmed(!!resp.confirmed);
        setConfirmedCount(
          resp.confirmed ? resp.confirmedCount ?? 0 : ids.length
        );
      } catch (e: any) {
        setParticipantsError(
          e?.message ?? "참여자 정보를 불러오지 못했습니다."
        );
      } finally {
        setParticipantsLoading(false);
      }
    })();
  }, [selectedChannel]);

  // 참여자 확보 보조
  const ensureParticipants = async (roomId: number) => {
    if (participants.length > 0) return participants;
    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      const resp = await ChatApi.getParticipants(roomId);
      setParticipants(resp.participants);

      const ids = resp.participants.map((p) => String(p.id));
      setSelectedMembers(ids);
      setSettlementParticipants(ids);

      return resp.participants;
    } catch (e: any) {
      const msg = e?.message ?? "참여자 정보를 불러오지 못했습니다.";
      setParticipantsError(msg);
      return null;
    } finally {
      setParticipantsLoading(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !message.trim()) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert("연결 중이거나 끊어졌어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    const payload: WsChatOut = { type: "CHAT", content: message.trim() };
    ws.send(JSON.stringify(payload));
    setMessage("");
  };

  // 모달 오픈 함수들
  const openParticipantsModal = async () => {
    if (!selectedChannel) return;
    await ensureParticipants(selectedChannel);
    setShowParticipantsModal(true);
  };
  const openMemberCheckModal = async () => {
    if (!selectedChannel) return;
    const list = await ensureParticipants(selectedChannel);
    if (list) {
      const ids = list.map((p) => String(p.id));
      setSelectedMembers(ids);
      setSettlementParticipants(ids);
    }
    setShowMemberCheckModal(true);
  };
  const openSettlementModal = async () => {
    if (!selectedChannel) return;
    const list = await ensureParticipants(selectedChannel);
    if (list) {
      const allIds = list.map((p) => String(p.id));
      if (isGlobal) {
        setSelectedMembers(allIds);
        setSettlementParticipants(allIds);
      } else {
        if (isParticipantsConfirmed && settlementParticipants.length === 0) {
          setSettlementParticipants(selectedMembers);
        }
      }
    }
    setShowSettlementModal(true);
  };

  // 선택/확정 토글
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 실제 참여자 확정
  const [isConfirming, setIsConfirming] = useState(false);
  const handleConfirmParticipants = async () => {
    if (!selectedChannel) return;

    try {
      setIsConfirming(true);

      // string[] -> number[]
      const ids = selectedMembers
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));

      console.log("idddd ", ids, selectedChannel);

      const auth = useAuthStore.getState();
      const clubId = auth?.clubId;
      if (clubId == null) return;

      await ChatApi.confirmParticipantsByChatId(clubId, selectedChannel, ids);

      setIsParticipantsConfirmed(true);
      setConfirmedCount(ids.length);
      setSettlementParticipants(selectedMembers);
      setShowMemberCheckModal(false);
    } catch (e: any) {
      alert(e?.message ?? "참여자 확정에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsConfirming(false);
    }
  };

  // 모달 조작
  const handleCancelMemberCheck = () => {
    setShowMemberCheckModal(false);
    // setSelectedMembers(chatMembers.map((m) => m.id));
  };
  const handleSettlementParticipantToggle = (memberId: string) => {
    setSettlementParticipants((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 채팅방 나가기
  const handleLeaveRoom = async () => {
    if (!selectedChannel) return;
    if (!confirm("정말로 채팅방을 나가시겠습니까?")) return;
    try {
      await ChatApi.leaveRoom(selectedChannel);
      alert("채팅방에서 나갔습니다.");
      setChannels((prev) => prev.filter((c) => c.id !== selectedChannel));
      setSelectedChannel(null);
      setChatMessages([]);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "채팅방 나가기 실패");
    }
  };

  // 영수증 파일
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSettlementReceipt(file);
  };

  return (
    <div className="overflow-hidden h-dvh bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex h-full">
        {/* Left Sidebar (앱 공통) */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex flex-1 h-full min-h-0">
        {/* 채널 사이드바 */}
        <div className="h-full w-80 bg-white border-r border-orange-200 shadow-lg flex flex-col min-h-0">
          {/* 상단 헤더 (고정) */}
          <div className="p-6 border-b border-orange-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 font-jua">채팅</h2>
            </div>
          </div>

          {/* 채팅 리스트: 남은 공간 모두 차지 + 해당 영역만 스크롤 */}
          <div className="p-1 flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold font-jua"># {channel.name}</div>
                      <div className="font-semibold font-jua">인원 : {channel.memberCount}</div>
                    </div>
                  </div>
                </div>
              ))}

              {channels.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-maplestory font-bold">
                  채팅방이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 하단 액션: 항상 보이도록 sticky + 배경/보더로 분리감 */}
          <div className="sticky bottom-0 z-10 bg-white border-t border-orange-200">
            <div className="p-4 space-y-3">
              {!selectedChannel && (
                <div className="text-xs text-gray-500 text-center font-maplestory font-bold">
                  채팅방을 선택하세요
                </div>
              )}

              {selectedChannel && (
                <>
                  <button
                    onClick={() => setShowVoteModal(true)}
                    className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white transition-all duration-200 bg-orange-400 shadow-md rounded-xl hover:bg-orange-500 hover:shadow-lg font-jua"
                  >
                    <span className="inline-flex items-center justify-center gap-2 leading-none">
                      <span className="text-xl leading-none">🗳️</span>
                      <span className="leading-none">투표 생성</span>
                    </span>
                  </button>

                  {!isGlobal && (
                    <button
                      onClick={openMemberCheckModal}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-jua ${
                        isParticipantsConfirmed
                          ? "bg-blue-400 hover:bg-blue-500 text-white"
                          : "bg-gray-400 hover:bg-gray-500 text-white"
                      }`}
                    >
                      <span className="text-lg text-white">👥</span>
                      <span className="text-white">
                        {isParticipantsConfirmed ? `참여 인원 확정 (${confirmedCount}명)` : "실제 참여 인원 체크"}
                      </span>
                    </button>
                  )}

                  {!isGlobal && (
                    <button
                      onClick={openSettlementModal}
                      disabled={!isSettlementEnabled}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg font-jua flex items-center justify-center ${
                        isSettlementEnabled
                          ? "bg-green-400 hover:bg-green-500 text-white"
                          : "bg-green-300 text-green-100 cursor-not-allowed"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 leading-none">
                        <span className="text-xl leading-none">💰</span>
                        <span className="leading-none">정산 생성</span>
                      </span>
                    </button>
                  )}

                  {!isGlobal && !isRoomOwner && (
                    <button
                      onClick={handleLeaveRoom}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl font-jua"
                    >
                      <span className="text-gray-700">🚪</span>
                      <span className="text-gray-700">채팅방 나가기</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>



          {/* 채팅 메인 */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* 헤더 */}
            <div className="p-6 bg-white border-b border-orange-200 shadow-sm shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 font-jua">
                    {selectedChannel
                      ? `# ${
                          channels.find((c) => c.id === selectedChannel)?.name
                        }`
                      : "채팅"}
                  </h1>
                  {selectedChannel && (
                    <p className="text-gray-600 font-maplestory font-bold">
                      인원{" "}
                      {
                        channels.find((c) => c.id === selectedChannel)
                          ?.memberCount
                      }
                      명
                    </p>
                  )}
                </div>

                {/* 참여자 보기: 채널 선택 시 */}
                {selectedChannel && (
                  <div className="flex gap-2">
                    <button
                      onClick={openParticipantsModal}
                      className="flex items-center justify-center h-10 px-4 text-sm font-medium text-orange-700 transition-colors bg-orange-100 rounded-full hover:bg-orange-200 font-jua"
                      aria-haspopup="dialog"
                    >
                      참여자 보기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 본문 */}
            {!selectedChannel ? (
              <div className="flex items-center justify-center flex-1 bg-gradient-to-b from-orange-50 to-white">
                <div className="text-center text-gray-500">
                  <div className="mb-3 text-5xl">💬</div>
                  <div className="mb-1 text-xl font-jua">
                    채팅방을 선택하세요
                  </div>
                  <div className="font-maplestory font-bold">
                    왼쪽 목록에서 채팅방을 선택하면 대화가 표시됩니다.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ▼ 기존 메시지 영역 그대로 */}
                <div className="flex-1 min-h-0 p-6 overflow-y-auto bg-gradient-to-b from-orange-50 to-white scroll-smooth">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => {
                      // 시스템 메시지인지 확인
                      const systemMessageUI = renderSystemMessage(msg.message);

                      if (systemMessageUI) {
                        // 시스템 메시지는 완전히 다른 레이아웃
                        return (
                          <div key={msg.id} className="w-full mb-4">
                            <div className="flex justify-center">
                              <div className="w-full max-w-md">
                                {systemMessageUI}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 일반 메시지는 기존 레이아웃
                      return (
                        <div key={msg.id} className="w-full mb-3">
                          <div
                            className={`flex w-full ${
                              msg.isOwn ? "justify-end" : "justify-start"
                            } gap-3`}
                          >
                            {/* 왼쪽 아바타는 상대 글일 때만 */}
                            {!msg.isOwn && (
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-semibold text-white rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                                {twoLetters(msg.user)}
                              </div>
                            )}

                            <div className="max-w-[70%]">
                              {!msg.isOwn && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-800 font-jua">
                                    {msg.user}
                                  </span>
                                  <span className="text-xs text-gray-500 font-maplestory font-bold">
                                    {msg.timestamp}
                                  </span>
                                </div>
                              )}

                              <div
                                className={`rounded-2xl px-4 py-3 shadow-sm inline-block ${
                                  msg.isOwn
                                    ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                                    : "bg-white border border-orange-100"
                                }`}
                              >
                                <p
                                  className={`font-maplestory font-bold ${
                                    msg.isOwn ? "text-white" : "text-gray-800"
                                  } whitespace-pre-wrap break-keep`}
                                >
                                  {msg.message}
                                </p>
                              </div>

                              {msg.isOwn && (
                                <div className="mt-1 text-xs text-right text-gray-500 font-maplestory font-bold">
                                  {msg.timestamp}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* 입력창 */}
                <div className="p-6 bg-white border-t border-orange-200 shrink-0">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full px-4 py-3 pr-20 border border-orange-200 bg-orange-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                          placeholder={
                            selectedChannel
                              ? `# ${
                                  channels.find((c) => c.id === selectedChannel)
                                    ?.name
                                }에 메시지 보내기...`
                              : "채팅방을 선택하면 메시지를 보낼 수 있어요"
                          }
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          disabled={!selectedChannel}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!selectedChannel || !message.trim()}
                        className="px-6 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-jua"
                      >
                        전송
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 실제 참여 인원 체크 모달 */}
      {showMemberCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-400 rounded-xl">
                  <span className="text-lg text-white">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  실제 참여 인원 체크
                </h2>
              </div>
              <button
                onClick={handleCancelMemberCheck}
                className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4 text-gray-600 font-maplestory font-bold">
                정산에 참여할 실제 인원을 선택해주세요.
              </p>

              {participantsLoading && (
                <div className="py-4 text-center text-gray-500 font-maplestory font-bold">
                  불러오는 중…
                </div>
              )}

              {participantsError && !participantsLoading && (
                <div className="p-3 mb-4 text-red-700 rounded-lg bg-red-50 font-maplestory font-bold">
                  {participantsError}
                </div>
              )}

              {!participantsLoading && (
                <div className="space-y-3">
                  {(participants ?? []).map((member) => {
                    const id = String(member.id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <input
                          type="checkbox"
                          id={`member-${id}`}
                          checked={selectedMembers.includes(id)}
                          onChange={() => handleMemberToggle(id)}
                          className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400"
                        />
                        <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-orange-400 rounded-full">
                          {twoLetters(member.name)}
                        </div>
                        <label
                          htmlFor={`member-${id}`}
                          className="flex-1 font-medium text-gray-800 cursor-pointer font-maplestory font-bold"
                        >
                          {member.name}
                        </label>
                      </div>
                    );
                  })}
                  {participants.length === 0 && (
                    <div className="py-6 text-center text-gray-400 font-maplestory font-bold">
                      참여자가 없습니다.
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 mt-4 bg-blue-50 rounded-xl">
                <p className="font-semibold text-blue-800 font-jua">
                  선택된 인원: {selectedMembers.length}명
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelMemberCheck}
                className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl font-jua"
              >
                취소
              </button>
              <button
                onClick={handleConfirmParticipants}
                disabled={selectedMembers.length === 0 || isConfirming}
                className="flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 bg-blue-400 hover:bg-blue-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-jua"
              >
                {isConfirming ? "확정 중…" : "확정"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정산 생성 모달 */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-400 rounded-xl">
                  <span className="text-lg text-white">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-jua">
                  정산 생성
                </h2>
              </div>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  정산 받을 총 금액 *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 pr-12 transition-colors border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
                    placeholder="150000"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                  />
                  <span className="absolute font-medium text-gray-500 -translate-y-1/2 right-4 top-1/2 font-jua">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  영수증 *
                </label>
                <div className="p-6 text-center transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:border-green-400">
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
                        <div className="text-2xl text-green-600">📄</div>
                        <div className="font-medium text-green-700 font-maplestory font-bold">
                          {settlementReceipt.name}
                        </div>
                        <div className="text-sm text-gray-500 font-maplestory font-bold">
                          클릭하여 다른 파일 선택
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-2xl text-gray-400">📷</div>
                        <div className="text-gray-600 font-maplestory font-bold">
                          영수증 이미지를 업로드하세요
                        </div>
                        <div className="text-sm text-gray-500 font-maplestory font-bold">
                          JPG, PNG 파일만 가능
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  정산 참여 인원
                </label>
                <div className="space-y-2 overflow-y-auto max-h-40">
                  {participants
                    .filter((m) => selectedMembers.includes(String(m.id)))
                    .map((m) => {
                      const id = String(m.id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <input
                            type="checkbox"
                            id={`settlement-${id}`}
                            checked={settlementParticipants.includes(id)}
                            onChange={() =>
                              handleSettlementParticipantToggle(id)
                            }
                            className="w-5 h-5 text-green-500 rounded focus:ring-green-400"
                          />
                          <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-orange-400 rounded-full">
                            {twoLetters(m.name)}
                          </div>
                          <label
                            htmlFor={`settlement-${id}`}
                            className="flex-1 font-medium text-gray-800 cursor-pointer font-maplestory font-bold"
                          >
                            {m.name}
                          </label>
                        </div>
                      );
                    })}
                </div>
                <div className="p-3 mt-2 bg-green-50 rounded-xl">
                  <p className="font-semibold text-green-800 font-jua">
                    선택된 인원: {settlementParticipants.length}명
                    {settlementAmount && settlementParticipants.length > 0 && (
                      <span className="ml-2 text-sm">
                        (1인당{" "}
                        {Math.ceil(
                          Number(settlementAmount) /
                            settlementParticipants.length
                        ).toLocaleString()}
                        원)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  메모
                </label>
                <textarea
                  value={settlementMemo}
                  onChange={(e) => setSettlementMemo(e.target.value)}
                  className="w-full px-4 py-3 transition-colors border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
                  placeholder="메모를 작성하세요"
                  rows={4}
                />
              </div>

              {settlementAmount && settlementParticipants.length > 0 && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                  <div className="mb-2 font-semibold text-green-800 font-jua">
                    정산 정보 미리보기
                  </div>
                  <div className="space-y-1 text-sm text-green-700 font-maplestory font-bold">
                    <div>
                      총 금액:{" "}
                      <span className="font-semibold">
                        {Number(settlementAmount).toLocaleString()}원
                      </span>
                    </div>
                    <div>
                      참여 인원:{" "}
                      <span className="font-semibold">
                        {settlementParticipants.length}명
                      </span>
                    </div>
                    <div>
                      1인당 금액:{" "}
                      <span className="font-semibold">
                        {Math.ceil(
                          Number(settlementAmount) /
                            settlementParticipants.length
                        ).toLocaleString()}
                        원
                      </span>
                    </div>
                    {settlementReceipt && (
                      <div>영수증: {settlementReceipt.name}</div>
                    )}
                    {settlementMemo && <div>메모: {settlementMemo}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettlementModal(false)}
                className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl font-jua"
              >
                취소
              </button>
              <button
                onClick={handleCreateSettlement}
                disabled={
                  isCreatingSettlement ||
                  !settlementAmount.trim() ||
                  !settlementReceipt ||
                  settlementParticipants.length === 0
                }
                className="flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-jua"
              >
                {isCreatingSettlement ? "생성 중…" : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 참여자 보기 모달 */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-400 rounded-xl">
                  <span className="text-lg text-white">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  참여자
                </h2>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {participantsLoading && (
                <div className="py-6 text-center text-gray-500 font-maplestory font-bold">
                  불러오는 중…
                </div>
              )}

              {participantsError && !participantsLoading && (
                <div className="p-3 mb-4 text-red-700 rounded-lg bg-red-50 font-maplestory font-bold">
                  {participantsError}
                </div>
              )}

              {!participantsLoading && !participantsError && (
                <>
                  <div className="mt-1 mb-3 text-sm text-gray-600">
                    총{" "}
                    <span className="font-semibold font-jua">
                      {participants?.length ?? 0}
                    </span>
                    명
                  </div>

                  <ul className="divide-y">
                    {(participants ?? []).map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-3">
                        {/* 아바타(이니셜) */}
                        <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-orange-400 rounded-full">
                          {twoLetters(p.name)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 font-maplestory font-bold">
                            {p.name}
                          </div>
                        </div>

                        {/* 방장 뱃지 */}
                        {p.isOwner && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium">
                            방장
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {participants && participants.length === 0 && (
                    <div className="py-6 text-center text-gray-400 font-maplestory font-bold">
                      참여자가 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-full px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl font-jua"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 투표 생성 모달 */}
      {showVoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 font-jua">
                투표 생성
              </h2>
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  투표 제목 *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 transition-colors border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                  placeholder="투표 제목을 입력하세요"
                  value={voteTitle}
                  onChange={(e) => setVoteTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  설명
                </label>
                <textarea
                  className="w-full px-4 py-3 transition-colors border-2 border-gray-200 resize-none rounded-xl focus:outline-none focus:border-orange-400"
                  rows={3}
                  placeholder="투표에 대한 설명을 입력하세요 (선택사항)"
                  value={voteDescription}
                  onChange={(e) => setVoteDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-800 font-jua">
                    다중 투표 허용
                  </div>
                  <div className="text-sm text-gray-600 font-maplestory font-bold">
                    참여자가 여러 선택지를 선택할 수 있습니다
                  </div>
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

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  마감일 *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 transition-colors border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700 font-jua">
                  선택지 *
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 transition-colors border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                        placeholder={`선택지 ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="flex items-center justify-center w-12 h-12 text-red-600 transition-colors bg-red-100 hover:bg-red-200 rounded-xl"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="flex items-center justify-center w-full gap-2 py-3 text-gray-600 transition-colors border-2 border-gray-300 border-dashed hover:border-orange-400 rounded-xl hover:text-orange-600"
                  >
                    <span className="text-lg">+</span>
                    <span className="font-maplestory font-bold">선택지 추가</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl font-jua"
              >
                취소
              </button>
              <button
                onClick={handleCreateVote}
                disabled={
                  isCreatingVote ||
                  !voteTitle.trim() ||
                  !deadline ||
                  options.filter((opt) => opt.trim()).length < 2
                }
                className="flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-jua"
              >
                {isCreatingVote ? "생성 중…" : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNavigateToOnboarding={onNavigateToOnboarding}
      />
    </div>
  );
}
