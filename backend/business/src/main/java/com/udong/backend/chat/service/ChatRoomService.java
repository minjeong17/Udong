// com.udong.backend.chat.service.ChatRoomService
package com.udong.backend.chat.service;

import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.entity.ChatMember;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatRoomMemberRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.service.CodeService;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {

    private static final String CODE_GROUP = "chat_room_type"; // code_group.group_name

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;
    private final CodeService codeService;

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

        // 5) 응답
//        return CreateRoomResponse.builder()
//                .roomId(room.getId())
//                .typeCode(type.getCodeName())
//                .targetId(room.getTargetId())
//                .name(room.getName())
//                .build();
    }
}
