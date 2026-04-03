package com.album.admin.controller.open;

import com.album.admin.common.Result;
import com.album.admin.entity.SiteInfo;
import com.album.admin.mapper.SiteInfoMapper;
import com.album.admin.service.TagService;
import com.album.admin.util.HttpUtil;
import com.album.admin.vo.TagVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.github.benmanes.caffeine.cache.Cache;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 标签开放接口 Controller
 */
@RestController
@RequestMapping("/open/tags")
@RequiredArgsConstructor
public class TagOpenController {
    
    private final TagService tagService;
    private final Cache<String, Object> tagListCache;
    private final SiteInfoMapper siteInfoMapper;
    
    /**
     * 获取当前站点的标签列表（按关联媒体数量降序排序）
     */
    @GetMapping
    public Result<List<TagVO>> getAllTags(HttpServletRequest request) {
        // 从 Referer 中提取域名
        String referer = request.getHeader("Referer");
        if (referer == null || referer.isEmpty()) {
            return Result.error("无法获取来源域名");
        }
        
        String domain = HttpUtil.extractDomain(referer);
        
        // 根据域名查询站点
        String cacheKey = "site_tags:" + domain;
        
        // 尝试从缓存中获取
        List<TagVO> cachedResult = (List<TagVO>) tagListCache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            return Result.success(cachedResult);
        }
        
        // 查询站点信息
        LambdaQueryWrapper<SiteInfo> siteWrapper = new LambdaQueryWrapper<>();
        siteWrapper.eq(SiteInfo::getDomain, domain);
        SiteInfo siteInfo = siteInfoMapper.selectOne(siteWrapper);
        
        if (siteInfo == null) {
            return Result.error("站点不存在");
        }
        
        // 使用 Service 查询站点标签
        List<TagVO> tags = tagService.getSiteTags(siteInfo.getId());
        
        // 存入缓存
        tagListCache.put(cacheKey, tags);
        
        return Result.success(tags);
    }
}
