package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.Album;
import com.album.admin.entity.MediaResource;
import com.album.admin.entity.SiteBanner;
import com.album.admin.entity.SiteInfo;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.SiteInfoMapper;
import com.album.admin.service.AlbumService;
import com.album.admin.service.MediaResourceService;
import com.album.admin.service.SiteBannerService;
import com.album.admin.service.SiteInfoOpenService;
import com.album.admin.vo.AlbumSimpleVO;
import com.album.admin.vo.BannerVO;
import com.album.admin.vo.SiteConfigVO;
import com.album.admin.vo.SiteInfoVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.github.benmanes.caffeine.cache.Cache;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 站点信息服务实现类 (用于开放接口)
 */
@Service
@RequiredArgsConstructor
public class SiteInfoOpenServiceImpl implements SiteInfoOpenService {
    
    private final SiteInfoMapper siteInfoMapper;
    private final SiteBannerService siteBannerService;
    private final AlbumService albumService;
    private final MediaResourceService mediaResourceService;
    private final Cache<String, Object> siteInfoCache;
    
    @Override
    public SiteInfo getSiteInfoByDomain(String domain) {
        // 根据域名查询站点
        LambdaQueryWrapper<SiteInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteInfo::getDomain, domain);
        SiteInfo siteInfo = siteInfoMapper.selectOne(wrapper);
        
        if (siteInfo == null) {
            throw new BusinessException(ErrorCode.SITE_NOT_FOUND);
        }
        
        return siteInfo;
    }
    
    /**
     * 获取站点的完整信息 (包含 Banner 和相册列表)
     */
    @Override
    public SiteInfoVO getSiteDetail(String domain) {
        // 尝试从缓存中获取
        String cacheKey = "site:" + domain;
        SiteInfoVO cachedResult = (SiteInfoVO) siteInfoCache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }
        
        SiteInfo siteInfo = getSiteInfoByDomain(domain);
        
        // 构建站点信息 VO
        SiteInfoVO siteInfoVO = new SiteInfoVO();
        siteInfoVO.setTitle(siteInfo.getTitle());
        siteInfoVO.setDescription(siteInfo.getDescription());
        siteInfoVO.setAdminUrl(siteInfo.getAdminUrl());
        
        // 获取 Banner 列表并转换为 VO
        List<SiteBanner> banners = siteBannerService.getSiteBanners(siteInfo.getId());
        List<BannerVO> bannerVOList = banners.stream()
                .map(banner -> {
                    BannerVO vo = new BannerVO();
                    vo.setImageUrl(banner.getImageUrl());
                    vo.setTitle(banner.getTitle());
                    vo.setDescription(banner.getDescription());
                    return vo;
                })
                .collect(Collectors.toList());
        
        // 获取相册列表并转换为 VO
        List<Album> albums = albumService.getSiteAlbums(siteInfo.getId());
        
        // 批量获取每个相册的封面图
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        Map<Long, List<String>> albumCoverMap = getAlbumCoverImages(albumIds);
        
        List<AlbumSimpleVO> albumVOList = albums.stream()
                .map(album -> {
                    AlbumSimpleVO vo = new AlbumSimpleVO();
                    vo.setId(album.getId());  // 设置相册 ID
                    vo.setYear(album.getYear());
                    vo.setNeedPassword(album.getNeedPassword());
                    vo.setTitle(album.getTitle());
                    vo.setDescription(album.getDescription());
                    vo.setSortOrder(album.getSortOrder());
                    vo.setCoverImages(albumCoverMap.getOrDefault(album.getId(), new ArrayList<>()));
                    return vo;
                })
                .collect(Collectors.toList());
        
        // 设置 Banner 和相册列表到 VO
        siteInfoVO.setBanners(bannerVOList);
        siteInfoVO.setAlbums(albumVOList);
        
        // 存入缓存
        siteInfoCache.put(cacheKey, siteInfoVO);
        
        return siteInfoVO;
    }
    
    /**
     * 批量获取相册的封面图
     * @param albumIds 相册 ID 列表
     * @return Map<AlbumId, List<CoverImageUrls>>
     */
    private Map<Long, List<String>> getAlbumCoverImages(List<Long> albumIds) {
        // 为每个相册查询标记为封面的图片
        return albumIds.stream()
                .collect(Collectors.toMap(
                        albumId -> albumId,
                        albumId -> {
                            LambdaQueryWrapper<MediaResource> wrapper = new LambdaQueryWrapper<>();
                            wrapper.eq(MediaResource::getAlbumId, albumId)
                                   .eq(MediaResource::getIsCover, 1)
                                   .orderByAsc(MediaResource::getSortOrder);
                            List<MediaResource> medias = mediaResourceService.list(wrapper);
                            return medias.stream()
                                    .map(MediaResource::getThumbnailUrl)
                                    .filter(url -> url != null && !url.isEmpty())
                                    .collect(Collectors.toList());
                        }
                ));
    }
    
    /**
     * 获取站点配置信息（仅标题和描述，带 60 秒缓存）
     */
    @Override
    public SiteConfigVO getSiteConfig(String domain) {
        // 尝试从缓存中获取（60 秒过期时间）
        String cacheKey = "site:config:" + domain;
        SiteConfigVO cachedResult = (SiteConfigVO) siteInfoCache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }
        
        // 查询站点信息
        SiteInfo siteInfo = getSiteInfoByDomain(domain);
        
        // 构建精简的配置 VO
        SiteConfigVO siteConfigVO = new SiteConfigVO();
        siteConfigVO.setTitle(siteInfo.getTitle());
        siteConfigVO.setDescription(siteInfo.getDescription());
        siteConfigVO.setAdminUrl(siteInfo.getAdminUrl());
        
        // 存入缓存（60 秒后自动过期）
        siteInfoCache.put(cacheKey, siteConfigVO);
        
        return siteConfigVO;
    }
}
