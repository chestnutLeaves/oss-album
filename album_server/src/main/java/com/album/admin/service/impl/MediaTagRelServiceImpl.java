package com.album.admin.service.impl;

import com.album.admin.entity.MediaTagRel;
import com.album.admin.mapper.MediaTagRelMapper;
import com.album.admin.service.MediaTagRelService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 媒体标签关联服务实现类
 */
@Service
public class MediaTagRelServiceImpl extends ServiceImpl<MediaTagRelMapper, MediaTagRel> implements MediaTagRelService {
    
    @Override
    public void removeByTagId(Long tagId) {
        LambdaQueryWrapper<MediaTagRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MediaTagRel::getTagId, tagId);
        remove(wrapper);
    }
    
    @Override
    public void removeByMediaId(Long mediaId) {
        LambdaQueryWrapper<MediaTagRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MediaTagRel::getMediaId, mediaId);
        remove(wrapper);
    }
}
