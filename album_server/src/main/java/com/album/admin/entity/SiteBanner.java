package com.album.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 站点 Banner 实体
 */
@Data
@TableName("site_banner")
public class SiteBanner implements Serializable {
    
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
     * 排序值
     */
    private Integer sortOrder;
    
    /**
     * 图片 URL
     */
    private String imageUrl;
    
    /**
     * 标题
     */
    private String title;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * EXIF 信息 (JSON)
     */
    private String exifInfo;
    
    /**
     * 逻辑删除标识 (0-未删除，1-已删除)
     */
    @TableLogic
    private Integer deleted;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
