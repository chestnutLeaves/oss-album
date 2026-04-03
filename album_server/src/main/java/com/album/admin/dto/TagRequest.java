package com.album.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 标签请求 DTO
 */
@Data
public class TagRequest {
    
    private Long id;
    @NotBlank(message = "标签名称不能为空")
    private String name;
    @NotNull(message = "排序值不能为空")
    private Integer sortOrder;
}
