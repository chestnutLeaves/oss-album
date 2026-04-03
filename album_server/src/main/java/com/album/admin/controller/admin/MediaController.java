package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.MediaRequest;
import com.album.admin.dto.MediaSortRequest;
import com.album.admin.entity.MediaResource;
import com.album.admin.service.MediaResourceService;
import com.album.admin.vo.MediaResourceVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 媒体资源管理 Controller
 */
@RestController
@RequestMapping("/admin/media")
@RequiredArgsConstructor
public class MediaController {
    
    private final MediaResourceService mediaResourceService;
    
    /**
     * 获取相册内的所有媒体列表（不分页）
     */
    @GetMapping("/list")
    public Result<List<MediaResourceVO>> getAlbumMediasAll(@RequestParam Long albumId) {
        List<MediaResourceVO> medias = mediaResourceService.getAlbumMediasAll(albumId);
        return Result.success(medias);
    }
    
    /**
     * 拖拽排序媒体资源
     */
    @PutMapping("/sort")
    public Result<Void> dragSort(@Valid @RequestBody MediaSortRequest request) {
        mediaResourceService.dragSort(request.getId(), request.getNewSortOrder());
        return Result.success();
    }
    
    /**
     * 创建媒体资源 (前端直传 OSS 后回调)
     */
    @PostMapping("/upload")
    public Result<Void> uploadMedia(@Valid @RequestBody MediaRequest request) {
        MediaResource mediaResource = new MediaResource();
        mediaResource.setAlbumId(request.getAlbumId());
        mediaResource.setOriginalFilename(request.getOriginalFilename());
        mediaResource.setOriginalUrl(request.getOriginalUrl());
        mediaResource.setThumbnailUrl(request.getThumbnailUrl());
        mediaResource.setExifInfo(request.getExifInfo());
        mediaResource.setShootTime(request.getShootTime());
        mediaResource.setType(request.getType());
        mediaResource.setDescription(request.getDescription());
        mediaResource.setSortOrder(request.getSortOrder());
        mediaResource.setIsCover(request.getIsCover());
        
        mediaResourceService.createMedia(mediaResource, request.getTagIds());
        return Result.success();
    }
    
    /**
     * 更新媒体资源
     */
    @PutMapping
    public Result<Void> updateMedia(@Valid @RequestBody MediaRequest request) {
        MediaResource mediaResource = new MediaResource();
        mediaResource.setId(request.getId());
        mediaResource.setExifInfo(request.getExifInfo());
        mediaResource.setDescription(request.getDescription());
        mediaResource.setSortOrder(request.getSortOrder());
        mediaResource.setIsCover(request.getIsCover());
        
        mediaResourceService.updateMedia(mediaResource, request.getTagIds());
        return Result.success();
    }
    
    /**
     * 删除媒体资源
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteMedia(@PathVariable Long id) {
        mediaResourceService.deleteMedia(id);
        return Result.success();
    }
}
