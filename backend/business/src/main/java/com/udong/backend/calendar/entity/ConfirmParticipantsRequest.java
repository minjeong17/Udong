package com.udong.backend.calendar.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class ConfirmParticipantsRequest {
    private List<Integer> userIds;  // true로 만들 사용자 ID들 (없으면 전원 false)
}
