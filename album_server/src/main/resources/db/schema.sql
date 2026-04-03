-- ============================================
-- 个人相册管理与在线展示系统 - 数据库初始化脚本
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS album_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE album_db;

-- ============================================
-- 1. 账号表 (sys_account)
-- ============================================
DROP TABLE IF EXISTS `sys_account`;
CREATE TABLE `sys_account` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(255) NOT NULL COMMENT 'BCrypt 加密密码',
    `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录 IP',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `login_fail_ip` VARCHAR(50) DEFAULT NULL COMMENT '登录失败 IP',
    `login_fail_time` DATETIME DEFAULT NULL COMMENT '登录失败时间',
    `login_fail_count` INT DEFAULT 0 COMMENT '登录失败次数',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_username` (`username`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '账号表' ROW_FORMAT = Dynamic;

-- ============================================
-- 2. 站点表 (site_info)
-- ============================================
DROP TABLE IF EXISTS `site_info`;
CREATE TABLE `site_info` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `domain` VARCHAR(255) NOT NULL COMMENT '站点域名 (唯一)',
    `title` VARCHAR(100) NOT NULL COMMENT '站点标题',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '站点描述',
    `creator_id` BIGINT NOT NULL COMMENT '创建用户 ID',
    `bucket_name` VARCHAR(100) NOT NULL COMMENT 'OSS Bucket 名称',
    `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标识 (0-未删除，1-已删除)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `admin_url` VARCHAR(200) DEFAULT NULL COMMENT '管理页面链接',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_domain` (`domain`) USING BTREE,
    INDEX `idx_creator_id` (`creator_id`) USING BTREE,
    INDEX `idx_deleted` (`deleted`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '站点表' ROW_FORMAT = Dynamic;

-- ============================================
-- 3. 用户站点关联表 (user_site_rel)
-- ============================================
DROP TABLE IF EXISTS `user_site_rel`;
CREATE TABLE `user_site_rel` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `user_id` BIGINT NOT NULL COMMENT '用户 ID',
    `site_id` BIGINT NOT NULL COMMENT '站点 ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_user_site` (`user_id`, `site_id`) USING BTREE,
    INDEX `idx_site_id` (`site_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户站点关联表' ROW_FORMAT = Dynamic;

-- ============================================
-- 4. 相册表 (album)
-- ============================================
DROP TABLE IF EXISTS `album`;
CREATE TABLE `album` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `site_id` BIGINT NOT NULL COMMENT '站点 ID',
    `year` INT DEFAULT NULL COMMENT '所属年份',
    `need_password` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要密码 (0-否，1-是)',
    `password` VARCHAR(50) DEFAULT NULL COMMENT '相册密码 (明文)',
    `oss_prefix` VARCHAR(255) DEFAULT NULL COMMENT 'OSS 路径前缀',
    `title` VARCHAR(100) NOT NULL COMMENT '相册标题',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '相册描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
    `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标识 (0-未删除，1-已删除)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_site_id` (`site_id`) USING BTREE,
    INDEX `idx_year` (`year`) USING BTREE,
    INDEX `idx_sort_order` (`sort_order`) USING BTREE,
    INDEX `idx_deleted` (`deleted`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '相册表' ROW_FORMAT = Dynamic;

-- ============================================
-- 5. 媒体资源表 (media_resource)
-- ============================================
DROP TABLE IF EXISTS `media_resource`;
CREATE TABLE `media_resource` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `album_id` BIGINT NOT NULL COMMENT '相册 ID',
    `original_filename` VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `original_url` VARCHAR(500) NOT NULL COMMENT '原始文件 URL',
    `thumbnail_url` VARCHAR(500) DEFAULT NULL COMMENT '缩略图 URL',
    `exif_info` JSON DEFAULT NULL COMMENT 'EXIF 信息 (JSON)',
    `shoot_time` DATETIME DEFAULT NULL COMMENT '拍摄时间',
    `upload_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    `type` VARCHAR(20) NOT NULL COMMENT '类型 (PHOTO/VIDEO)',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
    `is_cover` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否封面 (0-否，1-是)',
    `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标识 (0-未删除，1-已删除)',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_album_id` (`album_id`) USING BTREE,
    INDEX `idx_type` (`type`) USING BTREE,
    INDEX `idx_sort_order` (`sort_order`) USING BTREE,
    INDEX `idx_is_cover` (`is_cover`) USING BTREE,
    INDEX `idx_deleted` (`deleted`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '媒体资源表' ROW_FORMAT = Dynamic;

-- ============================================
-- 6. 标签表 (tag)
-- ============================================
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '标签名称 (唯一)',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_name` (`name`) USING BTREE,
    INDEX `idx_sort_order` (`sort_order`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签表' ROW_FORMAT = Dynamic;

-- ============================================
-- 7. 媒体标签关联表 (media_tag_rel)
-- ============================================
DROP TABLE IF EXISTS `media_tag_rel`;
CREATE TABLE `media_tag_rel` (
    `media_id` BIGINT NOT NULL COMMENT '媒体 ID',
    `tag_id` BIGINT NOT NULL COMMENT '标签 ID',
    PRIMARY KEY (`media_id`, `tag_id`) USING BTREE,
    INDEX `idx_tag_id` (`tag_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '媒体标签关联表' ROW_FORMAT = Dynamic;

-- ============================================
-- 8. 站点 Banner 表 (site_banner)
-- ============================================
DROP TABLE IF EXISTS `site_banner`;
CREATE TABLE `site_banner` (
    `id` BIGINT NOT NULL COMMENT '主键 ID',
    `site_id` BIGINT NOT NULL COMMENT '站点 ID',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
    `image_url` VARCHAR(500) NOT NULL COMMENT '图片 URL',
    `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
    `exif_info` JSON DEFAULT NULL COMMENT 'EXIF 信息 (JSON)',
    `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标识 (0-未删除，1-已删除)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_site_id` (`site_id`) USING BTREE,
    INDEX `idx_sort_order` (`sort_order`) USING BTREE,
    INDEX `idx_deleted` (`deleted`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '站点 Banner 表' ROW_FORMAT = Dynamic;

