package com.udong.backend.calendar.service;

import com.udong.backend.calendar.authz.EventAuthz;
import com.udong.backend.calendar.dto.EventCreateReq;
import com.udong.backend.calendar.dto.EventListItemRes;
import com.udong.backend.calendar.dto.EventRes;
import com.udong.backend.calendar.dto.EventUpdateReq;
import com.udong.backend.calendar.entity.Event;
import com.udong.backend.calendar.repository.EventRepository;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.codes.repository.CodeDetailRepository;
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

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository events;
    private final CodeDetailRepository codes;
    private final EventAuthz authz;
    private final SecurityUtils securityUtils;

    // 추가: 연관관계 주입을 위해
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;

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
