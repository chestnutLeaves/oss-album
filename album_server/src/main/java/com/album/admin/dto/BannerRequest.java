package com.album.admin.dto;

import lombok.Data;

/**
 * Banner 请求 DTO
 */
@Data
public class BannerRequest {
    
    private Long id;
    
    private Long siteId;
    
    private Integer sortOrder;
    
    private String imageUrl;
    
    private String title;
    
    private String description;
    
    private String exifInfo;
}
