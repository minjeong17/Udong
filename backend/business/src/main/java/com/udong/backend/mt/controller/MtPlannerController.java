package com.udong.backend.mt.controller;

import com.udong.backend.global.dto.response.ApiResponse;
import com.udong.backend.mt.dto.MtPlannerDtos;
import com.udong.backend.mt.service.MtPlannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/mt")
@RequiredArgsConstructor
public class MtPlannerController {

    private final MtPlannerService planner;

    @PostMapping("/plan")
    public ResponseEntity<ApiResponse<MtPlannerDtos.Res>> plan(@RequestBody MtPlannerDtos.Req req) {
        return ResponseEntity.ok(ApiResponse.ok(planner.generate(req)));
    }
}

