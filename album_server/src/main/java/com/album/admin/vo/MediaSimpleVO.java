package com.album.admin.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 媒体资源视图对象（开放接口）
 */
@Data
public class MediaSimpleVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 相册 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long albumId;
    
    /**
     * 相册标题
     */
    private String albumTitle;
    
    /**
     * 相册是否需要密码
     */
    private Integer albumNeedPassword;
    
    /**
     * 原始文件名
     */
    private String originalFilename;
    
    /**
     * 缩略图 URL
     */
    private String thumbnailUrl;
    
    /**
     * 原始文件 URL（源文件链接）
     */
    private String originalUrl;
    
    /**
     * 类型：PHOTO-图片，VIDEO-视频
     */
    private String type;
    
    /**
     * 媒体描述
     */
    private String description;
    
    /**
     * EXIF 信息（JSON 格式）
     */
    private String exifInfo;
    
    /**
     * 拍摄时间
     */
    private LocalDateTime shootTime;
    
    /**
     * 标签列表
     */
    private List<MediaTagVO> tags;
}
