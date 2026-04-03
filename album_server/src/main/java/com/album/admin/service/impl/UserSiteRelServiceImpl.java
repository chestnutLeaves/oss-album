package com.album.admin.service.impl;

import com.album.admin.entity.UserSiteRel;
import com.album.admin.mapper.UserSiteRelMapper;
import com.album.admin.service.UserSiteRelService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户站点关联服务实现类
 */
@Service
public class UserSiteRelServiceImpl extends ServiceImpl<UserSiteRelMapper, UserSiteRel> implements UserSiteRelService {
    
    @Override
    public List<UserSiteRel> getUserSiteRels(Long userId) {
        LambdaQueryWrapper<UserSiteRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserSiteRel::getUserId, userId);
        return list(wrapper);
    }
    
    @Override
    public void removeUserSiteRel(Long siteId) {
        LambdaQueryWrapper<UserSiteRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserSiteRel::getSiteId, siteId);
        remove(wrapper);
    }
    
    @Override
    public boolean hasPermission(Long userId, Long siteId) {
        // 查询用户与该站点的关联关系
        LambdaQueryWrapper<UserSiteRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserSiteRel::getUserId, userId)
               .eq(UserSiteRel::getSiteId, siteId);
        UserSiteRel rel = getOne(wrapper);
        return rel != null;
    }
}
