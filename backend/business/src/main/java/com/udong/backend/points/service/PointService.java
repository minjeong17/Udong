package com.udong.backend.points.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.udong.backend.points.dto.UserPointLedgerRequest;
import com.udong.backend.points.dto.UserPointLedgerResponse;
import com.udong.backend.points.entity.UserPointLedger;
import com.udong.backend.points.repository.PointRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointService {
	
	private final PointRepository pointRepository;

	public List<UserPointLedgerResponse> getLedgers(Integer userId) {
        return pointRepository.findByUserId(userId).stream()
                .map(UserPointLedgerResponse::from)
                .toList();
    }

    @Transactional
    public UserPointLedgerResponse addPoints(Integer userId, UserPointLedgerRequest req) {
        if (req.getDelta() <= 0) {
            throw new IllegalArgumentException("증가 포인트는 0보다 커야 합니다.");
        }

        Integer currPoint = pointRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
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

        UserPointLedger saved = pointRepository.save(ledger);
        return UserPointLedgerResponse.from(saved);
    }

    @Transactional
    public UserPointLedgerResponse usePoints(Integer userId, UserPointLedgerRequest req) {
        if (req.getDelta() <= 0) {
            throw new IllegalArgumentException("차감 포인트는 0보다 커야 합니다.");
        }

        Integer currPoint = pointRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
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

        UserPointLedger saved = pointRepository.save(ledger);
        return UserPointLedgerResponse.from(saved);
    }
}
