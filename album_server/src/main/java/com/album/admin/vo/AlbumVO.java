package com.album.admin.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 相册视图对象
 */
@Data
public class AlbumVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 站点 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long siteId;
    
    /**
     * 所属年份
     */
    private Integer year;
    
    /**
     * 是否需要密码 (0-否，1-是)
     */
    private Integer needPassword;
    
    /**
     * 相册密码 (管理员可见)
     */
    private String password;
    
    /**
     * OSS 路径前缀
     */
    private String ossPrefix;
    
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
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 封面图 URL 列表
     */
    private List<String> coverImages;
}
