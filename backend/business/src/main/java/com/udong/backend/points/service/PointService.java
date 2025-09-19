package com.udong.backend.points.service;

import org.springframework.stereotype.Service;

import com.udong.backend.points.dto.UserPointLedgerRequest;
import com.udong.backend.points.entity.UserPointLedger;
import com.udong.backend.points.repository.PointRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointService {
	
	private final PointRepository pointRepository;

	public UserPointLedger getLedger(Integer userId) {
		UserPointLedger userPointLedger = pointRepository.findByUserId(userId)
				.orElseThrow(() -> new RuntimeException("포인트 내역을 찾을 수 없습니다."));
		
		return userPointLedger;
	}
	
	public UserPointLedger addLedger(UserPointLedgerRequest req) {
		return pointRepository.save(null);
	}
}
