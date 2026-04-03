package com.album.admin.service.impl;

import com.album.admin.config.OssProperties;
import com.album.admin.exception.BusinessException;
import com.album.admin.service.OssService;
import com.album.admin.service.SiteInfoService;
import com.album.admin.dto.StsTokenResponse;
import com.album.admin.entity.SiteInfo;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.auth.sts.AssumeRoleRequest;
import com.aliyuncs.auth.sts.AssumeRoleResponse;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.profile.IClientProfile;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * OSS 服务实现类
 * STS 直传 参考文档
 * https://help.aliyun.com/zh/oss/user-guide/uploading-objects-to-oss-directly-from-clients/?spm=a2c4g.11174283.help-menu-31815.d_0_3_2.56e57dcfxAslHO
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssServiceImpl implements OssService {

    private final OssProperties ossProperties;

    // STS Token 缓存 - key 为 bucketName, value 为 StsTokenResponse
    private Cache<String, StsTokenResponse> stsTokenCache;

    @Override
    public StsTokenResponse getStsToken() {
        return getStsToken(null);
    }

    @Override
    public StsTokenResponse getStsToken(Long siteId) {
        // 1. 确定 bucketName
        String bucketName = ossProperties.getBucketName();

        // 2. 先尝试从缓存获取
        StsTokenResponse cachedToken = stsTokenCache.getIfPresent(bucketName);
        if (cachedToken != null) {
            log.info("从缓存获取 STS Token, Bucket: {}", bucketName);
            return cachedToken;
        }

        // 3. 创建 stsToken
        StsTokenResponse stsToken = createStsToken(bucketName);

        // 4. 设置 region 和 bucketName
        // 前端使用region要拼接oss
        stsToken.setRegion("oss-" + ossProperties.getRegion());
        stsToken.setBucketName(bucketName);
        stsToken.setPublicDomain(ossProperties.getBucketDomain());
        // 5. 存入缓存
        stsTokenCache.put(bucketName, stsToken);
        return stsToken;
    }

    /**
     * 创建STS令牌
     *
     * @param roleSessionName 自定义角色会话名称，用来区分不同的令牌，例如可填写为SessionTest。
     * @return {@link StsTokenResponse }
     */
    private StsTokenResponse createStsToken(String roleSessionName) {
        try {
            // 发起STS请求所在的地域
            String regionId = ossProperties.getRegion();
            IClientProfile profile = DefaultProfile.getProfile(regionId, ossProperties.getAccessKeyId(),
                    ossProperties.getAccessKeySecret());
            // 构造client。
            DefaultAcsClient client = new DefaultAcsClient(profile);
            final AssumeRoleRequest request = new AssumeRoleRequest();
            request.setSysMethod(MethodType.POST);
            request.setRoleArn(ossProperties.getRoleArn());
            request.setRoleSessionName(roleSessionName);
            request.setDurationSeconds(ossProperties.getStsDurationSeconds());
            final AssumeRoleResponse response = client.getAcsResponse(request);
            AssumeRoleResponse.Credentials credentials = response.getCredentials();
            log.info("刷新STS toke成功 requestId: {} Expriation: {}", response.getRequestId(), credentials.getExpiration());
            return new StsTokenResponse(credentials.getAccessKeyId(), credentials.getAccessKeySecret(),
                    credentials.getSecurityToken(), credentials.getExpiration(), null, null, null);
        } catch (ClientException e) {
            System.out.println("Failed：");
            System.out.println("Error code: " + e.getErrCode());
            System.out.println("Error message: " + e.getErrMsg());
            System.out.println("RequestId: " + e.getRequestId());
            throw new BusinessException("生成上传凭证失败：" + e.getMessage());
        }
    }

    /**
     * 初始化缓存，因为其依赖外部配置
     */
    @PostConstruct
    public void initCache() {
        Long durationSeconds = ossProperties.getStsDurationSeconds() != null ? ossProperties.getStsDurationSeconds()
                : 3600L;
        stsTokenCache = Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(durationSeconds - 300, TimeUnit.SECONDS) // 提前 5 分钟过期
                .recordStats()
                .build();
    }
}
