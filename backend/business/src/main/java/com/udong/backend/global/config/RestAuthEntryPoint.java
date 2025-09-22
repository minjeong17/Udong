package com.udong.backend.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.udong.backend.global.dto.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RestAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper om;

    public RestAuthEntryPoint(ObjectMapper om) {
        this.om = om;
    }

    @Override
    public void commence(HttpServletRequest req,
                         HttpServletResponse res,
                         AuthenticationException ex) throws IOException, ServletException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[401] " + req.getMethod() + " " + req.getRequestURI()
                + " principal=" + (auth != null ? auth.getPrincipal() : "null"));

        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
        res.setContentType("application/json;charset=UTF-8");
        String body = om.writeValueAsString(ApiResponse.error(401, "인증이 필요합니다."));
        res.getWriter().write(body);
    }
}
