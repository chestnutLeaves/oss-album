package com.album.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 账号实体
 */
@Data
@TableName("sys_account")
public class SysAccount implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 登录账号
     */
    private String username;
    
    /**
     * BCrypt 加密密码
     */
    private String password;
    
    /**
     * 最后登录 IP
     */
    private String lastLoginIp;
    
    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginTime;
    
    /**
     * 登录失败 IP
     */
    private String loginFailIp;
    
    /**
     * 登录失败时间
     */
    private LocalDateTime loginFailTime;
    
    /**
     * 登录失败次数
     */
    private Integer loginFailCount;
    
    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
