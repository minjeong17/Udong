package com.udong.backend.clubs.dto;

public record MascotCreateReq(
        String clubCategory,    // 요청에서 넘어오면 이걸로 override
        Boolean activate        // true면 생성 후 바로 대표로 지정
) {}

