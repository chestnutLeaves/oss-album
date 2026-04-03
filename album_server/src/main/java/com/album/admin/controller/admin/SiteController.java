package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.SiteUpdateRequest;
import com.album.admin.entity.SiteInfo;
import com.album.admin.service.SiteInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 站点管理 Controller
 */
@RestController
@RequestMapping("/admin/sites")
@RequiredArgsConstructor
public class SiteController {
    
    private final SiteInfoService siteInfoService;
    
    /**
     * 获取当前用户有权管理的站点列表
     */
    @GetMapping
    public Result<List<SiteInfo>> getUserSites(@AuthenticationPrincipal Long userId) {
        List<SiteInfo> sites = siteInfoService.getUserSites(userId);
        return Result.success(sites);
    }
    
    /**
     * 更新站点
     */
    @PutMapping
    public Result<Void> updateSite(@Valid @RequestBody SiteUpdateRequest request,
                                   @AuthenticationPrincipal Long userId) {
        SiteInfo siteInfo = new SiteInfo();
        siteInfo.setId(request.getId());
        siteInfo.setDomain(request.getDomain());
        siteInfo.setTitle(request.getTitle());
        siteInfo.setDescription(request.getDescription());
        siteInfo.setAdminUrl(request.getAdminUrl());
        siteInfo.setUpdateTime(LocalDateTime.now());
        // 使用带权限校验的更新方法
        siteInfoService.updateSiteWithPermissionCheck(siteInfo, userId);
        return Result.success();
    }
}
