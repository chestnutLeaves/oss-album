package com.album.admin.common;

import lombok.Getter;

/**
 * 业务错误码枚举
 */
@Getter
public enum ErrorCode {
    
    // 通用错误 (1xxx)
    SUCCESS(0, "操作成功"),
    ERROR(1001, "操作失败"),
    PARAM_ERROR(1002, "参数错误"),
    NOT_FOUND(1004, "资源不存在"),
    UNAUTHORIZED(1003, "未授权"),
    FORBIDDEN(1005, "无权限"),
    
    // 认证相关 (2xxx)
    LOGIN_FAILED(2001, "登录失败"),
    TOKEN_INVALID(2002, "Token 无效或已过期"),
    ACCOUNT_LOCKED(2003, "账号已被锁定"),
    USERNAME_OR_PASSWORD_ERROR(2004, "用户名或密码错误"),
    OLD_PASSWORD_ERROR(2005, "旧密码错误"),
    
    // 站点相关 (3xxx)
    SITE_NOT_FOUND(3001, "站点不存在"),
    SITE_DOMAIN_EXISTS(3002, "站点域名已存在"),
    NO_SITE_PERMISSION(3003, "无站点访问权限"),
    
    // 相册相关 (4xxx)
    ALBUM_NOT_FOUND(4001, "相册不存在"),
    ALBUM_PASSWORD_REQUIRED(4002, "需要密码"),
    ALBUM_PASSWORD_ERROR(4003, "相册密码错误"),
    ALBUM_OSS_PREFIX_EXISTS(4004, "OSS 路径前缀已存在"),
    
    // 媒体相关 (5xxx)
    MEDIA_NOT_FOUND(5001, "媒体资源不存在"),
    UPLOAD_FAILED(5002, "上传失败"),
    
    // 标签相关 (6xxx)
    TAG_NOT_FOUND(6001, "标签不存在"),
    TAG_NAME_EXISTS(6002, "标签名称已存在"),
    
    // Banner 相关 (7xxx)
    BANNER_NOT_FOUND(7001, "Banner 不存在");
    
    private final Integer code;
    private final String message;
    
    ErrorCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
