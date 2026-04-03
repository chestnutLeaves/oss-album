package com.album.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 站点请求 DTO
 */
@Data
public class SiteRequest {
    
    @NotBlank(message = "站点域名不能为空")
    private String domain;
    
    @NotBlank(message = "站点标题不能为空")
    private String title;
    
    private String description;
    
    private String adminUrl;

}
