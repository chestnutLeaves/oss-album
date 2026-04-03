package com.album.admin.dto;

import lombok.Data;

import java.util.List;

/**
 * 媒体资源搜索请求 DTO（开放接口）
 */
@Data
public class MediaSearchRequest {
    
    /**
     * 搜索关键词（可选）
     */
    private String keyword;
    
    /**
     * 标签 ID 列表（可选）
     */
    private List<Long> tagIds;
}
