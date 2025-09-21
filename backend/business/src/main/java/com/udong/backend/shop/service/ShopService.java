package com.udong.backend.shop.service;

import org.springframework.stereotype.Service;

import com.udong.backend.items.entity.Item;
import com.udong.backend.items.repository.ItemRepository;
import com.udong.backend.items.service.InventoryService;
import com.udong.backend.items.service.ItemService;
import com.udong.backend.points.service.PointService;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.repository.UserRepository;

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
    public PurchaseResult purchaseItem(Integer userId, Integer itemId) {

        // 1. 아이템 정보 조회
        Item item = itemService.getItem(itemId);
        if (item == null) {
            throw new RuntimeException("아이템을 찾을 수 없습니다.");
        }

        int price = item.getPrice(); // 구매 가격

        // 2. 포인트 차감
        UserPointLedgerRequest pointRequest = UserPointLedgerRequest.builder()
                .clubId(0) // 필요에 따라 설정
                .CodeName("ITEM_PURCHASE")
                .delta(price)
                .memo("아이템 구매: " + item.getName())
                .build();

        // usePoints는 delta가 양수로 전달되며, 서비스 내부에서 음수로 차감
        UserPointLedgerResponse pointLedger = pointService.usePoints(userId, pointRequest);

        // 3. 인벤토리에 아이템 추가
        InventoryResponse inventoryResponse = inventoryService.addItem(userId, itemId);

        // 4. 결과 반환
        return new PurchaseResult(inventoryResponse, pointLedger);
    }
