package com.udong.backend.global.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // 공개 엔드포인트(컨텍스트 경로 제거 후 매칭)
    private static final String[] WHITELIST = {
            "/v1/users/signup",
            "/v1/auth/login",
            "/v1/auth/refresh",
            // Swagger/OpenAPI
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/api-docs/**",
            "/swagger-resources/**",
            "/webjars/**",
            // WebSocket
            "/ws/**"
    };

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String ctx = request.getContextPath();   // 보통 "/api"
        String path = request.getRequestURI();   // 예: "/api/v1/auth/login"
        if (ctx != null && !ctx.isEmpty() && path.startsWith(ctx)) {
            path = path.substring(ctx.length()); // "/v1/auth/login"
        }
        for (String pattern : WHITELIST) {
            if (pathMatcher.match(pattern, path)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        // WebSocket 핸드셰이크는 바로 통과
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/ws/")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String bearer = request.getHeader("Authorization");
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                String token = bearer.substring(7);

                if (jwtTokenProvider.validate(token)) {
                    // ✅ role 추출/세팅 제거: 토큰에서 사용자 식별자만 꺼냄
                    String userId = jwtTokenProvider.getUserId(token); // 문자열 or Long.toString()

                    // ✅ 인증만 필요한 정책이면 권한은 기본값 하나만 부여(ROLE_USER)
                    var authorities = List.of(new SimpleGrantedAuthority("USER"));

                    var auth = new UsernamePasswordAuthenticationToken(
                            userId,        // principal
                            null,          // credentials
                            authorities
                    );
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception ignore) {
            // 토큰 문제면 인증 없이 진행(컨트롤러/시큐리티에서 401/403 처리)
        }

        chain.doFilter(request, response);
    }
}
