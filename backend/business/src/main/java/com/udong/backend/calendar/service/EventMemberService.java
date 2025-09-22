package com.udong.backend.calendar.service;

import com.udong.backend.calendar.entity.Event;
import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.calendar.repository.EventRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventMemberService {

    private final EventRepository eventRepository;
    private final EventMemberRepository eventMemberRepository;
    private final ChatRoomService chatRoomService;

    @Transactional
    public void confirmParticipantsByChatId(Integer chatId, List<Integer> userIds) {
        // 1) chatId -> eventId 해석
        Integer eventId = chatRoomService.resolveEventIdByChatId(chatId);
        // 또는 chatRoomRepository에서 직접 조회하는 방식(아래 3번 참고)

        if (eventId == null) {
            throw new IllegalArgumentException("이 채팅방은 이벤트 채팅방이 아닙니다. chatId=" + chatId);
        }

        // 2) 기존 이벤트 기준 확정 로직 재사용
        confirmParticipants(eventId, userIds);
    }

    @Transactional
    public void confirmParticipants(Integer eventId, List<Integer> userIds) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("이벤트가 존재하지 않습니다. id=" + eventId));

        // 전체 false
        eventMemberRepository.markAllFalseByEventId(eventId);

        // 선택된 사람만 true
        if (userIds != null && !userIds.isEmpty()) {
            eventMemberRepository.markTrueByEventIdAndUserIds(eventId, userIds);
        }
    }

}
