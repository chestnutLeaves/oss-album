package com.album.admin.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * Banner 视图对象（开放接口）
 */
@Data
public class BannerVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
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
}
