package com.album.admin.service;

import com.album.admin.entity.SysAccount;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * 账号服务接口
 */
public interface SysAccountService extends IService<SysAccount> {
    
    /**
     * 根据用户名查询账号
     */
    SysAccount getByUsername(String username);
    
    /**
     * 登录
     * @param username 用户名
     * @param password 密码
     * @param ip IP 地址
     * @return Token
     */
    String login(String username, String password, String ip);
    
    /**
     * 退出登录
     * @param token Token
     */
    void logout(String token);
    
    /**
     * 修改密码
     * @param userId 用户 ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     */
    void changePassword(Long userId, String oldPassword, String newPassword);
}
