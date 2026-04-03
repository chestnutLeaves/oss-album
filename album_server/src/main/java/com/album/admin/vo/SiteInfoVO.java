package com.album.admin.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 站点信息视图对象（开放接口）
 */
@Data
public class SiteInfoVO implements Serializable {
    
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
    
    /**
     * Banner 列表
     */
    private List<BannerVO> banners;
    
    /**
     * 相册列表
     */
    private List<AlbumSimpleVO> albums;
}
