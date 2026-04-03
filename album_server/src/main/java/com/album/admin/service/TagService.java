package com.album.admin.service;

import com.album.admin.entity.Tag;
import com.album.admin.vo.TagVO;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 标签服务接口
 */
public interface TagService extends IService<Tag> {
    
    /**
     * 获取所有标签列表
     */
    List<Tag> getAllTags();
    
    /**
     * 获取开放接口标签列表（按使用次数排序）
     */
    List<Tag> getOpenApiTags();
    
    /**
     * 获取指定站点的标签列表（按关联媒体数量降序排序）
     * @param siteId 站点 ID
     * @return 标签列表（包含 mediaCount 字段）
     */
    List<TagVO> getSiteTags(Long siteId);
    
    /**
     * 创建标签
     */
    void createTag(Tag tag);
    
    /**
     * 更新标签
     */
    void updateTag(Tag tag);
    
    /**
     * 删除标签 (同时删除关联关系)
     */
    void deleteTag(Long id);
    
    /**
     * 拖拽排序标签
     * @param id 标签 ID
     * @param newSortOrder 新的排序值
     */
    void dragSort(Long id, Integer newSortOrder);
}
