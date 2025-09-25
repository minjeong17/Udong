package com.udong.backend.shop.service;

import java.util.List;
import java.util.Optional;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.repository.ClubRepository;
import org.springframework.stereotype.Service;

import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.entity.UserPointLedger;
import com.udong.backend.shop.entity.ClubPointsLedger;
import com.udong.backend.shop.entity.Item;
import com.udong.backend.shop.repository.PointRepository;
import com.udong.backend.shop.repository.ClubPointsLedgerRepository;
import com.udong.backend.shop.repository.ItemRepository;
import com.udong.backend.shop.service.InventoryService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointService {
	
	private final PointRepository pointRepository;
    private final ClubRepository clubRepository;
    private final ClubPointsLedgerRepository clubPointsLedgerRepository;
    private final ItemRepository itemRepository;
    private final InventoryService inventoryService;
	
	public Optional<UserPointLedger> getLatest(Integer userId, Integer clubId) {
		return pointRepository.findTopByUserIdAndClubIdOrderByCreatedAtDesc(userId, clubId);
	}

	public List<UserPointLedger> getLedgers(Integer userId, Integer clubId) {
        return pointRepository.findByUserIdAndClubId(userId, clubId);
    }

    @Transactional
    public UserPointLedger addPoints(Integer userId, UserPointLedgerRequest req) {
        if (req.getDelta() <= 0) {
            throw new IllegalArgumentException("증가 포인트는 0보다 커야 합니다.");
        }

        Integer currPoint = pointRepository.findTopByUserIdAndClubIdOrderByCreatedAtDesc(userId, req.getClubId())
                .map(UserPointLedger::getCurrPoint)
                .orElse(0);

        int newPoint = currPoint + req.getDelta();

        UserPointLedger ledger = UserPointLedger.builder()
                .userId(userId)
                .clubId(req.getClubId())
                .delta(req.getDelta())
                .currPoint(newPoint)
                .codeName(req.getCodeName())
                .memo(req.getMemo())
                .build();

        // 동아리 포인트도 함께 증가
        ClubPointsLedger clubPointsLedger = clubPointsLedgerRepository.findByClubId(req.getClubId().longValue())
                .orElseGet(() -> {
                    // 동아리 포인트 장부가 없으면 새로 생성
                    ClubPointsLedger newClubLedger = ClubPointsLedger.createZero(req.getClubId().longValue());
                    return clubPointsLedgerRepository.save(newClubLedger);
                });

        int previousPoints = clubPointsLedger.getPoint();
        clubPointsLedger.addPoints(req.getDelta());
        int newPoints = clubPointsLedger.getPoint();

        // 1000의 자리가 변했는지 확인
        int previousThousand = previousPoints / 1000;
        int newThousand = newPoints / 1000;

        if (newThousand > previousThousand) {
            // 마스코트 리롤권 지급
            giveRerollTicketToLeader(req.getClubId());
        }

        clubPointsLedgerRepository.save(clubPointsLedger);

        return pointRepository.save(ledger);
    }

    @Transactional
    public UserPointLedger usePoints(Integer userId, UserPointLedgerRequest req) {
        if (req.getDelta() <= 0) {
            throw new IllegalArgumentException("차감 포인트는 0보다 커야 합니다.");
        }

        Integer currPoint = pointRepository.findTopByUserIdAndClubIdOrderByCreatedAtDesc(userId, req.getClubId())
                .map(UserPointLedger::getCurrPoint)
                .orElse(0);

        if (currPoint < req.getDelta()) {
            throw new RuntimeException("포인트가 부족합니다.");
        }

        int newPoint = currPoint - req.getDelta();

        UserPointLedger ledger = UserPointLedger.builder()
                .userId(userId)
                .clubId(req.getClubId())
                .delta(-req.getDelta())
                .currPoint(newPoint)
                .codeName(req.getCodeName())
                .memo(req.getMemo())
                .build();

        return pointRepository.save(ledger);
    }

    public Integer getClubPoints(Long clubId) {
        return clubPointsLedgerRepository.findByClubId(clubId)
                .map(ClubPointsLedger::getPoint)
                .orElse(0);
    }

    private void giveRerollTicketToLeader(Integer clubId) {
        try {
            // 클럽 정보에서 회장 ID 가져오기
            Club club = clubRepository.findById(clubId)
                    .orElseThrow(() -> new IllegalArgumentException("클럽을 찾을 수 없습니다."));

            Integer leaderId = club.getLeaderUserId();

            // 마스코트 리롤권(ID=3) 회장 인벤토리에 추가
            inventoryService.addItem(leaderId, clubId, 3);
        } catch (Exception e) {
            // 리롤권 지급 실패 시 로그만 남기고 메인 로직은 계속 진행
            System.err.println("Failed to give reroll ticket to leader: " + e.getMessage());
        }
    }
}
