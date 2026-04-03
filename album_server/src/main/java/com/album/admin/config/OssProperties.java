package com.album.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * 阿里云 OSS 配置属性类
 */
@ConfigurationProperties(prefix = "aliyun.oss")
@Data
@Slf4j
public class OssProperties {

    /**
     * 阿里云 AccessKey ID
     */
    private String accessKeyId;
    
    /**
     * 阿里云 AccessKey Secret
     */
    private String accessKeySecret;
    
    /**
     * STS 临时授权 Token 的有效时长（秒）
     */
    private Long stsDurationSeconds;
    
    /**
     * RAM 角色 ARN，用于 STS 授权
     */
    private String roleArn;
    
    /**
     * 默认存储空间 (Bucket) 名称
     */
    private String bucketName;
    
    /**
     * OSS 存储区域，例如：cn-shanghai
     */
    private String region;
    
    /**
     * OSS 自定义域名或默认外网域名
     */
    private String bucketDomain;

    /**
     * 启动后检查配置是否完整
     */
    @PostConstruct
    public void checkConfig() {
        boolean hasError = false;
        if (accessKeyId == null || accessKeyId.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.access-key-id 未配置");
            hasError = true;
        }
        if (accessKeySecret == null || accessKeySecret.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.access-key-secret 未配置");
            hasError = true;
        }
        if (stsDurationSeconds == null) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.sts-duration-seconds 未配置");
            hasError = true;
        }
        if (roleArn == null || roleArn.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.role-arn 未配置");
            hasError = true;
        }
        if (bucketName == null || bucketName.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.bucket-name 未配置");
            hasError = true;
        }
        if (region == null || region.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.region 未配置");
            hasError = true;
        }
        if (bucketDomain == null || bucketDomain.isEmpty()) {
            log.warn("阿里云 OSS 配置错误：aliyun.oss.bucket-domain 未配置");
            hasError = true;
        }

        if (hasError) {
            log.warn("阿里云 OSS 配置不完整，部分功能可能受限，图片上传功能无法正常工作。请检查 application.yml 中的 aliyun.oss 配置。");
        } else {
            log.info("阿里云 OSS 配置检查通过");
        }
    }
}
