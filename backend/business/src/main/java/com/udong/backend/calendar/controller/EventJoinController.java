// src/main/java/com/udong/backend/calendar/controller/EventJoinController.java
package com.udong.backend.calendar.controller;

import com.udong.backend.calendar.dto.EventJoinRes;
import com.udong.backend.calendar.dto.EventParticipantRes;
import com.udong.backend.calendar.service.EventJoinService;
import com.udong.backend.chat.controller.ChatRoomController;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/clubs/{clubId}/events/{eventId}")
public class EventJoinController {

    private final EventJoinService eventJoinService;

    @PostMapping("/join")
    public ResponseEntity<EventJoinRes> join(
            @PathVariable Long clubId,
            @PathVariable Long eventId
    ) {
        return ResponseEntity.ok(eventJoinService.join(clubId, eventId));
    }

//    @DeleteMapping("/join")
//    public ResponseEntity<EventJoinRes> leave(
//            @PathVariable Long clubId,
//            @PathVariable Long eventId
//    ) {
//        return ResponseEntity.ok(eventJoinService.leave(clubId, eventId));
//    }

//    @GetMapping("/participants")
//    public ResponseEntity<List<EventParticipantRes>> participants(
//            @PathVariable Long clubId,
//            @PathVariable Long eventId
//    ) {
//        return ResponseEntity.ok(eventJoinService.list(clubId, eventId));
//    }
}
