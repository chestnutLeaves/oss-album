package com.album.admin.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 站点配置视图对象（精简版，仅包含标题和描述）
 */
@Data
public class SiteConfigVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 站点标题
     */
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
