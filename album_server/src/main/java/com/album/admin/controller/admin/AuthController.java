package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.ChangePasswordRequest;
import com.album.admin.service.SysAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 认证管理 Controller
 */
@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final SysAccountService sysAccountService;
    
    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public Result<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Long userId) {
        sysAccountService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        return Result.success();
    }
}
