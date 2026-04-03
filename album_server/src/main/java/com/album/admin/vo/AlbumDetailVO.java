package com.album.admin.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 相册详情视图对象（开放接口）
 */
@Data
public class AlbumDetailVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 所属年份
     */
    private Integer year;
    
    /**
     * 相册标题
     */
    private String title;
    
    /**
     * 相册描述
     */
    private String description;
    
    /**
     * 媒体资源列表
     */
    private List<MediaSimpleVO> mediaList;
    
    /**
     * 标签列表（去重）
     */
    private List<TagVO> tags;
}
