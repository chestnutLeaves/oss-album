package com.album.admin.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * STS Token 响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StsTokenResponse {
    
    private String accessKeyId;
    private String accessKeySecret;
    private String securityToken;
    private String expiration;
}
