package com.udong.backend.calendar.controller;

import com.udong.backend.calendar.dto.*;
import com.udong.backend.calendar.entity.ConfirmParticipantsRequest;
import com.udong.backend.calendar.service.EventMemberService;
import com.udong.backend.calendar.service.EventService;
import com.udong.backend.chat.dto.ChatParticipantsResponse;
import com.udong.backend.global.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/v1/clubs/{clubId}/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService service;
    private final EventMemberService eventMemberService;

    // 일정 등록
    @PostMapping
    public ApiResponse<EventRes> create(@PathVariable Long clubId,
                                        @Valid @RequestBody EventCreateReq req) {
        return ApiResponse.ok(service.create(clubId, req));
    }

    // 달별 목록 (type 파라미터 없음! 전체 조회)
    @GetMapping("/month")
    public ApiResponse<List<EventListItemRes>> month(
            @PathVariable Long clubId,
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.ok(service.getMonth(clubId, year, month));
    }

    // 일별 목록 (전체 조회)
    @GetMapping("/day")
    public ApiResponse<List<EventListItemRes>> day(
            @PathVariable Long clubId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(service.getDay(clubId, date));
    }

    // 일정 수정
    @PutMapping("/{eventId}")
    public ApiResponse<EventRes> update(@PathVariable Long clubId,
                                        @PathVariable Long eventId,
                                        @Valid @RequestBody EventUpdateReq req) {
        // clubId는 서비스에서 소유 검증에 사용 가능 (여기선 생략)
        return ApiResponse.ok(service.update(clubId, eventId, req));
    }

    // 일정 삭제
    @DeleteMapping("/{eventId}")
    public ApiResponse<Void> delete(@PathVariable Long clubId,
                                    @PathVariable Long eventId) {
        service.delete(clubId, eventId);
        return ApiResponse.ok(null);
    }

    // D-day 조회: now 이후 다가오는 일정 TOP N
    @GetMapping("/dday")
    public ApiResponse<List<EventListItemRes>> dday(@PathVariable Long clubId,
                                                    @RequestParam(required = false)
                                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime now,
                                                    @RequestParam(defaultValue = "3") int limit) {

        LocalDateTime base = (now != null) ? now : LocalDateTime.now();
        return ApiResponse.ok(service.getUpcoming(clubId, base, limit));
    }

    // 진행 중인 모임 조회: 현재 시간이 startAt과 endAt 사이인 이벤트들
    @GetMapping("/ongoing")
    public ApiResponse<List<EventListItemRes>> ongoing(@PathVariable Long clubId) {
        return ApiResponse.ok(service.getOngoing(clubId));
    }

    @GetMapping("/{eventId}")
    public ApiResponse<EventRes> getOne(@PathVariable Long clubId,
                                        @PathVariable Long eventId) {
        return ApiResponse.ok(service.getOne(clubId, eventId));
    }

    @PutMapping("/chats/{chatId}/participants/confirm")
    public ResponseEntity<ApiResponse<?>> confirmParticipantsByChatId(
            @PathVariable Integer clubId,
            @PathVariable Integer chatId,
            @RequestBody ConfirmParticipantsRequest req
    ) {

        ChatParticipantsResponse dto = eventMemberService.confirmParticipantsByChatId(chatId, req.getUserIds());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

}

