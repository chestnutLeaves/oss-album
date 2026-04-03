package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.LoginRequest;
import com.album.admin.dto.LoginResponse;
import com.album.admin.service.SysAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

/**
 * 认证 Controller
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthOpenController {
    
    private final SysAccountService sysAccountService;
    
    @Value("${token.expiration:86400}")
    private Long tokenExpiration;
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request, 
                                       HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String token = sysAccountService.login(request.getUsername(), request.getPassword(), ip);
        return Result.success(new LoginResponse(token, tokenExpiration));
    }
    
    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authorization) {
        String token = extractToken(authorization);
        sysAccountService.logout(token);
        return Result.success();
    }
    
    /**
     * 从 Authorization header 中提取 Token
     */
    private String extractToken(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return authorization;
    }
    
    /**
     * 获取客户端 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 如果是多个 IP，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0];
        }
        return ip;
    }
}
