package com.album.admin.service;

import com.album.admin.entity.Album;
import com.album.admin.vo.AlbumDetailVO;
import com.album.admin.vo.AlbumVO;
import com.album.admin.vo.MediaSimpleVO;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 相册服务接口
 */
public interface AlbumService extends IService<Album> {
    
    /**
     * 获取站点下的相册列表
     */
    List<Album> getSiteAlbums(Long siteId);
    
    /**
     * 获取用户的相册列表 (支持指定站点或查询所有站点)
     * @param siteId 站点 ID(可选，不传则查询所有站点)
     * @param userId 用户 ID
     * @return 相册 VO 列表 (包含封面图)
     */
    List<AlbumVO> getUserAlbums(Long siteId, Long userId);
    
    /**
     * 创建相册
     */
    void createAlbum(Album album);
    
    /**
     * 更新相册
     */
    void updateAlbum(Album album);
    
    /**
     * 删除相册
     */
    void deleteAlbum(Long id);
    
    /**
     * 获取相册详情（带密码验证）
     * @param albumId 相册 ID
     * @param password 输入的密码
     * @return 相册详情
     */
    AlbumDetailVO getAlbumDetailWithPasswordCheck(Long albumId, String password);
    
    /**
     * 根据关键词搜索媒体资源
     * @param domain 域名
     * @param keyword 关键词
     * @return 媒体资源列表
     */
    List<MediaSimpleVO> searchMediaByKeyword(String domain, String keyword);
    
    /**
     * 根据标签 ID 搜索媒体资源
     * @param domain 域名
     * @param tagId 标签 ID
     * @return 媒体资源列表（按拍摄时间降序）
     */
    List<MediaSimpleVO> searchMediaByTagId(String domain, Long tagId);
    
    /**
     * 综合搜索媒体资源（支持关键词和标签过滤）
     * @param domain 域名
     * @param keyword 搜索关键词（可选）
     * @param tagIds 标签 ID 列表（可选）
     * @return 媒体资源列表
     */
    List<MediaSimpleVO> searchMedia(String domain, String keyword, List<Long> tagIds);

    /**
     * 拖拽排序相册
     * @param id 相册 ID
     * @param newSortOrder 新的排序值
     * @param siteId 站点 ID（用于权限校验）
     * @param userId 用户 ID（用于权限校验）
     */
    void dragSort(Long id, Integer newSortOrder, Long siteId, Long userId);
}