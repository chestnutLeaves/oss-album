package com.album.admin.service;

import com.album.admin.entity.MediaResource;
import com.album.admin.vo.MediaResourceVO;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 媒体资源服务接口
 */
public interface MediaResourceService extends IService<MediaResource> {
    
    /**
     * 分页获取相册内的媒体列表
     */
    Page<MediaResourceVO> getAlbumMedias(Long albumId, Integer pageNum, Integer pageSize);
    
    /**
     * 获取相册内的所有媒体列表（不分页）
     */
    List<MediaResourceVO> getAlbumMediasAll(Long albumId);
    
    /**
     * 拖拽排序媒体资源
     * @param id 媒体资源 ID
     * @param newSortOrder 新的排序值
     */
    void dragSort(Long id, Integer newSortOrder);
    
    /**
     * 创建媒体资源
     */
    void createMedia(MediaResource mediaResource, List<Long> tagIds);
    
    /**
     * 更新媒体资源
     */
    void updateMedia(MediaResource mediaResource, List<Long> tagIds);
    
    /**
     * 删除媒体资源
     */
    void deleteMedia(Long id);
}
