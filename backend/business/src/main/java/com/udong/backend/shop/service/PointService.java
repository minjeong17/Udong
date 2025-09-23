package com.udong.backend.shop.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.entity.UserPointLedger;
import com.udong.backend.shop.repository.PointRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointService {
	
	private final PointRepository pointRepository;
	
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
}
