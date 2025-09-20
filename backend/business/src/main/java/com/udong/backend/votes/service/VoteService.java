package com.udong.backend.votes.service;

import com.udong.backend.chat.entity.ChatRoom;
import com.udong.backend.chat.repository.ChatRoomMemberRepository;
import com.udong.backend.chat.repository.ChatRoomRepository;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;
import com.udong.backend.votes.dto.*;
import com.udong.backend.votes.entity.Vote;
import com.udong.backend.votes.entity.VoteOption;
import com.udong.backend.votes.entity.VoteSelection;
import com.udong.backend.votes.repository.VoteOptionRepository;
import com.udong.backend.votes.repository.VoteRepository;
import com.udong.backend.votes.repository.VoteSelectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoteService {

    private final VoteRepository voteRepository;
    private final VoteOptionRepository voteOptionRepository;
    private final VoteSelectionRepository voteSelectionRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatMemberRepository;
    private final UserRepository userRepository;

    /**
     * 채팅방의 투표 목록 조회
     */
    public List<VoteListResponse> getVoteList(Integer chatRoomId, Integer currentUserId) {
        // 채팅방 존재 확인
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        // 채팅방 멤버인지 확인
        validateChatMember(chatRoomId, currentUserId);

        List<Vote> votes = voteRepository.findByChatRoomIdOrderByCreatedAtDesc(chatRoomId);
        LocalDateTime now = LocalDateTime.now();

        return votes.stream()
                .map(vote -> {
                    // 생성자 정보 조회
                    User creator = userRepository.findById(vote.getCreatedBy()).orElse(null);
                    String creatorName = creator != null ? creator.getName() : "알 수 없음";

                    // 참여 여부 확인
                    boolean hasParticipated = voteSelectionRepository.existsByVoteIdAndUserId(vote.getId(), currentUserId);

                    // 총 참여자 수
                    Long totalParticipants = voteSelectionRepository.countDistinctUsersByVoteId(vote.getId());

                    return VoteListResponse.builder()
                            .id(vote.getId())
                            .title(vote.getTitle())
                            .endsAt(vote.getEndsAt())
                            .multiSelect(vote.isMultiSelect())
                            .isActive(vote.isActive())
                            .createdAt(vote.getCreatedAt())
                            .createdBy(vote.getCreatedBy())
                            .createdByName(creatorName)
                            .isExpired(vote.getEndsAt().isBefore(now))
                            .canParticipate(vote.isActive() && !vote.getEndsAt().isBefore(now))
                            .hasParticipated(hasParticipated)
                            .totalParticipants(totalParticipants)
                            .optionCount(vote.getOptions().size())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 투표 상세 조회
     */
    public VoteResponse getVoteDetail(Integer voteId, Integer currentUserId) {
        Vote vote = voteRepository.findByIdWithOptions(voteId)
                .orElseThrow(() -> new IllegalArgumentException("투표를 찾을 수 없습니다."));

        // 채팅방 멤버인지 확인
        validateChatMember(vote.getChatRoom().getId(), currentUserId);

        // 생성자 정보
        User creator = userRepository.findById(vote.getCreatedBy()).orElse(null);
        String creatorName = creator != null ? creator.getName() : "알 수 없음";

        // 현재 사용자의 선택 정보 - myVoteCount 포함으로 수정
        List<VoteSelection> userSelections = voteSelectionRepository.findByVoteIdAndUserId(voteId, currentUserId);
        Map<Integer, Integer> userSelectedOptionsWithCount = userSelections.stream()
                .collect(Collectors.toMap(
                        selection -> selection.getVoteOption().getId(),
                        selection -> selection.getOptionCount()
                ));

        // 총 참여자 수
        Long totalParticipants = voteSelectionRepository.countDistinctUsersByVoteId(voteId);

        // 채팅방 전체 멤버 수 (화면에 필요한 정보)
        Long totalChatMembers = chatMemberRepository.countByChatId(vote.getChatRoom().getId());

        // 참여율 계산
        Double participationRate = totalChatMembers > 0 ?
                (totalParticipants * 100.0 / totalChatMembers) : 0.0;

        // 옵션별 투표 정보
        List<VoteOptionWithCount> optionsWithCount = voteOptionRepository.findOptionsWithVoteCount(voteId);
        Long totalVotes = optionsWithCount.stream()
                .mapToLong(VoteOptionWithCount::getVoteCount)
                .sum();

        List<VoteResponse.VoteOptionResponse> optionResponses = optionsWithCount.stream()
                .map(optionWithCount -> {
                    VoteOption option = optionWithCount.getVoteOption();
                    Long voteCount = optionWithCount.getVoteCount();
                    Double percentage = totalVotes > 0 ? (voteCount * 100.0 / totalVotes) : 0.0;

                    return VoteResponse.VoteOptionResponse.builder()
                            .id(option.getId())
                            .text(option.getText())
                            .voteCount(voteCount)
                            .percentage(Math.round(percentage * 10) / 10.0)
                            .isSelected(userSelectedOptionsWithCount.containsKey(option.getId()))
                            .myVoteCount(userSelectedOptionsWithCount.getOrDefault(option.getId(), 0))
                            .build();
                })
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();

        return VoteResponse.builder()
                .id(vote.getId())
                .title(vote.getTitle())
                .description(vote.getDescription())
                .endsAt(vote.getEndsAt())
                .multiSelect(vote.isMultiSelect())
                .isActive(vote.isActive())
                .createdAt(vote.getCreatedAt())
                .createdBy(vote.getCreatedBy())
                .createdByName(creatorName)
                .chatRoomId(vote.getChatRoom().getId())
                .chatRoomName(vote.getChatRoom().getName())
                .isExpired(vote.getEndsAt().isBefore(now))
                .canParticipate(vote.isActive() && !vote.getEndsAt().isBefore(now))
                .hasParticipated(!userSelections.isEmpty())
                .totalParticipants(totalParticipants)
                .totalChatMembers(totalChatMembers)
                .participationRate(Math.round(participationRate * 10) / 10.0)
                .totalVotes(totalVotes)
                .options(optionResponses)
                .build();
    }

    /**
     * 투표 생성
     */
    @Transactional
    public VoteResponse createVote(Integer chatRoomId, VoteCreateRequest request, Integer currentUserId) {
        // 채팅방 존재 확인 및 멤버 확인
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        validateChatMember(chatRoomId, currentUserId);

        // 투표 엔티티 생성
        Vote vote = Vote.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .endsAt(request.getEndsAt())
                .multiSelect(request.getMultiSelect())
                .chatRoom(chatRoom)
                .createdBy(currentUserId)
                .options(new ArrayList<>())
                .build();

        Vote savedVote = voteRepository.save(vote);

        // 투표 옵션 생성
        List<VoteOption> options = request.getOptions().stream()
                .map(optionRequest -> VoteOption.builder()
                        .text(optionRequest.getText())
                        .vote(savedVote)
                        .build())
                .collect(Collectors.toList());

        voteOptionRepository.saveAll(options);
        savedVote.getOptions().addAll(options);

        // 생성자 정보
        User creator = userRepository.findById(currentUserId).orElse(null);
        String creatorName = creator != null ? creator.getName() : "알 수 없음";
        Long totalChatMembers = chatMemberRepository.countByChatId(chatRoom.getId());

        // 응답 생성
        List<VoteResponse.VoteOptionResponse> optionResponses = options.stream()
                .map(option -> VoteResponse.VoteOptionResponse.builder()
                        .id(option.getId())
                        .text(option.getText())
                        .voteCount(0L)
                        .percentage(0.0)
                        .isSelected(false)
                        .myVoteCount(0) // 추가
                        .build())
                .collect(Collectors.toList());

        return VoteResponse.builder()
                .id(savedVote.getId())
                .title(savedVote.getTitle())
                .description(savedVote.getDescription())
                .endsAt(savedVote.getEndsAt())
                .multiSelect(savedVote.isMultiSelect())
                .isActive(vote.isActive())
                .createdAt(savedVote.getCreatedAt())
                .createdBy(savedVote.getCreatedBy())
                .createdByName(creatorName)
                .chatRoomId(chatRoom.getId())
                .chatRoomName(chatRoom.getName())
                .isExpired(false)
                .canParticipate(true)
                .hasParticipated(false)
                .totalParticipants(0L)
                .totalChatMembers(totalChatMembers) // 추가
                .participationRate(0.0) // 추가
                .totalVotes(0L) // 추가
                .options(optionResponses)
                .build();
    }

    /**
     * 투표 참여 - 재투표 불가 버전
     */
    @Transactional
    public VoteResponse participateVote(Integer voteId, VoteParticipateRequest request, Integer currentUserId) {
        Vote vote = voteRepository.findByIdWithOptions(voteId)
                .orElseThrow(() -> new IllegalArgumentException("투표를 찾을 수 없습니다."));

        validateChatMember(vote.getChatRoom().getId(), currentUserId);
        validateVoteParticipation(vote, currentUserId, request);

        // 재투표 불가 체크
        boolean hasAlreadyParticipated = voteSelectionRepository.existsByVoteIdAndUserId(voteId, currentUserId);
        if (hasAlreadyParticipated) {
            throw new IllegalArgumentException("이미 참여한 투표입니다. 재투표는 불가능합니다.");
        }

        List<VoteSelection> newSelections = request.getSelections().stream()
                .map(selectionRequest -> {
                    VoteOption voteOption = vote.getOptions().stream()
                            .filter(option -> option.getId().equals(selectionRequest.getVoteOptionId()))
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 투표 옵션입니다."));

                    return VoteSelection.builder()
                            .userId(currentUserId)
                            .optionCount(selectionRequest.getOptionCount())
                            .vote(vote)
                            .voteOption(voteOption)
                            .build();
                })
                .collect(Collectors.toList());

        voteSelectionRepository.saveAll(newSelections);
        return getVoteDetail(voteId, currentUserId);
    }


    /**
     * 투표 비활성화 (조기 마감)
     */
    @Transactional
    public VoteResponse deactivateVote(Integer voteId, Integer currentUserId) {
        Vote vote = voteRepository.findById(voteId)
                .orElseThrow(() -> new IllegalArgumentException("투표를 찾을 수 없습니다."));

        if (!vote.getCreatedBy().equals(currentUserId)) {
            throw new IllegalArgumentException("투표를 비활성화할 권한이 없습니다.");
        }

        if (!vote.isActive()) {
            throw new IllegalArgumentException("이미 비활성화된 투표입니다.");
        }

        vote.setActive(false);
        voteRepository.save(vote);

        return getVoteDetail(voteId, currentUserId);
    }

    /**
     * 투표 삭제
     */
    @Transactional
    public void deleteVote(Integer voteId, Integer currentUserId) {
        Vote vote = voteRepository.findById(voteId)
                .orElseThrow(() -> new IllegalArgumentException("투표를 찾을 수 없습니다."));

        // 권한 확인 (투표 생성자만)
        if (!vote.getCreatedBy().equals(currentUserId)) {
            throw new IllegalArgumentException("투표를 삭제할 권한이 없습니다.");
        }

        voteRepository.delete(vote);
    }

    // === 유틸리티 메서드 ===

    private void validateChatMember(Integer chatRoomId, Integer userId) {
        if (!chatMemberRepository.existsByChat_IdAndUser_Id(chatRoomId, userId)) {
            throw new IllegalArgumentException("채팅방 멤버가 아닙니다.");
        }
    }

    private void validateVoteParticipation(Vote vote, Integer userId, VoteParticipateRequest request) {
        // 활성화 상태 확인 추가
        if (!vote.isActive()) {
            throw new IllegalArgumentException("비활성화된 투표입니다.");
        }

        // 마감 시간 확인
        if (vote.getEndsAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("마감된 투표입니다.");
        }

        // 다중 선택 여부 확인
        if (!vote.isMultiSelect() && request.getSelections().size() > 1) {
            throw new IllegalArgumentException("단일 선택 투표에서는 하나의 옵션만 선택할 수 있습니다.");
        }

        // 투표 옵션 유효성 검증
        List<Integer> voteOptionIds = vote.getOptions().stream()
                .map(VoteOption::getId)
                .toList();

        for (VoteParticipateRequest.VoteSelectionRequest selection : request.getSelections()) {
            if (!voteOptionIds.contains(selection.getVoteOptionId())) {
                throw new IllegalArgumentException("유효하지 않은 투표 옵션입니다.");
            }
        }
    }
}
