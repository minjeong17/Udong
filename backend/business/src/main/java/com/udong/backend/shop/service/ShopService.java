package com.udong.backend.shop.service;

import org.springframework.stereotype.Service;

import com.udong.backend.shop.dto.UserPointLedgerRequest;
import com.udong.backend.shop.entity.Item;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Mascot;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MascotRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final InventoryService inventoryService;
    private final ItemService itemService;
    private final PointService pointService;
    private final ClubRepository clubRepository;
    private final MascotRepository mascotRepository;

    /**
     * 아이템 구매 처리
     * - 유저 포인트 차감
     * - 인벤토리에 아이템 추가
     */
    @Transactional
    public void purchaseItem(Integer clubId, Integer userId, Integer itemId) {

        // 아이템 정보 조회
        Item item = itemService.getItem(itemId);
        if (item == null) {
            throw new RuntimeException("아이템을 찾을 수 없습니다.");
        }

        // 포인트 차감
        UserPointLedgerRequest pointRequest = UserPointLedgerRequest.builder()
                .clubId(clubId)
                .codeName("PURCHASE")
                .delta(item.getPrice())
                .memo("아이템 구매: " + item.getName())
                .build();

        // usePoints는 delta가 양수로 전달되며, 서비스 내부에서 음수로 차감
        pointService.usePoints(userId, pointRequest);

        // 동돌이(itemId 4) 구매 시 마스코트만 생성 (인벤토리 추가 안함)
        if (itemId == 4) {
            createDongdolMascot(clubId);
        } else {
            // 일반 아이템은 인벤토리에 추가
            inventoryService.addItem(userId, clubId, itemId);
        }
    }

    /**
     * 동돌이 마스코트 생성
     */
    private void createDongdolMascot(Integer clubId) {
        try {
            Club club = clubRepository.findById(clubId)
                    .orElseThrow(() -> new RuntimeException("동아리를 찾을 수 없습니다."));

            // 동돌이 마스코트 생성
            Mascot dongdolMascot = Mascot.builder()
                    .club(club)
                    .imageUrl("/images/dongdol.png")
                    .s3Key("dongdol-fixed") // 고정 키
                    .promptMeta("동돌이 - 특별 마스코트")
                    .build();

            mascotRepository.save(dongdolMascot);

            System.out.println("동돌이 마스코트가 생성되었습니다. Club ID: " + clubId);
        } catch (Exception e) {
            // 마스코트 생성 실패해도 아이템 구매는 성공으로 처리
            System.err.println("동돌이 마스코트 생성 실패: " + e.getMessage());
        }
    }
}