package com.album.admin.controller.open;

import com.album.admin.common.ErrorCode;
import com.album.admin.common.Result;
import com.album.admin.dto.AlbumDetailRequest;
import com.album.admin.exception.BusinessException;
import com.album.admin.service.AlbumService;
import com.album.admin.vo.AlbumDetailVO;
import com.github.benmanes.caffeine.cache.Cache;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 相册开放接口 Controller
 */
@RestController
@RequestMapping("/open/albums")
@RequiredArgsConstructor
public class AlbumOpenController {
    
    private final AlbumService albumService;
    private final Cache<String, Object> albumDetailCache;
    
    /**
     * 获取相册详情（需要密码验证）
     */
    @GetMapping("/detail")
    public Result<AlbumDetailVO> getAlbumDetail(@Valid @ModelAttribute AlbumDetailRequest request) {
        // 缓存 key 不包含密码，只缓存校验成功后的数据
        String cacheKey = "album:" + request.getId();
        
        // 尝试从缓存中获取（只有密码验证成功后才会缓存）
        AlbumDetailVO cachedResult = (AlbumDetailVO) albumDetailCache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            return Result.success(cachedResult);
        }
        
        // 将字符串类型的 ID 转换为 Long
        Long albumId;
        try {
            albumId = Long.parseLong(request.getId());
        } catch (NumberFormatException e) {
            // 转换失败，认为相册不存在
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 调用 Service 获取相册详情（包含密码验证）
        AlbumDetailVO albumDetail = albumService.getAlbumDetailWithPasswordCheck(albumId, request.getPassword());
        
        if (albumDetail == null) {
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 存入缓存
        albumDetailCache.put(cacheKey, albumDetail);
        
        return Result.success(albumDetail);
    }
}
