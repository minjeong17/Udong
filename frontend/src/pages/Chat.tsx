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

export default function ChatPage({ onNavigateToOnboarding }: ChatProps) {
  // const [selectedChannel, setSelectedChannel] = useState("general")
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showMemberCheckModal, setShowMemberCheckModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
  // const [isRoomOwner] = useState(true); // 현재 사용자가 방장인지 확인
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [channels, setChannels] = useState<Channel[]>([]);

  // WebSocket 보관용
  const wsRef = useRef<WebSocket | null>(null);
  const [_isConnecting, setIsConnecting] = useState(false);
  const [chatMessages, setChatMessages] = useState<UIMsg[]>([]);

  // 참여자 모달용 상태
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(
    null
  );

  const chatMembers = [
    { id: "1", name: "김민수", avatar: "KM" },
    { id: "2", name: "이지은", avatar: "LJ" },
    { id: "3", name: "박준호", avatar: "PJ" },
    { id: "4", name: "최유진", avatar: "CY" },
    { id: "5", name: "나", avatar: "ME" },
  ];

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const [isCreatingVote, setIsCreatingVote] = useState(false);

  const handleCreateVote = async () => {
    console.log("투표 생성:", {
      title: voteTitle,
      description: voteDescription,
      allowMultiple,
      deadline,
      options: options.filter((opt) => opt.trim() !== ""),
    });
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
    if (opts.length < 2) {
      alert("선택지는 최소 2개 이상이어야 합니다.");
      return;
    }

    const payload: CreateVoteRequest = {
      title: voteTitle.trim(),
      description: voteDescription.trim() || undefined,
      allowMultiple,
      // <input type="datetime-local"> 값을 ISO8601 문자열로 변환
      deadline: new Date(deadline).toISOString(),
      options: opts,
    };

    try {
      setIsCreatingVote(true);
      console.log(payload);
      await ChatApi.createVote(selectedChannel, payload); // ✅ API 호출
      alert("투표가 생성되었습니다.");

      // 입력값 초기화 + 모달 닫기
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

  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);

  const handleCreateSettlement = async () => {
    console.log("정산 생성:", {
      amount: settlementAmount,
      receipt: settlementReceipt,
      memo: settlementMemo,
      participants: settlementParticipants,
    });

    if (!selectedChannel) {
      alert("채팅방을 먼저 선택해주세요.");
      return;
    }

    // 금액 숫자화
    const amountNum = Number(String(settlementAmount).replace(/,/g, ""));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    // string[] -> number[]
    const participantUserIds = settlementParticipants
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (participantUserIds.length === 0) {
      alert("정산 참여 인원을 선택해주세요.");
      return;
    }

    // (UI에선 필수로 만들었으니 방어)
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
        receipt: settlementReceipt, // File
      });

      if (res.success) {
        // 성공 UX
        alert(res.data || "정산이 생성되었습니다.");

        // 입력값 리셋 & 모달 닫기
        setShowSettlementModal(false);
        setSettlementAmount("");
        setSettlementReceipt(null);
        setSettlementMemo("");
        setSettlementParticipants([]);
        // (선택) 확정 플래그도 초기화
        // setIsParticipantsConfirmed(false);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const twoLetters = (name: string = "") => {
    const t = name.trim();
    if (!t) return "??";
    // 한글이면 그냥 앞 2글자
    if (/[\uAC00-\uD7A3]/.test(t)) return t.slice(0, 2);
    // 영문/기타: 단어별 이니셜
    const parts = t.split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (a + b).toUpperCase();
  };

  const currentChannel = channels.find((c) => c.id === selectedChannel);
  const isGlobal = currentChannel?.typeCode === "GLOBAL";

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

  // messages 바뀔 때마다 scrollToBottom()
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 컴포넌트 mount 시 chatMembers → selectedMembers, settlementParticipants 초기화
  useEffect(() => {
    setSelectedMembers(chatMembers.map((member) => member.id));
    setSettlementParticipants(chatMembers.map((member) => member.id));
  }, []);

  // 컴포넌트 mount 시 ChatApi.getRoomsByClub(4) → 채널 목록 불러오기
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
      } catch (err) {
        console.error("채팅방 목록 불러오기 실패:", err);
      }
    })();
  }, []);

  //  WebSocket 연결 (방 선택 시)
  useEffect(() => {
    if (!selectedChannel) return;

    let closedByEffect = false;

    (async () => {
      try {
        setIsConnecting(true);

        // (옵션) 과거 메시지 불러오기
        setChatMessages([]);

        const base = new URL(import.meta.env.VITE_API_BASE_URL);
        const WS_BASE =
          (base.protocol === "https:" ? "wss://" : "ws://") + base.host;

        // const WS_BASE = (location.protocol === "https:" ? "wss://" : "ws://") + (import.meta.env.VITE_API_HOST ?? "localhost:8080");

        const token = localStorage.getItem("accessToken");
        const url = `${WS_BASE}/api/ws/chat?roomId=${selectedChannel}${
          token ? `&token=${encodeURIComponent(token)}` : ""
        }`;

        // 기존 연결 닫기
        try {
          wsRef.current?.close();
        } catch {}

        // 내 유저아이디 (토큰에서 파싱했거나 프로필에서 가져온 값)
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

  const [confirmedCount, setConfirmedCount] = useState<number>(0); // ✅ 추가

  useEffect(() => {
    setParticipants([]);
    setSelectedMembers([]);
    setSettlementParticipants([]);
    setIsParticipantsConfirmed(false); // ✅ 무조건 false로 초기화 (GLOBAL 숨김 처리로 충분)
    setConfirmedCount(0); // ✅ 초기화
  }, [selectedChannel]);

  useEffect(() => {
    (async () => {
      if (!selectedChannel) return;

      try {
        setParticipantsLoading(true);
        setParticipantsError(null);

        const resp = await ChatApi.getParticipants(selectedChannel);
        // 참여자 세팅
        setParticipants(resp.participants);
        const ids = resp.participants.map((p) => String(p.id));
        setSelectedMembers(ids);
        setSettlementParticipants(ids);

        // 확정 여부/인원 반영
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

  const ensureParticipants = async (roomId: number) => {
    if (participants.length > 0) return participants; // 이미 있으면 재사용

    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      const resp = await ChatApi.getParticipants(roomId);
      // resp는 ChatParticipants 타입: { chatId, participants }
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !message.trim()) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert("연결 중이거나 끊어졌어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    const payload: WsChatOut = {
      type: "CHAT",
      content: message.trim(),
    };
    ws.send(JSON.stringify(payload));

    setMessage("");
  };

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

    // 채팅방 참여자 목록 보장
    const list = await ensureParticipants(selectedChannel);
    if (list) {
      const allIds = list.map((p) => String(p.id));

      if (isGlobal) {
        // GLOBAL은 실참 확정 절차가 없으니 전체를 기본값으로 선택
        setSelectedMembers(allIds);
        setSettlementParticipants(allIds);
      } else {
        // EVENT인 경우: 이미 확정되어 있다면 확정값을 그대로,
        // (안 되어 있다면 openMemberCheckModal에서 처리하므로 여기선 건드릴 필요 없음)
        if (isParticipantsConfirmed && settlementParticipants.length === 0) {
          setSettlementParticipants(selectedMembers);
        }
      }
    }

    setShowSettlementModal(true);
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // const handleConfirmParticipants = () => {
  //   setIsParticipantsConfirmed(true);
  //   setShowMemberCheckModal(false);
  //   setSettlementParticipants(selectedMembers);
  // };

  // 기존 상태들 아래에 추가
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmParticipants = async () => {
    if (!selectedChannel) return; // 방 선택 안 됐으면 중단

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

      // 성공 시 기존 UI 상태 업데이트
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

  const handleCancelMemberCheck = () => {
    setShowMemberCheckModal(false);
    setSelectedMembers(chatMembers.map((member) => member.id)); // 모든 멤버 다시 선택
  };

  const handleSettlementParticipantToggle = (memberId: string) => {
    setSettlementParticipants((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleLeaveRoom = async () => {
    if (!selectedChannel) return;
    if (!confirm("정말로 채팅방을 나가시겠습니까?")) return;

    try {
      await ChatApi.leaveRoom(selectedChannel);
      alert("채팅방에서 나갔습니다.");

      // UI 반영 (예: 채널 목록에서 제거)
      setChannels((prev) => prev.filter((c) => c.id !== selectedChannel));
      setSelectedChannel(null);
      setChatMessages([]);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "채팅방 나가기 실패");
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedChannel) return;

    if (
      !confirm(
        "정말로 채팅방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    try {
      // WebSocket 먼저 닫기
      try {
        wsRef.current?.close();
      } catch {}

      await ChatApi.deleteRoom(selectedChannel);

      alert("채팅방이 삭제되었습니다.");

      // UI 반영: 삭제된 방을 목록에서 제거 + 선택 해제
      setChannels((prev) => prev.filter((c) => c.id !== selectedChannel));
      setSelectedChannel(null);
      setChatMessages([]);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "채팅방 삭제에 실패했습니다.");
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSettlementReceipt(file);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex h-full">
        {/* Left Sidebar */}
        <Sidebar
          onNavigateToOnboarding={onNavigateToOnboarding}
          onShowNotification={() => setShowNotificationModal(true)}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 h-full flex min-h-0">
          {/* 채널 사이드바 */}
          <div className="w-80 h-full bg-white border-r border-orange-200 shadow-lg overflow-y-auto">
            <div className="p-6 border-b border-orange-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  채팅
                </h2>
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
                      <div className="font-semibold font-jua">
                        # {channel.name}
                      </div>
                      <div className="font-semibold font-jua">
                        인원 : {channel.memberCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-orange-200">
              <button
                onClick={() => setShowVoteModal(true)}
                className="w-full bg-orange-400 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-500 transition-all duration-200 shadow-md hover:shadow-lg mb-3 font-jua
             flex items-center justify-center" // 버튼 자체를 중앙 정렬
              >
                <span className="inline-flex items-center justify-center gap-2 leading-none">
                  <span className="text-xl leading-none">🗳️</span>
                  <span className="leading-none">투표 생성</span>
                </span>
              </button>

              {/* EVENT에서만 노출 */}
              {!isGlobal && (
                <button
                  onClick={openMemberCheckModal}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-3 font-jua ${
                    isParticipantsConfirmed
                      ? "bg-blue-400 hover:bg-blue-500 text-white"
                      : "bg-gray-400 hover:bg-gray-500 text-white"
                  }`}
                >
                  <span className="text-lg text-white">👥</span>
                  <span className="text-white">
                    {isParticipantsConfirmed
                      ? `참여 인원 확정 (${confirmedCount}명)` // 여기!
                      : "실제 참여 인원 체크"}
                  </span>
                </button>
              )}

              {/* EVENT에서만 노출 (GLOBAL이면 숨김) */}
              {!isGlobal && (
                <button
                  onClick={openSettlementModal}
                  disabled={!isSettlementEnabled}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg font-jua
      flex items-center justify-center
      ${
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

              {!isGlobal && (
                <div className="border-t border-orange-200 pt-4 space-y-2">
                  {/* ✅ 방장이 아닐 때만 나가기 버튼 표시 */}
                  {!isRoomOwner && (
                    <button
                      onClick={handleLeaveRoom}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 font-jua"
                    >
                      <span className="text-gray-700">🚪</span>
                      <span className="text-gray-700">채팅방 나가기</span>
                    </button>
                  )}

                  {isRoomOwner && (
                    <button
                      onClick={handleDeleteRoom}
                      className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 font-jua"
                    >
                      <span className="text-red-600">🗑️</span>
                      <span className="text-red-600">채팅방 삭제</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 채팅 메인 */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* 헤더 */}
            <div className="shrink-0 p-6 bg-white border-b border-orange-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 font-jua">
                    {selectedChannel
                      ? `# ${
                          channels.find((c) => c.id === selectedChannel)?.name
                        }`
                      : "채팅"}
                  </h1>
                  {selectedChannel && (
                    <p className="text-gray-600 font-gowun">
                      인원{" "}
                      {
                        channels.find((c) => c.id === selectedChannel)
                          ?.memberCount
                      }
                      명
                    </p>
                  )}
                </div>

                {/* 참여자 보기 버튼은 방 선택됐을 때만 노출 */}
                {selectedChannel && (
                  <div className="flex gap-2">
                    <button
                      onClick={openParticipantsModal}
                      className="px-4 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 hover:bg-orange-200 transition-colors text-sm font-medium font-jua"
                      aria-haspopup="dialog"
                    >
                      참여자 보기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 본문: 선택 전 = Empty State / 선택 후 = 메시지 리스트 */}
            {!selectedChannel ? (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
                <div className="text-center text-gray-500">
                  <div className="text-5xl mb-3">💬</div>
                  <div className="text-xl font-jua mb-1">
                    채팅방을 선택하세요
                  </div>
                  <div className="font-gowun">
                    왼쪽 목록에서 채팅방을 선택하면 대화가 표시됩니다.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ▼ 기존 메시지 영역 그대로 */}
                <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-gradient-to-b from-orange-50 to-white scroll-smooth">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      // ① 한 줄 래퍼가 가로폭을 꽉 채우게
                      <div key={msg.id} className="w-full mb-3">
                        <div
                          className={`flex w-full ${
                            msg.isOwn ? "justify-end" : "justify-start"
                          } gap-3`}
                        >
                          {/* 왼쪽 아바타는 상대 글일 때만 */}
                          {!msg.isOwn && (
                            <div
                              className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full
                   flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                            >
                              {twoLetters(msg.user)}
                            </div>
                          )}

                          {/* ② 버블 컨테이너에만 max-w */}
                          <div className="max-w-[70%]">
                            {!msg.isOwn && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800 font-jua">
                                  {msg.user}
                                </span>
                                <span className="text-xs text-gray-500 font-gowun">
                                  {msg.timestamp}
                                </span>
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm inline-block
                                 ${
                                   msg.isOwn
                                     ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                                     : "bg-white border border-orange-100"
                                 }`}
                            >
                              {/* ③ 한글 줄바꿈 깔끔하게 */}
                              <p
                                className={`font-gowun ${
                                  msg.isOwn ? "text-white" : "text-gray-800"
                                } whitespace-pre-wrap break-keep`}
                              >
                                {msg.message}
                              </p>
                            </div>

                            {msg.isOwn && (
                              <div className="text-xs text-gray-500 mt-1 font-gowun text-right">
                                {msg.timestamp}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* 입력창 */}
                <div className="shrink-0 p-6 bg-white border-t border-orange-200">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 pr-20"
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
                        className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-jua"
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

      {showMemberCheckModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  실제 참여 인원 체크
                </h2>
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
              <p className="text-gray-600 mb-4 font-gowun">
                정산에 참여할 실제 인원을 선택해주세요.
              </p>

              {participantsLoading && (
                <div className="text-center text-gray-500 py-4 font-gowun">
                  불러오는 중…
                </div>
              )}

              {participantsError && !participantsLoading && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg font-gowun">
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
                        <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {twoLetters(member.name)}
                        </div>
                        <label
                          htmlFor={`member-${id}`}
                          className="flex-1 font-medium text-gray-800 cursor-pointer font-gowun"
                        >
                          {member.name}
                        </label>
                      </div>
                    );
                  })}
                  {participants.length === 0 && (
                    <div className="text-center text-gray-400 py-6 font-gowun">
                      참여자가 없습니다.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-blue-800 font-semibold font-jua">
                  선택된 인원: {selectedMembers.length}명
                </p>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelMemberCheck}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors font-jua"
              >
                취소
              </button>
              <button
                onClick={handleConfirmParticipants}
                disabled={selectedMembers.length === 0 || isConfirming}
                className="flex-1 py-3 px-4 bg-blue-400 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-jua"
              >
                {isConfirming ? "확정 중…" : "확정"}
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
                <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-jua">
                  정산 생성
                </h2>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  정산 받을 총 금액 *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors pr-12"
                    placeholder="150000"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium font-jua">
                    원
                  </span>
                </div>
              </div>

              {/* 영수증 입력칸 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  영수증 *
                </label>
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
                        <div className="text-green-700 font-medium font-gowun">
                          {settlementReceipt.name}
                        </div>
                        <div className="text-sm text-gray-500 font-gowun">
                          클릭하여 다른 파일 선택
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-gray-400 text-2xl">📷</div>
                        <div className="text-gray-600 font-gowun">
                          영수증 이미지를 업로드하세요
                        </div>
                        <div className="text-sm text-gray-500 font-gowun">
                          JPG, PNG 파일만 가능
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 정산 참여 인원 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  정산 참여 인원
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
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
                          <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {twoLetters(m.name)}
                          </div>
                          <label
                            htmlFor={`settlement-${id}`}
                            className="flex-1 font-medium text-gray-800 cursor-pointer font-gowun"
                          >
                            {m.name}
                          </label>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-2 p-3 bg-green-50 rounded-xl">
                  <p className="text-green-800 font-semibold font-jua">
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

              {/* 정산 메모 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  정산 메모
                </label>
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
                  <div className="font-semibold text-green-800 mb-2 font-jua">
                    정산 정보 미리보기
                  </div>
                  <div className="space-y-1 text-sm text-green-700 font-gowun">
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

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettlementModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors font-jua"
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
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-jua"
              >
                {isCreatingSettlement ? "생성 중…" : "생성"}
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
                <div className="w-10 h-10 bg-orange-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-jua">
                  참여자
                </h2>
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
              {participantsLoading && (
                <div className="text-center text-gray-500 py-6 font-gowun">
                  불러오는 중…
                </div>
              )}

              {participantsError && !participantsLoading && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg font-gowun">
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
                        <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {twoLetters(p.name)}
                        </div>

                        {/* 이름 */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 font-gowun">
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
                    <div className="text-center text-gray-400 py-6 font-gowun">
                      참여자가 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors font-jua"
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
              <h2 className="text-2xl font-bold text-gray-800 font-jua">
                투표 생성
              </h2>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  투표 제목 *
                </label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  설명
                </label>
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
                  <div className="font-semibold text-gray-800 font-jua">
                    다중 투표 허용
                  </div>
                  <div className="text-sm text-gray-600 font-gowun">
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

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  마감일 *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              {/* 선택지들 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-jua">
                  선택지 *
                </label>
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
                    <span className="font-gowun">선택지 추가</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors font-jua"
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
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-jua"
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
