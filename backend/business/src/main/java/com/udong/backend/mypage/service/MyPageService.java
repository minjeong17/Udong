package com.udong.backend.mypage.service;

import com.udong.backend.global.config.AccountCrypto;
import com.udong.backend.mypage.dto.AvailabilityDto;
import com.udong.backend.mypage.dto.ItemDto;
import com.udong.backend.mypage.dto.MyPageResponse;
import com.udong.backend.mypage.repository.MyPageRepository;
import com.udong.backend.mypage.repository.MyPageUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MyPageRepository myPageRepository;
    private final MyPageUserRepository userRepo;
    private final AccountCrypto accountCrypto;   // ✅ 주입

    public MyPageResponse getMyPage(Integer userId, Integer clubId) {

        var user = userRepo.findUserProfile(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다. id=" + userId));

        var clubJoin = myPageRepository.findClubJoin(userId, clubId)
                .orElseThrow(() -> new IllegalArgumentException("해당 클럽 가입 이력이 없습니다. clubId=" + clubId));

        int pointBalance = myPageRepository.findPointBalance(userId, clubId);
        int participatingCount = myPageRepository.countParticipatingEvents(userId, clubId);

        var itemProjs = myPageRepository.findMyItems(userId, clubId);
        List<ItemDto> items = itemProjs.stream()
                .map(p -> new ItemDto(p.getItemId(), p.getItemName(), p.getItemDescription(), p.getQty()))
                .toList();
        int itemKinds = items.size();

        var availProjs = myPageRepository.findAvailabilities(userId);
        List<AvailabilityDto> avails = availProjs.stream()
                .map(a -> new AvailabilityDto(a.getDayOfWeek(), a.getStartTime(), a.getEndTime()))
                .toList();

        // ✅ 5) 계좌번호 복호화(평문으로 반환)
        String accountPlain = null;
        String cipher = user.getAccountCipher();
        if (cipher != null && !cipher.isBlank()) {
            try {
                accountPlain = accountCrypto.decrypt(cipher);   // ← 파라미터 하나만!
            } catch (Exception e) {
                // 필요 시 로깅 후 null 또는 마스킹값으로 대체
                accountPlain = null;
            }
        }

        return MyPageResponse.builder()
                .profile(MyPageResponse.Profile.builder()
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .gender(user.getGender())
                        .university(user.getUniversity())
                        .major(user.getMajor())
                        // ⚠️ 현재 필드명이 accountMasked인데, 평문을 보내려면 의미상 accountNumber로 바꾸는 걸 권장
                        .accountMasked(accountPlain)  // 임시로 여기에 평문 주입
                        .clubName(clubJoin.getClubName())
                        .joinedAt(clubJoin.getJoinedAt())
                        .build())
                .stats(MyPageResponse.Stats.builder()
                        .points(pointBalance)
                        .participatingMeetings(participatingCount)
                        .itemKinds(itemKinds)
                        .build())
                .items(items)
                .availabilities(avails)
                .build();
    }
}
