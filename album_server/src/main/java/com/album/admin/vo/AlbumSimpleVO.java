package com.album.admin.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 相册视图对象（开放接口）
 */
@Data
public class AlbumSimpleVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 所属年份
     */
    private Integer year;
    
    /**
     * 是否需要密码 (0-否，1-是)
     */
    private Integer needPassword;
    
    /**
     * 相册标题
     */
    private String title;
    
    /**
     * 相册描述
     */
    private String description;
    
    /**
     * 排序值
     */
    private Integer sortOrder;
    
    /**
     * 封面图 URL 列表
     */
    private List<String> coverImages;
}
