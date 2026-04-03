package com.album.admin.dto;

import lombok.Data;

/**
 * 相册详情请求 DTO（开放接口）
 */
@Data
public class AlbumDetailRequest {

    /**
     * 相册 ID（字符串类型，接收后转换为 Long）
     */
    private String id;

    /**
     * 相册密码
     */
    private String password;
}
