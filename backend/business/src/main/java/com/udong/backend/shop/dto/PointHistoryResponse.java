package com.udong.backend.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointHistoryResponse {
    private String codeName;
    private String memo;
    private Integer currPoint;
    private Integer delta;
    private LocalDateTime createdAt;
}