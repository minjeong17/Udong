package com.udong.backend.global.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiResponse<T> {
    private final boolean success;
    private final T data;
    private final int status;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .status(200)
                .build();
    }

    public static ApiResponse<?> error(int status, String message) {
        return ApiResponse.builder()
                .success(false)
                .status(status)
                .data(message)
                .build();
    }
}
