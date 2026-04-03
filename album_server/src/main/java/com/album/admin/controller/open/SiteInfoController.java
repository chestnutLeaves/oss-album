package com.album.admin.controller.open;

import com.album.admin.common.Result;
import com.album.admin.service.impl.SiteInfoOpenServiceImpl;
import com.album.admin.util.HttpUtil;
import com.album.admin.vo.SiteConfigVO;
import com.album.admin.vo.SiteInfoVO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 站点信息开放接口 Controller
 */
@RestController
@RequestMapping("/open/site")
@RequiredArgsConstructor
public class SiteInfoController {
    
    private final SiteInfoOpenServiceImpl siteInfoOpenService;
    
    /**
     * 获取站点详细信息 (根据 Referer 域名)
     */
    @GetMapping("/info")
    public Result<SiteInfoVO> getSiteInfo(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        if (referer == null || referer.isEmpty()) {
            return Result.error("无法获取来源域名");
        }
        
        // 从 Referer 中提取域名
        String domain = HttpUtil.extractDomain(referer);
        
        SiteInfoVO siteDetail = siteInfoOpenService.getSiteDetail(domain);
        return Result.success(siteDetail);
    }
    
    /**
     * 获取站点配置信息（仅标题和描述，带 60 秒缓存）
     */
    @GetMapping("/config")
    public Result<SiteConfigVO> getConfig(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        if (referer == null || referer.isEmpty()) {
            return Result.error("无法获取来源域名");
        }
        
        // 从 Referer 中提取域名
        String domain = HttpUtil.extractDomain(referer);
        
        SiteConfigVO siteConfig = siteInfoOpenService.getSiteConfig(domain);
        return Result.success(siteConfig);
    }
}
