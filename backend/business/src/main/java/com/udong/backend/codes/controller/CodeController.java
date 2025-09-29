package com.udong.backend.codes.controller;

import com.udong.backend.codes.dto.DetailResponse;
import com.udong.backend.codes.service.CodeService;
import com.udong.backend.global.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("v1/codes")
@RequiredArgsConstructor
public class CodeController {

    private final CodeService codeService;

    @GetMapping("/details")
    public ResponseEntity<ApiResponse<List<DetailResponse>>> getDetailsByGroup(@RequestParam String groupName) {
        List<DetailResponse> responseList = codeService.getCodeDetailsByGroup(groupName);
        return ResponseEntity.ok(ApiResponse.ok(responseList));
    }
}
