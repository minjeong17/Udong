package com.udong.backend.votes.controller;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.global.util.SecurityUtils;
import com.udong.backend.votes.dto.*;
import com.udong.backend.votes.service.VoteService;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;
    private final SecurityUtils securityUtils;

    /**
     * 동아리의 투표 목록 조회
     */
    @GetMapping("/clubs/{clubId}/votes")
    public ResponseEntity<ApiResponse<List<VoteListResponse>>> getVoteListByClub(
            @Parameter(description = "동아리 ID", required = true)
            @PathVariable Integer clubId) {

        Integer userId = securityUtils.currentUserId();
        List<VoteListResponse> votes = voteService.getVoteListByClub(clubId, userId);

        return ResponseEntity.ok(ApiResponse.ok(votes));
    }

    /**
     * 투표 상세 조회
     */
    @GetMapping("/votes/{voteId}")
    public ResponseEntity<ApiResponse<VoteResponse>> getVoteDetail(
            @Parameter(description = "투표 ID", required = true)
            @PathVariable Integer voteId) {

        Integer userId = securityUtils.currentUserId();
        VoteResponse vote = voteService.getVoteDetail(voteId, userId);

        return ResponseEntity.ok(ApiResponse.ok(vote));
    }

    /**
     * 투표 생성
     */
    @PostMapping("/chat-rooms/{chatRoomId}/votes")
    public ResponseEntity<ApiResponse<VoteResponse>> createVote(
            @Parameter(description = "채팅방 ID", required = true)
            @PathVariable Integer chatRoomId,
            @Valid @RequestBody VoteCreateRequest request) {

        Integer userId = securityUtils.currentUserId();
        VoteResponse vote = voteService.createVote(chatRoomId, request, userId);

        System.out.println(userId);

        return ResponseEntity.ok(ApiResponse.ok(vote));
    }

    /**
     * 투표 참여
     */
    @PostMapping("/votes/{voteId}/participate")
    public ResponseEntity<ApiResponse<VoteResponse>> participateVote(
            @Parameter(description = "투표 ID", required = true)
            @PathVariable Integer voteId,
            @Valid @RequestBody VoteParticipateRequest request) {

        Integer userId = securityUtils.currentUserId();
        VoteResponse vote = voteService.participateVote(voteId, request, userId);

        return ResponseEntity.ok(ApiResponse.ok(vote));
    }

    /**
     * 투표 조기 마감
     */
    @PatchMapping("/votes/{voteId}/close")
    public ResponseEntity<ApiResponse<VoteResponse>> closeVote(
            @Parameter(description = "투표 ID", required = true)
            @PathVariable Integer voteId) {

        Integer userId = securityUtils.currentUserId();
        VoteResponse vote = voteService.deactivateVote(voteId, userId);

        return ResponseEntity.ok(ApiResponse.ok(vote));
    }

    /**
     * 투표 삭제
     */
    @DeleteMapping("/votes/{voteId}")
    public ResponseEntity<ApiResponse<Void>> deleteVote(
            @Parameter(description = "투표 ID", required = true)
            @PathVariable Integer voteId) {

        Integer userId = securityUtils.currentUserId();
        voteService.deleteVote(voteId, userId);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * 예외 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(),e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneralException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(),"서버 오류가 발생했습니다."));
    }

}
