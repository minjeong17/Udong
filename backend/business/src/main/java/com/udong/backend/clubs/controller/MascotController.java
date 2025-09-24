package com.udong.backend.clubs.controller;

import com.udong.backend.clubs.dto.MascotCreateReq;
import com.udong.backend.clubs.dto.MascotDtos;
import com.udong.backend.clubs.service.MascotService;
import com.udong.backend.global.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// MascotController.java
@RestController
@RequestMapping("/v1/clubs/{clubId}")
@RequiredArgsConstructor
public class MascotController {

    private final MascotService mascots;

    /** 현재 활성 마스코트 조회 */
    @GetMapping("/mascot")
    public ResponseEntity<ApiResponse<MascotDtos.Res>> active(@PathVariable("clubId") Integer clubId) {
        MascotDtos.Res body = mascots.getActive(clubId);
        return ResponseEntity.ok(ApiResponse.ok(body));  // 없으면 data=null
    }

    /** 마스코트 생성(=reroll) — 바디는 선택적 */
    @PostMapping("/mascot-create")
    public ResponseEntity<ApiResponse<MascotDtos.Res>> create(
            @PathVariable("clubId") Integer clubId,
            @RequestBody(required = false) MascotCreateReq req
    ) {
        var m = mascots.reroll(clubId, req);
        var body = new MascotDtos.Res(m.getId(), m.getClub().getId(), m.getImageUrl(), m.getPromptMeta(), m.getCreatedAt());
        return ResponseEntity.status(201).body(ApiResponse.ok(body));
    }

    /** 마스코트 목록 페이징 조회(최신순) */
    @GetMapping("/mascots")
    public ResponseEntity<ApiResponse<Page<MascotDtos.Res>>> list(
            @PathVariable("clubId") Integer clubId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<MascotDtos.Res> data = mascots.list(clubId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** 특정 마스코트 단건 조회 */
    @GetMapping("/mascots/{mascotId}")
    public ResponseEntity<ApiResponse<MascotDtos.Res>> get(
            @PathVariable("clubId") Integer clubId,
            @PathVariable("mascotId") Integer mascotId
    ) {
        MascotDtos.Res body = mascots.getDto(clubId, mascotId);
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    /** 특정 마스코트를 활성 마스코트로 지정 */
    @PostMapping("/mascots/{mascotId}/activate") // ← 콜론 대신 세그먼트 분리
    public ResponseEntity<ApiResponse<String>> activate(
            @PathVariable("clubId") Integer clubId,
            @PathVariable("mascotId") Integer mascotId
    ) {
        mascots.activate(clubId, mascotId);
        return ResponseEntity.ok(ApiResponse.ok("activated"));
    }
}
