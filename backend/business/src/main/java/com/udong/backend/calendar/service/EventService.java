package com.udong.backend.calendar.service;

import com.udong.backend.calendar.authz.EventAuthz;
import com.udong.backend.calendar.dto.EventCreateReq;
import com.udong.backend.calendar.dto.EventListItemRes;
import com.udong.backend.calendar.dto.EventRes;
import com.udong.backend.calendar.dto.EventUpdateReq;
import com.udong.backend.calendar.entity.Event;
import com.udong.backend.calendar.entity.EventMember;
import com.udong.backend.calendar.repository.EventMemberRepository;
import com.udong.backend.calendar.repository.EventRepository;
import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.codes.repository.CodeDetailRepository;
import com.udong.backend.notification.dto.NotificationRequest;
import com.udong.backend.notification.service.NotificationService;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository events;
    private final CodeDetailRepository codes;
    private final EventAuthz authz;
    private final SecurityUtils securityUtils;
    private final ChatRoomService chatRoomService;

    // 추가: 연관관계 주입을 위해
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final EventMemberRepository eventMemberRepository;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;

    private Integer currentUserId() {
        return securityUtils.currentUserId();
    }

    /** 조회 전 공통 가드: 해당 클럽 '회원'만 통과 */
    private void requireClubMember(Long rawClubId, Integer userId) {
        if (!authz.canView(rawClubId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 동아리 회원만 조회할 수 있습니다.");
        }
    }

    @Transactional(readOnly = true)
    public EventRes getOne(Long rawClubId, Long rawEventId) {
        requireClubMember(rawClubId, currentUserId());

        Integer eventId = Math.toIntExact(rawEventId);
        Event e = events.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // clubId 불일치 보호
        if (!e.getClub().getId().equals(Math.toIntExact(rawClubId))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clubId 불일치");
        }
        return toRes(e);
    }

    public EventRes create(Long rawClubId, EventCreateReq req) {
        Integer userId = currentUserId();

        // 1) 타입 검증 (공통코드)
        codes.findByCodeGroup_GroupNameAndCodeNameAndIsUseTrue("events", req.getType())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid event type"));

        // 2) 권한 체크
        if (!authz.canCreate(rawClubId, userId, req.getType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }

        // 3) 연관관계 엔티티 로딩
        Integer clubId = Math.toIntExact(rawClubId);
        var club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // 4) 저장
        Event e = new Event();
        e.setClub(club);                // ✅ 연관관계 주입
        e.setCreatedBy(user);           // ✅ 연관관계 주입
        e.setTitle(req.getTitle());
        e.setContent(req.getContent());
        e.setPlace(req.getPlace());
        e.setCapacity(req.getCapacity());
        e.setExpectedCost(req.getExpectedCost());
        e.setStartAt(req.getStartAt());
        e.setEndAt(req.getEndAt());
        e.setType(req.getType());

        Event saved = events.save(e);

        // 이미 row가 있으면 participated=true 로
        EventMember em = eventMemberRepository.findByEvent_IdAndUser_Id(saved.getId(), userId)
                .orElseGet(() -> EventMember.builder()
                        .event(saved)
                        .user(user)
                        .isParticipated(false)
                        .build());

        // 정원 체크 (동시성 고려해서 락 버전 추천)
        long attendees = eventMemberRepository.lockAndCountParticipated(saved.getId());
        Short capacity = saved.getCapacity();
        if (capacity != null && attendees >= capacity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "정원이 가득 찼습니다.");
        }

        em.setParticipated(true);
        eventMemberRepository.save(em);

        CreateRoomRequest chatReq = new CreateRoomRequest("EVENT", saved.getId(), saved.getTitle());

        chatRoomService.create(userId, chatReq);

        // 행사 생성 알림 발송
        try {
            // 클럽 멤버들의 ID 수집
            List<Long> clubMemberIds = membershipRepository.findUserIdsByClubId(clubId);

            // 생성자는 알림 대상에서 제외 (본인이 만든 행사에 알림 받을 필요 없음)
            clubMemberIds = clubMemberIds.stream()
                    .filter(memberId -> !memberId.equals(userId.longValue()))
                    .collect(Collectors.toList());

            if (!clubMemberIds.isEmpty()) {
                NotificationRequest notificationRequest = NotificationRequest.builder()
                        .payload("새로운 행사가 등록되었습니다: [" + saved.getTitle() + "]")
                        .type("EVENT_OPEN")
                        .targetId(saved.getId().longValue())
                        .createdBy(userId.longValue())
                        .clubId(rawClubId)
                        .recipientUserIds(clubMemberIds)
                        .build();

                notificationService.createAndSendNotification(notificationRequest);
            }
        } catch (Exception err) {
            // 알림 발송 실패는 행사 생성 자체를 실패시키지 않음 (로그만 기록)
            System.err.println("행사 생성 알림 발송 실패: " + err.getMessage());
        }

        return toRes(saved);
    }

    @Transactional(readOnly = true)
    public List<EventListItemRes> getMonth(Long rawClubId, int year, int month) {
        Integer clubId = Math.toIntExact(rawClubId);
        LocalDate first = LocalDate.of(year, month, 1);
        LocalDateTime start = first.atStartOfDay();
        LocalDateTime end = first.plusMonths(1).atStartOfDay();

        return events.findMonth(clubId, start, end).stream()
                .map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public List<EventListItemRes> getDay(Long rawClubId, LocalDate date) {
        Integer clubId = Math.toIntExact(rawClubId);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        return events.findDay(clubId, start, end).stream()
                .map(this::toListItem).toList();
    }

    public EventRes update(Long rawClubId, Long rawEventId, EventUpdateReq req) {
        Integer clubId = Math.toIntExact(rawClubId);
        Integer eventId = Math.toIntExact(rawEventId);
        Integer userId = currentUserId();

        Event e = events.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 🔒 URL의 clubId와 이벤트 소속 clubId가 같은지 확인
        if (!e.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clubId 불일치");
        }

        // 🔒 작성자만 수정
        if (!authz.canEdit(e, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "수정 권한이 없습니다.");
        }

        // 업데이트
        e.setTitle(req.getTitle());
        e.setContent(req.getContent());
        e.setPlace(req.getPlace());
        e.setCapacity(req.getCapacity() == null ? null : req.getCapacity().shortValue()); // (앞서 고친 부분 유지)
        e.setExpectedCost(req.getExpectedCost());
        e.setStartAt(req.getStartAt());
        e.setEndAt(req.getEndAt());

        return toRes(e);
    }

    public void delete(Long rawClubId, Long rawEventId) {
        Integer clubId = Math.toIntExact(rawClubId);
        Integer eventId = Math.toIntExact(rawEventId);
        Integer userId = currentUserId();

        Event e = events.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 소속 검증
        if (!e.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clubId 불일치");
        }
        if (!authz.canEdit(e, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "삭제 권한이 없습니다.");
        }
        events.delete(e);
    }

    @Transactional(readOnly = true)
    public List<EventListItemRes> getUpcoming(Long rawClubId, LocalDateTime now, int limit) {
        Integer clubId = Math.toIntExact(rawClubId);
        return events.findUpcoming(clubId, now, PageRequest.of(0, limit))
                .map(this::toListItem)
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<EventListItemRes> getOngoing(Long rawClubId) {
        Integer userId = currentUserId();
        requireClubMember(rawClubId, userId);

        Integer clubId = Math.toIntExact(rawClubId);
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

        return events.findMyOngoingEvents(clubId, userId, todayStart).stream()
                .map(this::toListItem)
                .toList();
    }

    // mappers
    private EventListItemRes toListItem(Event e) {
        return EventListItemRes.builder()
                .id(e.getId())
                .title(e.getTitle())
                .place(e.getPlace())
                .startAt(e.getStartAt())
                .endAt(e.getEndAt())
                .type(e.getType())
                .build();
    }
    private EventRes toRes(Event e) {
        return EventRes.builder()
                .id(e.getId())
                .title(e.getTitle())
                .content(e.getContent())
                .place(e.getPlace())
                .capacity(e.getCapacity())
                .expectedCost(e.getExpectedCost())
                .startAt(e.getStartAt())
                .endAt(e.getEndAt())
                .type(e.getType())
                .createdBy(e.getCreatedBy() != null ? e.getCreatedBy().getId() : null)
                .build();
    }
}
