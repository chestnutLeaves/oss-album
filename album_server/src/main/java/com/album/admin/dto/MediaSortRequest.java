package com.album.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 媒体资源拖拽排序请求 DTO
 */
@Data
public class MediaSortRequest {
    
    /**
     * 媒体资源 ID
     */
    @NotNull(message = "媒体资源 ID 不能为空")
    private Long id;
    
    /**
     * 新的排序值
     */
    @NotNull(message = "排序值不能为空")
    private Integer newSortOrder;
}
