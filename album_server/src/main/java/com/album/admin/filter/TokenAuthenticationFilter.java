package com.album.admin.filter;

import com.album.admin.common.ErrorCode;
import com.album.admin.common.Result;
import com.album.admin.service.impl.SysAccountServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {
    
    private final SysAccountServiceImpl sysAccountService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) 
            throws ServletException, IOException {
        
        String token = extractToken(request);
        
        if (StringUtils.hasText(token)) {
            try {
                Long userId = sysAccountService.verifyToken(token);
                if (userId != null) {
                    var authentication = 
                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            userId, 
                            null, 
                            Collections.emptyList()
                        );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Token 验证成功，userId: {}", userId);
                } else {
                    // Token 无效或过期，不拦截，继续执行
                    // 由 Spring Security 根据路径配置决定是否放行
                    log.debug("Token 已过期或无效，跳过认证");
                }
            } catch (Exception e) {
                // Token 验证异常，不拦截，继续执行
                // 由 Spring Security 根据路径配置决定是否放行
                log.debug("Token 验证异常：{}", e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
