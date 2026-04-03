package com.album.admin.service;

import com.album.admin.entity.UserSiteRel;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 用户站点关联服务接口
 */
public interface UserSiteRelService extends IService<UserSiteRel> {
    
    /**
     * 获取用户的站点关联列表
     */
    List<UserSiteRel> getUserSiteRels(Long userId);
    
    /**
     * 删除站点的所有关联
     */
    void removeUserSiteRel(Long siteId);
    
    /**
     * 校验用户是否有站点的管理权限
     * @param userId 用户 ID
     * @param siteId 站点 ID
     * @return true-有权限，false-无权限
     */
    boolean hasPermission(Long userId, Long siteId);
}
