package com.album.admin.service;

import com.album.admin.dto.StsTokenResponse;

/**
 * OSS 服务接口
 */
public interface OssService {
    
    /**
     * 获取阿里云 OSS STS 临时凭证
     */
    StsTokenResponse getStsToken();
    
    /**
     * 获取阿里云 OSS STS 临时凭证（指定站点）
     * @param siteId 站点 ID（可选）
     * @return STS Token 响应
     */
    StsTokenResponse getStsToken(Long siteId);
}
