package com.udong.backend.global.exception;

/**
 * 외부 API 호출 시 발생하는 예외를 처리하기 위한 커스텀 예외 클래스
 * E4000번대 에러 등 외부 서비스에서 발생한 에러를 구체적으로 전달하기 위해 사용
 */
public class ExternalApiException extends RuntimeException {

    public ExternalApiException(String message) {
        super(message);
    }

    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
    }
}