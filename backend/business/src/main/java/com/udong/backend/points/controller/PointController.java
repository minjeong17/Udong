package com.udong.backend.points.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.udong.backend.points.service.PointService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/point")
public class PointController {
	
	private final PointService pointService;
	
	@GetMapping
	public ApiResponse<> get() {
		
	}
	
}
