package com.udong.backend.global.exception;

public class PaymentPasswordException extends RuntimeException {
    public PaymentPasswordException(String message) {
        super(message);
    }
}