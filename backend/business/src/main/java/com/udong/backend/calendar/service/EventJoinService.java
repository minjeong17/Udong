// src/main/java/com/udong/backend/calendar/service/EventJoinService.java
package com.udong.backend.calendar.service;

import com.udong.backend.calendar.authz.EventAuthz;
import com.udong.backend.calendar.dto.EventJoinRes;
import com.udong.backend.calendar.dto.EventParticipantRes;
import com.udong.backend.calendar.entity.Event;
import com.udong.backend.calendar.entity.EventMember;
import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.calendar.repository.EventRepository;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.codes.controller.CodeController;
import com.udong.backend.codes.service.CodeService;
import com.udong.backend.global.util.SecurityUtils;
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
@Transactional
public class EventJoinService {

    private final EventRepository eventRepository;
    private final EventMemberRepository eventMemberRepository;
    private final UserRepository userRepository;
    private final EventAuthz authz;
    private final SecurityUtils securityUtils;
    private final ChatRoomService chatRoomService;

    private Integer currentUserId() {
        return securityUtils.currentUserId();
    }

    private Event requireEvent(Integer clubId, Integer eventId) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "이벤트가 존재하지 않습니다."));
        if (!e.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clubId 불일치");
        }
        return e;
    }

    /** 참여 신청 */
    public EventJoinRes join(Long rawClubId, Long rawEventId) {
        Integer userId = currentUserId();
        Integer clubId = Math.toIntExact(rawClubId);
        Integer eventId = Math.toIntExact(rawEventId);

        // 클럽 회원만
        if (!authz.canView(rawClubId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 동아리 회원만 참여할 수 있습니다.");
        }

        Event event = requireEvent(clubId, eventId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // 이미 row가 있으면 participated=true 로
        EventMember em = eventMemberRepository.findByEvent_IdAndUser_Id(eventId, userId)
                .orElseGet(() -> EventMember.builder()
                        .event(event)
                        .user(user)
                        .isParticipated(false)
                        .build());

        // 정원 체크 (동시성 고려해서 락 버전 추천)
        long attendees = eventMemberRepository.lockAndCountParticipated(eventId);
        Short capacity = event.getCapacity();
        if (capacity != null && attendees >= capacity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "정원이 가득 찼습니다.");
        }

        em.setParticipated(true);
        EventMember saved = eventMemberRepository.save(em);

        int nowAttendees = eventMemberRepository.countByEvent_IdAndIsParticipatedTrue(eventId);

        chatRoomService.addMember("EVENT", eventId, userId);

        return EventJoinRes.builder()
                .eventId(eventId)
                .userId(userId)
                .participated(true)
                .attendees(nowAttendees)
                .capacity(capacity)
                .joinedAt(saved.getJoinedAt())
                .build();
    }

    /** 참여 취소 */
    public EventJoinRes leave(Long rawClubId, Long rawEventId) {
        Integer userId = currentUserId();
        Integer clubId = Math.toIntExact(rawClubId);
        Integer eventId = Math.toIntExact(rawEventId);

        if (!authz.canView(rawClubId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 동아리 회원만 가능합니다.");
        }

        requireEvent(clubId, eventId);

        EventMember em = eventMemberRepository.findByEvent_IdAndUser_Id(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "참여 이력이 없습니다."));

        em.setParticipated(false);
        eventMemberRepository.save(em);

        int nowAttendees = eventMemberRepository.countByEvent_IdAndIsParticipatedTrue(eventId);

        return EventJoinRes.builder()
                .eventId(eventId)
                .userId(userId)
                .participated(false)
                .attendees(nowAttendees)
                .capacity(em.getEvent().getCapacity())
                .joinedAt(em.getJoinedAt())
                .build();
    }

    /** 참여자 목록 */
    @Transactional(readOnly = true)
    public List<EventParticipantRes> list(Long rawClubId, Long rawEventId) {
        Integer userId = currentUserId();
        Integer clubId = Math.toIntExact(rawClubId);
        Integer eventId = Math.toIntExact(rawEventId);

        if (!authz.canView(rawClubId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 동아리 회원만 조회할 수 있습니다.");
        }

        requireEvent(clubId, eventId);

        return eventMemberRepository.findAllWithUserByEventId(eventId).stream()
                .map(em -> EventParticipantRes.builder()
                        .userId(em.getUser().getId())
                        .participated(em.isParticipated())
                        .joinedAt(em.getJoinedAt())
                        .build())
                .toList();
    }
}
