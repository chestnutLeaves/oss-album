package com.album.admin.service;

import com.album.admin.entity.MediaTagRel;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * 媒体标签关联服务接口
 */
public interface MediaTagRelService extends IService<MediaTagRel> {
    
    /**
     * 根据标签 ID 删除关联
     */
    void removeByTagId(Long tagId);
    
    /**
     * 根据媒体 ID 删除关联
     */
    void removeByMediaId(Long mediaId);
}
