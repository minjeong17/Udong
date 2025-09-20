package com.udong.backend.global.config;

import com.udong.backend.chat.websocket.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket   // 웹소켓 기능 활성화
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // "/ws/chat" 이라는 주소로 웹소켓 연결 허용
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                // .addInterceptors(authHandshakeInterceptor) // 나중에 토큰 검증 붙일 때 활성화
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "https://j13a310.p.ssafy.io",
                        "https://udong.shop"
                );
                // 운영은 정확한 도메인만 허용 권장
//                .setAllowedOrigins("*"); // CORS 허용 (테스트용)
    }
}

