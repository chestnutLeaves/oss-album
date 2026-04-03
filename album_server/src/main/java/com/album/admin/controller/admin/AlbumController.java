package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.AlbumCreateRequest;
import com.album.admin.dto.AlbumUpdateRequest;
import com.album.admin.dto.MediaSortRequest;
import com.album.admin.entity.Album;
import com.album.admin.service.AlbumService;
import com.album.admin.vo.AlbumVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 相册管理 Controller
 */
@RestController
@RequestMapping("/admin/albums")
@RequiredArgsConstructor
public class AlbumController {
    
    private final AlbumService albumService;
    
    /**
     * 获取站点下的相册列表 (支持按用户查询)
     * @param siteId 站点 ID(可选，不传则查询当前用户所有站点的相册)
     * @param userId 当前登录用户 ID(从 Token 中获取)
     */
    @GetMapping
    public Result<List<AlbumVO>> getSiteAlbums(
            @RequestParam(required = false) Long siteId,
            @AuthenticationPrincipal Long userId) {
        List<AlbumVO> albums = albumService.getUserAlbums(siteId, userId);
        return Result.success(albums);
    }
    
    /**
     * 创建相册
     */
    @PostMapping
    public Result<Void> createAlbum(@Valid @RequestBody AlbumCreateRequest request) {
        Album album = new Album();
        album.setSiteId(request.getSiteId());
        album.setYear(request.getYear());
        album.setNeedPassword(request.getNeedPassword());
        album.setPassword(request.getPassword());
        album.setOssPrefix(request.getOssPrefix());
        album.setTitle(request.getTitle());
        album.setDescription(request.getDescription());
        album.setSortOrder(request.getSortOrder());
        
        albumService.createAlbum(album);
        return Result.success();
    }
    
    /**
     * 更新相册
     */
    @PutMapping
    public Result<Void> updateAlbum(@Valid @RequestBody AlbumUpdateRequest request) {
        Album album = new Album();
        album.setId(request.getId());
        album.setYear(request.getYear());
        album.setNeedPassword(request.getNeedPassword());
        album.setPassword(request.getPassword());
        album.setOssPrefix(request.getOssPrefix());
        album.setTitle(request.getTitle());
        album.setDescription(request.getDescription());
        album.setSortOrder(request.getSortOrder());
        
        albumService.updateAlbum(album);
        return Result.success();
    }
    
    /**
     * 删除相册
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAlbum(@PathVariable Long id) {
        albumService.deleteAlbum(id);
        return Result.success();
    }
    
    /**
     * 拖拽排序相册
     */
    @PutMapping("/sort")
    public Result<Void> dragSort(
            @Valid @RequestBody MediaSortRequest request,
            @RequestParam Long siteId,
            @AuthenticationPrincipal Long userId) {
        albumService.dragSort(request.getId(), request.getNewSortOrder(), siteId, userId);
        return Result.success();
    }
}
