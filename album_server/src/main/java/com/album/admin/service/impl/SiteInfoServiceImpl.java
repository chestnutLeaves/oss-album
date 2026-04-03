package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.SiteInfo;
import com.album.admin.entity.UserSiteRel;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.SiteInfoMapper;
import com.album.admin.service.SiteInfoService;
import com.album.admin.service.UserSiteRelService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 站点服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiteInfoServiceImpl extends ServiceImpl<SiteInfoMapper, SiteInfo> implements SiteInfoService {
    
    private final UserSiteRelService userSiteRelService;
    
    @Override
    public List<SiteInfo> getUserSites(Long userId) {
        // 查询用户关联的站点 ID 列表
        List<UserSiteRel> rels = userSiteRelService.getUserSiteRels(userId);
        if (rels.isEmpty()) {
            return List.of();
        }
        
        List<Long> siteIds = rels.stream()
            .map(UserSiteRel::getSiteId)
            .collect(Collectors.toList());
        
        // 批量查询站点信息
        LambdaQueryWrapper<SiteInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(SiteInfo::getId, siteIds);
        return list(wrapper);
    }
    
    @Override
    public SiteInfo getByDomain(String domain) {
        LambdaQueryWrapper<SiteInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteInfo::getDomain, domain);
        return getOne(wrapper);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createSite(SiteInfo siteInfo, Long creatorId) {
        // 检查域名是否已存在
        SiteInfo existSite = getByDomain(siteInfo.getDomain());
        if (existSite != null) {
            throw new BusinessException(ErrorCode.SITE_DOMAIN_EXISTS);
        }
        
        // 设置创建者
        siteInfo.setCreatorId(creatorId);
        siteInfo.setCreateTime(LocalDateTime.now());
        save(siteInfo);
        
        // 创建用户站点关联
        UserSiteRel rel = new UserSiteRel();
        rel.setUserId(creatorId);
        rel.setSiteId(siteInfo.getId());
        rel.setCreateTime(LocalDateTime.now());
        userSiteRelService.save(rel);
        
        log.info("创建站点成功：{}, creatorId: {}", siteInfo.getDomain(), creatorId);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateSite(SiteInfo siteInfo) {
        SiteInfo existSite = getById(siteInfo.getId());
        if (existSite == null) {
            throw new BusinessException(ErrorCode.SITE_NOT_FOUND);
        }
        
        // 如果域名发生变化，检查新域名是否已被使用
        if (!existSite.getDomain().equals(siteInfo.getDomain())) {
            SiteInfo domainExist = getByDomain(siteInfo.getDomain());
            if (domainExist != null && !domainExist.getId().equals(siteInfo.getId())) {
                throw new BusinessException(ErrorCode.SITE_DOMAIN_EXISTS);
            }
        }
        
        updateById(siteInfo);
        log.info("更新站点成功：{}", siteInfo.getDomain());
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateSiteWithPermissionCheck(SiteInfo siteInfo, Long userId) {
        // 1. 查询站点是否存在
        SiteInfo existSite = getById(siteInfo.getId());
        if (existSite == null) {
            throw new BusinessException(ErrorCode.SITE_NOT_FOUND);
        }
        
        // 2. 校验用户是否有该站点的权限
        UserSiteRel userSiteRel = userSiteRelService.getOne(
            new LambdaQueryWrapper<UserSiteRel>()
                .eq(UserSiteRel::getUserId, userId)
                .eq(UserSiteRel::getSiteId, siteInfo.getId())
        );
        
        if (userSiteRel == null) {
            log.warn("用户无权限更新该站点：userId: {}, siteId: {}", userId, siteInfo.getId());
            throw new BusinessException(ErrorCode.NO_SITE_PERMISSION);
        }
        
        // 3. 如果域名发生变化，检查新域名是否已被使用
        if (!existSite.getDomain().equals(siteInfo.getDomain())) {
            SiteInfo domainExist = getByDomain(siteInfo.getDomain());
            if (domainExist != null && !domainExist.getId().equals(siteInfo.getId())) {
                throw new BusinessException(ErrorCode.SITE_DOMAIN_EXISTS);
            }
        }
        
        // 4. 更新站点
        updateById(siteInfo);
        log.info("更新站点成功：{}, userId: {}", siteInfo.getDomain(), userId);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteSite(Long id) {
        SiteInfo siteInfo = getById(id);
        if (siteInfo == null) {
            throw new BusinessException(ErrorCode.SITE_NOT_FOUND);
        }
        
        // 逻辑删除
        removeById(id);
        
        // 删除用户站点关联
        userSiteRelService.removeUserSiteRel(id);
        
        log.info("删除站点成功：{}", id);
    }
}
