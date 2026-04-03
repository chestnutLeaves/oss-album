package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.SysAccount;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.SysAccountMapper;
import com.album.admin.service.SysAccountService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 账号服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysAccountServiceImpl extends ServiceImpl<SysAccountMapper, SysAccount> implements SysAccountService {
    
    private final PasswordEncoder passwordEncoder;
    
    // 使用 Caffeine 缓存 Token
    private final Map<String, TokenInfo> tokenCache = new ConcurrentHashMap<>();
    
    @Value("${security.login.max-fail-count:5}")
    private Integer maxFailCount;
    
    @Value("${security.login.lock-time:1800}")
    private Integer lockTime;
    
    @Value("${token.expiration:86400}")
    private Long tokenExpiration;
    
    /**
     * Token 信息内部类
     */
    private static class TokenInfo {
        private final Long userId;
        private final LocalDateTime expireTime;
        
        public TokenInfo(Long userId, LocalDateTime expireTime) {
            this.userId = userId;
            this.expireTime = expireTime;
        }
    }
    
    @Override
    public SysAccount getByUsername(String username) {
        LambdaQueryWrapper<SysAccount> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysAccount::getUsername, username);
        return getOne(wrapper);
    }
    
    @Override
    public String login(String username, String password, String ip) {
        // 1. 查询用户
        SysAccount account = getByUsername(username);
        if (account == null) {
            // 防止时间攻击，即使不存在也执行相同的加密操作
            passwordEncoder.encode(password);
            throw new BusinessException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }
        
        // 2. 检查账号是否被锁定
        if (account.getLoginFailCount() != null && account.getLoginFailCount() >= maxFailCount) {
            if (account.getLoginFailTime() != null) {
                long minutesPassed = java.time.Duration.between(
                    account.getLoginFailTime(), 
                    LocalDateTime.now()
                ).toMinutes();
                if (minutesPassed < lockTime / 60) {
                    throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
                }
            }
        }
        
        // 3. 校验密码
        if (!passwordEncoder.matches(password, account.getPassword())) {
            // 更新失败次数
            updateLoginFail(account, ip);
            throw new BusinessException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }
        
        // 4. 登录成功，清除失败记录
        clearLoginFail(account);
        
        // 5. 生成 Token
        String token = generateToken(account.getId());
        
        // 6. 更新最后登录信息
        updateLastLogin(account, ip);
        
        log.info("用户登录成功：{}, IP: {}", username, ip);
        return token;
    }
    
    @Override
    public void logout(String token) {
        tokenCache.remove(token);
        log.info("用户退出登录，Token: {}", token);
    }
    
    /**
     * 验证 Token
     */
    public Long verifyToken(String token) {
        TokenInfo tokenInfo = tokenCache.get(token);
        if (tokenInfo == null) {
            return null;
        }
        
        if (LocalDateTime.now().isAfter(tokenInfo.expireTime)) {
            tokenCache.remove(token);
            return null;
        }
        
        return tokenInfo.userId;
    }
    
    /**
     * 更新登录失败记录
     */
    private void updateLoginFail(SysAccount account, String ip) {
        account.setLoginFailIp(ip);
        account.setLoginFailTime(LocalDateTime.now());
        account.setLoginFailCount(
            account.getLoginFailCount() == null ? 1 : account.getLoginFailCount() + 1
        );
        updateById(account);
        log.warn("用户登录失败：{}, IP: {}, 失败次数：{}", 
            account.getUsername(), ip, account.getLoginFailCount());
    }
    
    /**
     * 清除登录失败记录
     */
    private void clearLoginFail(SysAccount account) {
        account.setLoginFailIp(null);
        account.setLoginFailTime(null);
        account.setLoginFailCount(0);
        updateById(account);
    }
    
    /**
     * 更新最后登录信息
     */
    private void updateLastLogin(SysAccount account, String ip) {
        account.setLastLoginIp(ip);
        account.setLastLoginTime(LocalDateTime.now());
        updateById(account);
    }
    
    /**
     * 生成 Token
     */
    private String generateToken(Long userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expireTime = LocalDateTime.now().plusSeconds(tokenExpiration);
        tokenCache.put(token, new TokenInfo(userId, expireTime));
        return token;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        // 1. 查询用户
        SysAccount account = getById(userId);
        if (account == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        
        // 2. 检查新密码是否与旧密码相同（明文比较）
        if (oldPassword.equals(newPassword)) {
            log.warn("用户修改密码失败：新密码不能与旧密码相同，userId: {}", userId);
            throw new BusinessException(ErrorCode.ERROR, "新密码不能与旧密码相同");
        }
        
        // 3. 验证旧密码（BCrypt 匹配）
        if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
            log.warn("用户修改密码失败：旧密码验证失败，userId: {}", userId);
            throw new BusinessException(ErrorCode.OLD_PASSWORD_ERROR);
        }
        
        // 4. BCrypt 加密新密码并更新
        account.setPassword(passwordEncoder.encode(newPassword));
        updateById(account);
        
        log.info("用户修改密码成功：userId: {}", userId);
    }
}
