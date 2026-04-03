package com.album.admin.service;

import com.album.admin.entity.SiteInfo;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 站点服务接口
 */
public interface SiteInfoService extends IService<SiteInfo> {
    
    /**
     * 获取当前用户有权管理的站点列表
     */
    List<SiteInfo> getUserSites(Long userId);
    
    /**
     * 根据域名查询站点
     */
    SiteInfo getByDomain(String domain);
    
    /**
     * 创建站点
     */
    void createSite(SiteInfo siteInfo, Long creatorId);
    
    /**
     * 更新站点
     */
    void updateSite(SiteInfo siteInfo);
    
    /**
     * 更新站点（带权限校验）
     * @param siteInfo 站点信息
     * @param userId 当前用户 ID
     */
    void updateSiteWithPermissionCheck(SiteInfo siteInfo, Long userId);
    
    /**
     * 删除站点
     */
    void deleteSite(Long id);
}
