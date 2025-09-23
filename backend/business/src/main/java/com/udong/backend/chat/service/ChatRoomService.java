package com.udong.backend.chat.service;

import com.udong.backend.calendar.entity.Event;
import com.udong.backend.chat.dto.ChatMemberItem;
import com.udong.backend.chat.dto.ChatParticipantsResponse;
import com.udong.backend.chat.dto.ChatRoomListItem;
import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.entity.ChatMember;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatMemberRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.service.CodeService;
import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {

    private static final String CODE_GROUP = "chats"; // code_group.group_name

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final CodeService codeService;
    private final MembershipRepository membershipRepository;
    private final EventMemberRepository eventMemberRepository;

    /** 채팅방 생성 + 생성자 자동 멤버 추가 */
    @Transactional
    public void create(Integer creatorUserId, CreateRoomRequest req) {
        // 1) 코드 유효성
        CodeDetail type = codeService.getActiveDetailOrThrow(CODE_GROUP, req.getTypeCode());

        // 2) (type, targetId) 중복 방지
        if (chatRoomRepository.existsByType_CodeNameIgnoreCaseAndTargetId(type.getCodeName(), req.getTargetId())) {
            throw new IllegalArgumentException("이미 동일 대상의 채팅방이 존재합니다.");
        }

        // 3) 엔티티 준비 (User/CodeDetail는 레퍼런스 사용)
        User creatorRef = userRepository.getReferenceById(creatorUserId);

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .createdBy(creatorRef)
                .name(req.getName())
                .type(type)                     // GLOBAL | EVENT
                .targetId(req.getTargetId())    // GLOBAL→club_id, EVENT→event_id
                .build());

        // 4) 생성자 자동 가입 (중복 방지)
        if (!chatMemberRepository.existsByChat_IdAndUser_Id(room.getId(), creatorUserId)) {
            chatMemberRepository.save(ChatMember.builder()
                    .chat(room)
                    .user(creatorRef)
                    .build());
        }
    }

    /**
     * 멤버 추가: typeCode + targetId 로 방 조회 후 userId를 멤버로 추가
     * typeCode 예) "GLOBAL", "EVENT" (대소문자 무시)
     */
    @Transactional
    public void addMember(String typeCode, Integer targetId, Integer userId) {
        if (typeCode == null || targetId == null || userId == null) {
            throw new IllegalArgumentException("typeCode, targetId, userId는 필수입니다.");
        }

        String normalized = typeCode.trim().toUpperCase();

        // 1) (type, targetId)로 채팅방 조회
        ChatRoom room = chatRoomRepository.findByType_CodeNameIgnoreCaseAndTargetId(normalized, targetId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "채팅방을 찾을 수 없습니다. type=" + normalized + ", targetId=" + targetId));

        // 2) 타입별 도메인 유효성
        if ("GLOBAL".equals(normalized)) {
            // memberships: (club_id, user_id) 존재 여부
            boolean ok = membershipRepository.existsByUserIdAndClub_Id(userId, targetId);
            if (!ok) {
                throw new IllegalArgumentException("동아리 가입된 사용자만 참여할 수 있습니다.");
            }
        } else if ("EVENT".equals(normalized)) {
            // event_members: (event_id, user_id) 존재 여부
            boolean ok = eventMemberRepository.existsByEvent_IdAndUser_Id(targetId, userId);
            if (!ok) {
                throw new IllegalArgumentException("이벤트 참여 사용자만 입장할 수 있습니다.");
            }
        } else {
            throw new IllegalArgumentException("지원하지 않는 채팅방 타입: " + normalized);
        }

        // 3) 중복 방지
        if (chatMemberRepository.existsByChat_IdAndUser_Id(room.getId(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 채팅방에 참여 중인 사용자입니다.");
        }

        // 4) 저장
        User userRef = userRepository.getReferenceById(userId);
        ChatMember member = ChatMember.builder()
                .chat(room)
                .user(userRef)
                .build();
        chatMemberRepository.save(member);
    }

    public List<ChatRoomListItem> listMyRoomsByClub(Integer userId, Integer clubId) {
        return chatRoomRepository.findMyRoomsInClub(userId, clubId);
    }

    public ChatParticipantsResponse getParticipants(Integer chatId) {
        ChatRoom room = chatRoomRepository.findWithCreatorById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다. (id=" + chatId + ")"));

        // owner
        User ownerUser = room.getCreatedBy();
        ChatMemberItem ownerItem = ChatMemberItem.builder()
                .userId(ownerUser.getId())
                .name(ownerUser.getName()) // 컬럼명이 다르면 변경 (예: nickname)
                .owner(true)
                .build();

        // members (owner=false)
        List<ChatMemberItem> memberItems = chatMemberRepository.findMemberViewsByChatId(chatId).stream()
                .map(v -> ChatMemberItem.builder()
                        .userId(v.getUserId())
                        .name(v.getName())
                        .owner(false)
                        .build())
                .toList();

        // owner + members 합치되, 중복(방장) 제거
        List<ChatMemberItem> participants = new ArrayList<>();
        participants.add(ownerItem);
        participants.addAll(
                memberItems.stream()
                        .filter(m -> !m.getUserId().equals(ownerItem.getUserId()))
                        .toList()
        );

        // ✅ 확정 여부 / 인원수 포함
        boolean confirmed = room.isParticipantsConfirmed();
        Integer confirmedCount = room.getParticipantsConfirmedCount();

        // 방어: DB에 confirmed=true인데 count가 null/음수면 현재 참여자 수로 대체
        if (confirmed && (confirmedCount == null || confirmedCount < 0)) {
            confirmedCount = participants.size();
        }

        return ChatParticipantsResponse.builder()
                .chatId(chatId)
                .participants(participants)
                .confirmed(confirmed)            // ✅ 추가
                .confirmedCount(confirmed ? confirmedCount : null)  // ✅ 추가(미확정이면 null)
                .build();
    }

    @Transactional(readOnly = true)
    public Integer resolveEventIdByChatId(Integer chatId) {
        ChatRoom room = chatRoomRepository.findByIdWithType(chatId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 없습니다. chatId=" + chatId));

        // CodeDetail의 어떤 필드가 코드키인지 확인 필요: 보통 codeName 또는 code
        // 예시는 codeName으로 가정합니다. (다르면 메서드명만 바꿔주세요)
        String typeCode = room.getType() != null ? room.getType().getCodeName() : null;

        // 이벤트 방이 아니면 null 반환
        if (!"EVENT".equals(typeCode)) {
            return null;
        }

        // 이벤트 방이면 targetId가 곧 eventId
        return room.getTargetId();
    }

    /**
     * 채팅방 나가기:
     * 1) chat_members 에서 (chatId, userId) 삭제 (없어도 OK)
     * 2) chatId -> ChatRoom 조회 -> Event 조회
     * 3) event_members 에서 (eventId, userId) 삭제 (없어도 OK)
     */
    @Transactional
    public void leave(Integer chatId, Integer userId) {
        // 1) 채팅 멤버 삭제 (없으면 0건)
        chatMemberRepository.deleteByChat_IdAndUser_Id(chatId, userId);

        // 2) chatId로 이벤트 찾기 (없으면 404)
        ChatRoom chatRoom = chatRoomRepository.findById(chatId)
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다. id=" + chatId));

        if ("EVENT".equals(chatRoom.getType().getCodeName())) {
            Integer eventId = chatRoom.getTargetId();
            if (eventId != null) {
                eventMemberRepository.deleteByEvent_IdAndUser_Id(eventId, userId);
            }
        }
        // event가 연동되지 않은 독립 채팅방이라면 이벤트 멤버 삭제는 생략
    }


    @Transactional
    public void deleteRoom(Integer chatId, Integer currentUserId) {
        ChatRoom room = chatRoomRepository.findById(chatId)
                .orElseThrow(() -> new EntityNotFoundException("채팅방을 찾을 수 없습니다. id=" + chatId));

        // 1. 방 생성자와 현재 사용자 일치 여부 확인
        if (!room.getCreatedBy().getId().equals(currentUserId)) {
            throw new AccessDeniedException("채팅방 삭제 권한이 없습니다.");
        }

        // 2. Cascade + orphanRemoval 로 members, messages 자동 삭제
        chatRoomRepository.delete(room);
    }
}
