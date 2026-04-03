package com.album.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

/**
 * 个人相册管理与在线展示系统 - 启动类
 */
@SpringBootApplication
@MapperScan("com.album.admin.mapper")
@EnableCaching
@ConfigurationPropertiesScan
public class AlbumAdminApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AlbumAdminApplication.class, args);
    }
}
