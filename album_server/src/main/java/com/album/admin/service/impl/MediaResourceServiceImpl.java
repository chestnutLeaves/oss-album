package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.MediaResource;
import com.album.admin.entity.MediaTagRel;
import com.album.admin.entity.Tag;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.MediaResourceMapper;
import com.album.admin.service.MediaResourceService;
import com.album.admin.service.MediaTagRelService;
import com.album.admin.service.TagService;
import com.album.admin.vo.MediaResourceVO;
import com.album.admin.vo.TagVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 媒体资源服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MediaResourceServiceImpl extends ServiceImpl<MediaResourceMapper, MediaResource> implements MediaResourceService {
    
    private final MediaTagRelService mediaTagRelService;
    private final TagService tagService;
    
    @Override
    public Page<MediaResourceVO> getAlbumMedias(Long albumId, Integer pageNum, Integer pageSize) {
        LambdaQueryWrapper<MediaResource> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MediaResource::getAlbumId, albumId)
               .orderByAsc(MediaResource::getSortOrder);
        
        Page<MediaResource> page = page(new Page<>(pageNum, pageSize), wrapper);
        
        // 转换为 VO
        List<MediaResourceVO> records = page.getRecords().stream()
                .map(this::convertToVO)
                .toList();
        
        Page<MediaResourceVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        voPage.setRecords(records);
        return voPage;
    }
    
    @Override
    public List<MediaResourceVO> getAlbumMediasAll(Long albumId) {
        // 1. 查询相册内所有媒体资源
        LambdaQueryWrapper<MediaResource> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MediaResource::getAlbumId, albumId)
               .orderByAsc(MediaResource::getSortOrder);
        
        List<MediaResource> medias = list(wrapper);
        
        if (medias.isEmpty()) {
            return Collections.emptyList();
        }
        
        // 2. 批量查询所有媒体资源的标签关联
        List<Long> mediaIds = medias.stream()
                .map(MediaResource::getId)
                .toList();
        
        LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.in(MediaTagRel::getMediaId, mediaIds);
        List<MediaTagRel> allRels = mediaTagRelService.list(relWrapper);
        
        // 3. 提取所有唯一的标签 ID
        List<Long> tagIds = allRels.stream()
                .map(MediaTagRel::getTagId)
                .distinct()
                .toList();
        
        // 4. 批量查询标签信息
        Map<Long, TagVO> tagMap;
        if (!tagIds.isEmpty()) {
            LambdaQueryWrapper<Tag> tagWrapper = new LambdaQueryWrapper<>();
            tagWrapper.in(Tag::getId, tagIds);
            List<Tag> tags = tagService.list(tagWrapper);
            
            tagMap = tags.stream()
                    .collect(Collectors.toMap(
                            Tag::getId,
                            tag -> {
                                TagVO tagVO = new TagVO();
                                tagVO.setId(tag.getId());
                                tagVO.setName(tag.getName());
                                tagVO.setSortOrder(tag.getSortOrder());
                                return tagVO;
                            }
                    ));
        } else {
            tagMap = Collections.emptyMap();
        }
        
        // 5. 将标签关联关系按媒体 ID 分组
        Map<Long, List<Long>> mediaTagRelMap = allRels.stream()
                .collect(Collectors.groupingBy(
                        MediaTagRel::getMediaId,
                        Collectors.mapping(MediaTagRel::getTagId, Collectors.toList())
                ));
        
        // 6. 转换为 VO 并组装标签列表
        return medias.stream()
                .map(media -> {
                    MediaResourceVO vo = convertToVO(media);
                    
                    // 获取该媒体资源的标签 ID 列表
                    List<Long> relTagIds = mediaTagRelMap.getOrDefault(media.getId(), Collections.emptyList());
                    
                    // 根据标签 ID 从缓存中获取标签对象
                    List<TagVO> mediaTags = relTagIds.stream()
                            .map(tagMap::get)
                            .filter(tag -> tag != null)
                            .sorted((t1, t2) -> Integer.compare(t1.getSortOrder(), t2.getSortOrder()))
                            .toList();
                    
                    vo.setTags(mediaTags);
                    return vo;
                })
                .toList();
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void dragSort(Long id, Integer newSortOrder) {
        // 1. 查询当前媒体资源
        MediaResource currentMedia = getById(id);
        if (currentMedia == null) {
            throw new BusinessException(ErrorCode.MEDIA_NOT_FOUND);
        }
        
        Integer oldSortOrder = currentMedia.getSortOrder();
        
        // 2. 如果排序值没有变化，直接返回
        if (oldSortOrder.equals(newSortOrder)) {
            log.info("拖拽排序值未变化：mediaId: {}, sortOrder: {}", id, oldSortOrder);
            return;
        }
        
        // 3. 查询相册内所有媒体
        LambdaQueryWrapper<MediaResource> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MediaResource::getAlbumId, currentMedia.getAlbumId())
               .orderByAsc(MediaResource::getSortOrder);
        List<MediaResource> allMedias = list(wrapper);
        
        // 4. 根据移动方向更新排序值
        if (newSortOrder > oldSortOrder) {
            // 向下移动：将范围内的资源排序值减 1
            for (MediaResource media : allMedias) {
                if (!media.getId().equals(id) && 
                    media.getSortOrder() > oldSortOrder && 
                    media.getSortOrder() <= newSortOrder) {
                    media.setSortOrder(media.getSortOrder() - 1);
                    updateById(media);
                }
            }
        } else {
            // 向上移动：将范围内的资源排序值加 1
            for (MediaResource media : allMedias) {
                if (!media.getId().equals(id) && 
                    media.getSortOrder() >= newSortOrder && 
                    media.getSortOrder() < oldSortOrder) {
                    media.setSortOrder(media.getSortOrder() + 1);
                    updateById(media);
                }
            }
        }
        
        // 5. 更新当前媒体的排序值
        currentMedia.setSortOrder(newSortOrder);
        updateById(currentMedia);
        
        log.info("拖拽排序成功：mediaId: {}, oldSortOrder: {}, newSortOrder: {}", 
            id, oldSortOrder, newSortOrder);
    }
    
    /**
     * 实体转 VO
     */
    private MediaResourceVO convertToVO(MediaResource entity) {
        MediaResourceVO vo = new MediaResourceVO();
        vo.setId(entity.getId());
        vo.setAlbumId(entity.getAlbumId());
        vo.setOriginalFilename(entity.getOriginalFilename());
        vo.setOriginalUrl(entity.getOriginalUrl());
        vo.setThumbnailUrl(entity.getThumbnailUrl());
        vo.setExifInfo(entity.getExifInfo());
        vo.setShootTime(entity.getShootTime());
        vo.setUploadTime(entity.getUploadTime());
        vo.setType(entity.getType());
        vo.setDescription(entity.getDescription());
        vo.setSortOrder(entity.getSortOrder());
        vo.setIsCover(entity.getIsCover());
        return vo;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createMedia(MediaResource mediaResource, List<Long> tagIds) {
        mediaResource.setUploadTime(LocalDateTime.now());
        save(mediaResource);
        
        // 如果提供了标签 ID 列表，保存标签关联
        if (tagIds != null && !tagIds.isEmpty()) {
            List<MediaTagRel> relations = tagIds.stream()
                    .map(tagId -> {
                        MediaTagRel rel = new MediaTagRel();
                        rel.setMediaId(mediaResource.getId());
                        rel.setTagId(tagId);
                        return rel;
                    })
                    .toList();
            
            // 批量保存
            for (MediaTagRel rel : relations) {
                mediaTagRelService.save(rel);
            }
        }
        
        log.info("创建媒体资源成功：{}, albumId: {}, tagIds: {}", 
            mediaResource.getOriginalFilename(), mediaResource.getAlbumId(), tagIds);
    }
    
    @Transactional(rollbackFor = Exception.class)
    public void updateMedia(MediaResource mediaResource, List<Long> tagIds) {
        MediaResource existMedia = getById(mediaResource.getId());
        if (existMedia == null) {
            throw new BusinessException(ErrorCode.MEDIA_NOT_FOUND);
        }
        
        // 更新媒体资源信息
        updateById(mediaResource);
        
        // 如果提供了标签 ID 列表，更新标签关联
        if (tagIds != null) {
            // 1. 删除该媒体资源的所有原有标签关联
            mediaTagRelService.removeByMediaId(mediaResource.getId());
            
            // 2. 插入新的标签关联
            if (!tagIds.isEmpty()) {
                List<MediaTagRel> relations = tagIds.stream()
                        .map(tagId -> {
                            MediaTagRel rel = new MediaTagRel();
                            rel.setMediaId(mediaResource.getId());
                            rel.setTagId(tagId);
                            return rel;
                        })
                        .toList();
                
                // 批量保存
                for (MediaTagRel rel : relations) {
                    mediaTagRelService.save(rel);
                }
            }
        }
        
        log.info("更新媒体资源成功：{}, tagIds: {}", mediaResource.getId(), tagIds);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteMedia(Long id) {
        MediaResource existMedia = getById(id);
        if (existMedia == null) {
            throw new BusinessException(ErrorCode.MEDIA_NOT_FOUND);
        }
        
        // 删除标签关联
        mediaTagRelService.removeByMediaId(id);
        
        // 逻辑删除媒体
        removeById(id);
        log.info("删除媒体资源成功：{}", id);
    }
}
