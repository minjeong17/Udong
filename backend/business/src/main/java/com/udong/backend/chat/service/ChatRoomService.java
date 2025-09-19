package com.udong.backend.chat.service;

import com.udong.backend.chat.dto.ChatRoomListItem;
import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.entity.ChatMember;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatRoomMemberRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.service.CodeService;
import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {

    private static final String CODE_GROUP = "chats"; // code_group.group_name

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
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
        if (!chatRoomMemberRepository.existsByChat_IdAndUser_Id(room.getId(), creatorUserId)) {
            chatRoomMemberRepository.save(ChatMember.builder()
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
            boolean ok = membershipRepository.existsByClub_IdAndUserId(targetId, userId);
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
        if (chatRoomMemberRepository.existsByChat_IdAndUser_Id(room.getId(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 채팅방에 참여 중인 사용자입니다.");
        }

        // 4) 저장
        User userRef = userRepository.getReferenceById(userId);
        ChatMember member = ChatMember.builder()
                .chat(room)
                .user(userRef)
                .build();
        chatRoomMemberRepository.save(member);
    }

    public List<ChatRoomListItem> listMyRoomsByClub(Integer userId, Integer clubId) {
        return chatRoomRepository.findMyRoomsInClub(userId, clubId);
    }

}
