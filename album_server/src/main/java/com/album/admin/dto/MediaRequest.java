package com.album.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 媒体资源请求 DTO
 */
@Data
public class MediaRequest {
    
    private Long id;
    
    private Long albumId;
    
    private String originalFilename;
    
    private String originalUrl;
    
    private String thumbnailUrl;
    
    private String exifInfo;
    
    private LocalDateTime shootTime;
    
    private String type; // PHOTO/VIDEO
    
    private String description;
    
    private Integer sortOrder;
    
    /**
     * 是否封面 (0-否，1-是)
     */
    private Integer isCover;
    
    private List<Long> tagIds; // 标签 ID 列表
}
