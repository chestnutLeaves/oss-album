package com.album.admin.util;

/**
 * HTTP 请求工具类
 */
public class HttpUtil {
    
    /**
     * 从 URL 中提取域名
     * @param url 完整的 URL（如 https://example.com/album）
     * @return 域名（如 example.com）
     */
    public static String extractDomain(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        // 移除协议前缀
        if (url.startsWith("http://")) {
            url = url.substring(7);
        } else if (url.startsWith("https://")) {
            url = url.substring(8);
        }
        
        // 截取第一个斜杠之前的部分
        int slashIndex = url.indexOf('/');
        if (slashIndex > 0) {
            url = url.substring(0, slashIndex);
        }
        
        return url;
    }
}
