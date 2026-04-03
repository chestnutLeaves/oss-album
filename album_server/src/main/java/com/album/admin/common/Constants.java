package com.album.admin.common;

/**
 * 常量定义
 */
public class Constants {
    
    /**
     * 媒体类型
     */
    public static class MediaType {
        public static final String PHOTO = "PHOTO";
        public static final String VIDEO = "VIDEO";
    }
    
    /**
     * 逻辑删除标识
     */
    public static class Deleted {
        public static final Integer NO = 0;
        public static final Integer YES = 1;
    }
    
    /**
     * 是否需要密码
     */
    public static class NeedPassword {
        public static final Integer NO = 0;
        public static final Integer YES = 1;
    }
    
    /**
     * 是否封面
     */
    public static class IsCover {
        public static final Integer NO = 0;
        public static final Integer YES = 1;
    }
    
    /**
     * Token Header
     */
    public static final String TOKEN_HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
    
    /**
     * 默认分页参数
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int DEFAULT_PAGE_NUM = 1;
}
