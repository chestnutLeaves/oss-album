package com.album.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 媒体资源实体
 */
@Data
@TableName("media_resource")
public class MediaResource implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 相册 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long albumId;
    
    /**
     * 原始文件名
     */
    private String originalFilename;
    
    /**
     * 原始文件 URL
     */
    private String originalUrl;
    
    /**
     * 缩略图 URL
     */
    private String thumbnailUrl;
    
    /**
     * EXIF 信息 (JSON)
     */
    private String exifInfo;
    
    /**
     * 拍摄时间
     */
    private LocalDateTime shootTime;
    
    /**
     * 上传时间
     */
    private LocalDateTime uploadTime;
    
    /**
     * 类型 (PHOTO/VIDEO)
     */
    private String type;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * 排序值
     */
    private Integer sortOrder;
    
    /**
     * 是否封面 (0-否，1-是)
     */
    private Integer isCover;
    
    /**
     * 逻辑删除标识 (0-未删除，1-已删除)
     */
    @TableLogic
    private Integer deleted;
}
