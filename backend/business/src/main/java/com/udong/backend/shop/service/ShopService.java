package com.udong.backend.shop.service;

import org.springframework.stereotype.Service;

import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.entity.Item;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final InventoryService inventoryService;
    private final ItemService itemService;
    private final PointService pointService;

    /**
     * 아이템 구매 처리
     * - 유저 포인트 차감
     * - 인벤토리에 아이템 추가
     */
    @Transactional
    public void purchaseItem(Integer userId, Integer itemId) {

        // 아이템 정보 조회
        Item item = itemService.getItem(itemId);
        if (item == null) {
            throw new RuntimeException("아이템을 찾을 수 없습니다.");
        }

        // 포인트 차감
        UserPointLedgerRequest pointRequest = UserPointLedgerRequest.builder()
                .clubId(0) // 필요에 따라 설정
                .CodeName("PURCHASE")
                .delta(item.getPrice())
                .memo("아이템 구매: " + item.getName())
                .build();

        // usePoints는 delta가 양수로 전달되며, 서비스 내부에서 음수로 차감
        pointService.usePoints(userId, pointRequest);

        // 인벤토리에 아이템 추가
        inventoryService.addItem(userId, itemId);
    }
}