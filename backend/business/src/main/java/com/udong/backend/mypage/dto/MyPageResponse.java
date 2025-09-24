package com.udong.backend.mypage.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MyPageResponse {

    private Profile profile;   // 상단 프로필 카드
    private Stats stats;       // 포인트, 참여 모임 수, 보유 아이템 종류 수
    private List<ItemDto> items;           // 보유 아이템 리스트
    private List<AvailabilityDto> availabilities; // 활동 가능 시간

    @Getter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Profile {
        private String name;
        private String clubName;
        private LocalDateTime joinedAt;

        private String email;
        private String phone;
        private String university;
        private String major;
        private String gender;       // "M" | "F"
        private String accountMasked;
    }

    @Getter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Stats {
        private int points;
        private int participatingMeetings;
        private int itemKinds;
    }
}
