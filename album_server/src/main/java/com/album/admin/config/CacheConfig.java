package com.album.admin.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 缓存配置
 */
@Configuration
public class CacheConfig {
    
    /**
     * 站点信息缓存（60 秒被动过期）
     */
    @Bean
    public Cache<String, Object> siteInfoCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .build();
    }
    
    /**
     * 标签列表缓存（60 秒被动过期）
     */
    @Bean
    public Cache<String, Object> tagListCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .build();
    }
    
    /**
     * 相册详情缓存（60 秒被动过期）
     */
    @Bean
    public Cache<String, Object> albumDetailCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .build();
    }
}
