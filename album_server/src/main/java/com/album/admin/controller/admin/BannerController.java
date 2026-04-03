package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.BannerRequest;
import com.album.admin.dto.MediaSortRequest;
import com.album.admin.entity.SiteBanner;
import com.album.admin.service.SiteBannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Banner 管理 Controller
 */
@RestController
@RequestMapping("/admin/banners")
@RequiredArgsConstructor
public class BannerController {
    
    private final SiteBannerService siteBannerService;
    
    /**
     * 获取站点的 Banner 列表
     */
    @GetMapping
    public Result<List<SiteBanner>> getSiteBanners(@RequestParam Long siteId) {
        List<SiteBanner> banners = siteBannerService.getSiteBanners(siteId);
        return Result.success(banners);
    }
    
    /**
     * 创建 Banner
     */
    @PostMapping
    public Result<Void> createBanner(@Valid @RequestBody BannerRequest request) {
        SiteBanner banner = new SiteBanner();
        banner.setSiteId(request.getSiteId());
        banner.setSortOrder(request.getSortOrder());
        banner.setImageUrl(request.getImageUrl());
        banner.setTitle(request.getTitle());
        banner.setDescription(request.getDescription());
        banner.setExifInfo(request.getExifInfo());
        
        siteBannerService.createBanner(banner);
        return Result.success();
    }
    
    /**
     * 更新 Banner
     */
    @PutMapping
    public Result<Void> updateBanner(@Valid @RequestBody BannerRequest request) {
        SiteBanner banner = new SiteBanner();
        banner.setId(request.getId());
        banner.setSortOrder(request.getSortOrder());
        banner.setImageUrl(request.getImageUrl());
        banner.setTitle(request.getTitle());
        banner.setDescription(request.getDescription());
        banner.setExifInfo(request.getExifInfo());
        
        siteBannerService.updateBanner(banner);
        return Result.success();
    }
    
    /**
     * 删除 Banner
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteBanner(@PathVariable Long id) {
        siteBannerService.deleteBanner(id);
        return Result.success();
    }
    
    /**
     * 拖拽排序 Banner
     */
    @PutMapping("/sort")
    public Result<Void> dragSort(@Valid @RequestBody MediaSortRequest request) {
        siteBannerService.dragSort(request.getId(), request.getNewSortOrder());
        return Result.success();
    }
}
