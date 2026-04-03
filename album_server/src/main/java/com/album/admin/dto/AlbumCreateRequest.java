package com.album.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 相册创建请求 DTO
 */
@Data
public class AlbumCreateRequest {
    
    /**
     * 站点 ID
     */
    @NotNull(message = "站点 ID 不能为空")
    private Long siteId;
    
    /**
     * 所属年份
     */
    @NotNull(message = "年份不能为空")
    private Integer year;
    
    /**
     * 是否需要密码 (0-否，1-是)
     */
    @NotNull(message = "是否需要密码不能为空")
    private Integer needPassword;
    
    /**
     * 相册密码 (明文)
     */
    private String password;
    
    /**
     * OSS 路径前缀
     */
    @NotBlank(message = "OSS 路径前缀不能为空")
    private String ossPrefix;
    
    /**
     * 相册标题
     */
    @NotBlank(message = "相册标题不能为空")
    private String title;
    
    /**
     * 相册描述
     */
    @NotBlank(message = "相册描述不能为空")
    private String description;
    
    /**
     * 排序值
     */
    @NotNull(message = "排序值不能为空")
    private Integer sortOrder;
}
