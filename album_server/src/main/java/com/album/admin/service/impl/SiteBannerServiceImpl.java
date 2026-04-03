package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.SiteBanner;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.SiteBannerMapper;
import com.album.admin.service.SiteBannerService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 站点 Banner 服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiteBannerServiceImpl extends ServiceImpl<SiteBannerMapper, SiteBanner> implements SiteBannerService {
    
    @Override
    public List<SiteBanner> getSiteBanners(Long siteId) {
        LambdaQueryWrapper<SiteBanner> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteBanner::getSiteId, siteId)
               .orderByAsc(SiteBanner::getSortOrder);
        return list(wrapper);
    }
    
    @Override
    public void createBanner(SiteBanner banner) {
        banner.setCreateTime(LocalDateTime.now());
        save(banner);
        log.info("创建 Banner 成功：{}, siteId: {}", banner.getTitle(), banner.getSiteId());
    }
    
    @Override
    public void updateBanner(SiteBanner banner) {
        SiteBanner existBanner = getById(banner.getId());
        if (existBanner == null) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        
        updateById(banner);
        log.info("更新 Banner 成功：{}", banner.getId());
    }
    
    @Override
    public void deleteBanner(Long id) {
        SiteBanner existBanner = getById(id);
        if (existBanner == null) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        
        // 逻辑删除
        removeById(id);
        log.info("删除 Banner 成功：{}", id);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void dragSort(Long id, Integer newSortOrder) {
        // 1. 查询当前 Banner
        SiteBanner currentBanner = getById(id);
        if (currentBanner == null) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        
        Integer oldSortOrder = currentBanner.getSortOrder();
        
        // 2. 如果排序值没有变化，直接返回
        if (oldSortOrder.equals(newSortOrder)) {
            log.info("拖拽排序值未变化：bannerId: {}, sortOrder: {}", id, oldSortOrder);
            return;
        }
        
        // 3. 查询站点内所有 Banner
        LambdaQueryWrapper<SiteBanner> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteBanner::getSiteId, currentBanner.getSiteId())
               .orderByAsc(SiteBanner::getSortOrder);
        List<SiteBanner> allBanners = list(wrapper);
        
        // 4. 根据移动方向更新排序值
        if (newSortOrder > oldSortOrder) {
            // 向下移动：将范围内的资源排序值减 1
            for (SiteBanner banner : allBanners) {
                if (!banner.getId().equals(id) && 
                    banner.getSortOrder() > oldSortOrder && 
                    banner.getSortOrder() <= newSortOrder) {
                    banner.setSortOrder(banner.getSortOrder() - 1);
                    updateById(banner);
                }
            }
        } else {
            // 向上移动：将范围内的资源排序值加 1
            for (SiteBanner banner : allBanners) {
                if (!banner.getId().equals(id) && 
                    banner.getSortOrder() >= newSortOrder && 
                    banner.getSortOrder() < oldSortOrder) {
                    banner.setSortOrder(banner.getSortOrder() + 1);
                    updateById(banner);
                }
            }
        }
        
        // 5. 更新当前 Banner 的排序值
        currentBanner.setSortOrder(newSortOrder);
        updateById(currentBanner);
        
        log.info("拖拽排序成功：bannerId: {}, oldSortOrder: {}, newSortOrder: {}", 
            id, oldSortOrder, newSortOrder);
    }
}
