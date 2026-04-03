package com.album.admin.controller.open;

import com.album.admin.common.Result;
import com.album.admin.dto.MediaSearchRequest;
import com.album.admin.service.AlbumService;
import com.album.admin.util.HttpUtil;
import com.album.admin.vo.MediaSimpleVO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 搜索开放接口 Controller
 */
@RestController
@RequestMapping("/open/search")
@RequiredArgsConstructor
public class SearchController {
    
    private final AlbumService albumService;
    
    /**
     * 搜索媒体资源（支持关键词和标签过滤）
     */
    @GetMapping("/media")
    public Result<List<MediaSimpleVO>> searchMedia(MediaSearchRequest request,
                                                    HttpServletRequest httpRequest) {
        // 从 Referer 中提取域名
        String referer = httpRequest.getHeader("Referer");
        if (referer == null || referer.isEmpty()) {
            return Result.error("无法获取来源域名");
        }
        
        String domain = HttpUtil.extractDomain(referer);
        
        // 调用 Service 进行搜索
        List<MediaSimpleVO> results = albumService.searchMedia(
            domain, 
            request.getKeyword(), 
            request.getTagIds()
        );
        
        return Result.success(results);
    }
}
