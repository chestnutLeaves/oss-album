package com.album.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 相册实体
 */
@Data
@TableName("album")
public class Album implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 站点 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long siteId;
    
    /**
     * 所属年份
     */
    private Integer year;
    
    /**
     * 是否需要密码 (0-否，1-是)
     */
    private Integer needPassword;
    
    /**
     * 相册密码 (明文)
     */
    private String password;
    
    /**
     * OSS 路径前缀
     */
    private String ossPrefix;
    
    /**
     * 相册标题
     */
    private String title;
    
    /**
     * 相册描述
     */
    private String description;
    
    /**
     * 排序值
     */
    private Integer sortOrder;
    
    /**
     * 逻辑删除标识 (0-未删除，1-已删除)
     */
    @TableLogic
    private Integer deleted;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
