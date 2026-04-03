package com.album.admin.service;

import com.album.admin.entity.SiteInfo;
import com.album.admin.vo.SiteConfigVO;
import com.album.admin.vo.SiteInfoVO;

/**
 * 站点信息服务接口 (用于开放接口)
 */
public interface SiteInfoOpenService {
    
    /**
     * 根据域名获取站点信息 (包含 Banner 和相册列表)
     */
    SiteInfo getSiteInfoByDomain(String domain);
    
    /**
     * 获取站点的完整详情 (包含 Banner 和相册列表)
     * @param domain 域名
     * @return 站点详情 VO
     */
    SiteInfoVO getSiteDetail(String domain);
    
    /**
     * 获取站点配置信息（仅标题和描述，带 60 秒缓存）
     * @param domain 域名
     * @return 站点配置 VO
     */
    SiteConfigVO getSiteConfig(String domain);
}
