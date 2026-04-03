package com.album.admin.service;

import com.album.admin.entity.SiteBanner;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 站点 Banner 服务接口
 */
public interface SiteBannerService extends IService<SiteBanner> {
    
    /**
     * 获取站点的 Banner 列表
     */
    List<SiteBanner> getSiteBanners(Long siteId);
    
    /**
     * 创建 Banner
     */
    void createBanner(SiteBanner banner);
    
    /**
     * 更新 Banner
     */
    void updateBanner(SiteBanner banner);
    
    /**
     * 删除 Banner
     */
    void deleteBanner(Long id);
    
    /**
     * 拖拽排序 Banner
     * @param id Banner ID
     * @param newSortOrder 新的排序值
     */
    void dragSort(Long id, Integer newSortOrder);
}
