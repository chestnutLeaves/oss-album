package com.album.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 站点更新请求 DTO
 */
@Data
public class SiteUpdateRequest {
    
    /**
     * 站点 ID（必填）
     */
    @NotNull(message = "站点 ID 不能为空")
    private Long id;
    
    /**
     * 站点域名（唯一）
     */
    @NotBlank(message = "站点域名不能为空")
    private String domain;
    
    /**
     * 站点标题
     */
    @NotBlank(message = "站点标题不能为空")
    private String title;
    
    /**
     * 站点描述
     */
    private String description;
    
    /**
     * 管理页面地址
     */
    private String adminUrl;
    
}
