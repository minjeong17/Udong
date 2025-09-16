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

    // 공개 엔드포인트(필터 스킵 목록)
    private static final String[] WHITELIST = {
            "/api/v1/users/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh"
    };

    // 공개 엔드포인트는 필터링 건너뛰기
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
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

        try {
            String bearer = request.getHeader("Authorization");
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                String token = bearer.substring(7);

                if (jwtTokenProvider.validate(token)) {
                    // 토큰에서 subject(사용자 식별자), role 추출
                    String userId = jwtTokenProvider.getUserId(token); // 문자열 또는 Long.toString()
                    String role   = jwtTokenProvider.getRole(token);   // e.g., "ROLE_USER"

                    var authorities = List.of(new SimpleGrantedAuthority(role));
                    var auth = new UsernamePasswordAuthenticationToken(
                            userId,               // principal (간단히 userId 사용)
                            null,                 // credentials
                            authorities
                    );
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception ex) {
            // 토큰 에러(만료/변조 등) → 인증 정보 세팅 없이 진행
            // 필요하면 여기서 401로 바로 응답하거나 로깅하세요.
        }

        chain.doFilter(request, response);
    }
}
