package com.udong.backend.chat.service;

import com.udong.backend.chat.dto.ChatMessageDto;
import com.udong.backend.chat.entity.ChatMessage;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatMessageRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    // 메시지 저장
    @Transactional
    public ChatMessage saveMessage(Integer roomId, Integer userId, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        ChatMessage message = ChatMessage.builder()
                .chat(room)
                .sender(user)
                .content(content)
                .build();

        return chatMessageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentMessages(Integer roomId, int limit) {
        var page = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "id"));
        var listDesc = chatMessageRepository.findRecentDtos(roomId, page);

        // 프론트가 위에서 아래로 보이게 하려면 ASC로 뒤집어서 리턴
        Collections.reverse(listDesc);
        return listDesc;
    }
}
