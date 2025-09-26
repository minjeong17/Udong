package com.udong.backend.global.dto.response;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import com.udong.backend.global.exception.TransferException;
import com.udong.backend.global.exception.PaymentPasswordException;
import com.udong.backend.global.exception.ExternalApiException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1) DTO 검증 실패(@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> formatFieldError(fe))
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), msg));
    }

    // 2) JSON 파싱/바디 누락 등
    @ExceptionHandler({ HttpMessageNotReadableException.class, MissingServletRequestParameterException.class, IllegalArgumentException.class })
    public ResponseEntity<ApiResponse<?>> handleBadRequest(Exception ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), messageOrDefault(ex, "잘못된 요청입니다.")));
    }

    // 3) 컨트롤러/서비스에서 명시적으로 던진 상태코드
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<?>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value()); // ✅ 캐스팅 대신 valueOf
        String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return ResponseEntity.status(status).body(ApiResponse.error(status.value(), message));
    }

    // 3-1) 이체 관련 예외 처리
    @ExceptionHandler(TransferException.class)
    public ResponseEntity<ApiResponse<?>> handleTransferException(TransferException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    // 3-2) 결제 비밀번호 관련 예외 처리
    @ExceptionHandler(PaymentPasswordException.class)
    public ResponseEntity<ApiResponse<?>> handlePaymentPasswordException(PaymentPasswordException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    // 3-3) 외부 API 관련 예외 처리 (E4000번대 에러 등)
    @ExceptionHandler(ExternalApiException.class)
    public ResponseEntity<ApiResponse<?>> handleExternalApiException(ExternalApiException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    // 4) 기타 모든 예외 (마지막 그물망)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleAll(Exception ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = "요청을 처리할 수 없습니다."; // 내부 메시지 노출 방지
        // TODO: 로그로 ex 전체 스택 기록
        return ResponseEntity.status(status).body(ApiResponse.error(status.value(), message));
    }

    private static String formatFieldError(FieldError fe) {
        // 예: "name: must not be blank"
        return fe.getField() + ": " + (fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage());
    }

    private static String messageOrDefault(Exception ex, String fallback) {
        return (ex.getMessage() == null || ex.getMessage().isBlank()) ? fallback : ex.getMessage();
    }
}