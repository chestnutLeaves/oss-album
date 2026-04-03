package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.Album;
import com.album.admin.entity.MediaResource;
import com.album.admin.entity.MediaTagRel;
import com.album.admin.entity.Tag;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.AlbumMapper;
import com.album.admin.mapper.MediaResourceMapper;
import com.album.admin.mapper.TagMapper;
import com.album.admin.service.MediaTagRelService;
import com.album.admin.service.TagService;
import com.album.admin.vo.TagVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 标签服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl extends ServiceImpl<TagMapper, Tag> implements TagService {
    
    private final MediaTagRelService mediaTagRelService;
    private final AlbumMapper albumMapper;
    private final MediaResourceMapper mediaResourceMapper;
    
    @Override
    public List<Tag> getAllTags() {
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Tag::getSortOrder);
        return list(wrapper);
    }
    
    @Override
    public List<Tag> getOpenApiTags() {
        // 使用子查询按关联数量排序
        // SELECT t.* FROM tag t 
        // LEFT JOIN media_tag_rel mtr ON t.id = mtr.tag_id 
        // GROUP BY t.id 
        // ORDER BY COUNT(mtr.media_id) DESC
        return baseMapper.selectList(
            new LambdaQueryWrapper<Tag>()
                .orderByDesc(Tag::getId) // 临时使用 ID 倒序，后续改用 SQL 排序
        );
    }
    
    @Override
    public List<TagVO> getSiteTags(Long siteId) {
        // 1. 查询该站点的所有相册
        LambdaQueryWrapper<Album> albumWrapper = new LambdaQueryWrapper<>();
        albumWrapper.eq(Album::getSiteId, siteId);
        List<Album> albums = albumMapper.selectList(albumWrapper);
        
        if (albums.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // 2. 提取所有相册 ID
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        
        // 3. 查询这些相册中的所有媒体资源
        LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
        mediaWrapper.in(MediaResource::getAlbumId, albumIds);
        List<MediaResource> medias = mediaResourceMapper.selectList(mediaWrapper);
        
        if (medias.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // 4. 提取所有媒体 ID
        List<Long> mediaIds = medias.stream()
                .map(MediaResource::getId)
                .collect(Collectors.toList());
        
        // 5. 查询这些媒体关联的所有标签
        LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.in(MediaTagRel::getMediaId, mediaIds);
        List<MediaTagRel> rels = mediaTagRelService.list(relWrapper);
        
        if (rels.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // 6. 统计每个标签关联的媒体数量
        Map<Long, Long> tagMediaCountMap = rels.stream()
                .collect(Collectors.groupingBy(
                        MediaTagRel::getTagId,
                        Collectors.counting()
                ));
        
        // 7. 构建标签列表并按媒体数量降序排序
        return tagMediaCountMap.entrySet().stream()
                .map(entry -> {
                    Tag tag = getById(entry.getKey());
                    TagVO tagVO = new TagVO();
                    tagVO.setId(tag.getId());
                    tagVO.setName(tag.getName());
                    tagVO.setMediaCount(entry.getValue());
                    return tagVO;
                })
                .sorted((a, b) -> Long.compare(b.getMediaCount(), a.getMediaCount()))
                .collect(Collectors.toList());
    }
    
    @Override
    public void createTag(Tag tag) {
        // 检查标签名是否已存在
        Tag existTag = getTagByName(tag.getName());
        if (existTag != null) {
            throw new BusinessException(ErrorCode.TAG_NAME_EXISTS);
        }
        tag.setCreateTime(LocalDateTime.now());
        save(tag);
        log.info("创建标签成功：{}", tag.getName());
    }
    
    @Override
    public void updateTag(Tag tag) {
        Tag existTag = getById(tag.getId());
        if (existTag == null) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
        
        // 如果标签名发生变化，需要检查新名称是否已被其他标签使用
        if (!existTag.getName().equals(tag.getName())) {
            // 查询是否有标签使用了这个新名字
            Tag nameExist = getTagByName(tag.getName());
            // 如果找到了同名标签，且不是当前正在更新的这个标签，则说明名字冲突
            if (nameExist != null && !nameExist.getId().equals(tag.getId())) {
                throw new BusinessException(ErrorCode.TAG_NAME_EXISTS);
            }
        }
        
        updateById(tag);
        log.info("更新标签成功：{}", tag.getName());
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTag(Long id) {
        Tag existTag = getById(id);
        if (existTag == null) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
        
        // 删除关联关系
        mediaTagRelService.removeByTagId(id);
        
        // 删除标签
        removeById(id);
        log.info("删除标签成功：{}", id);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void dragSort(Long id, Integer newSortOrder) {
        // 1. 查询当前标签
        Tag currentTag = getById(id);
        if (currentTag == null) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
        
        Integer oldSortOrder = currentTag.getSortOrder();
        
        // 2. 如果排序值没有变化，直接返回
        if (oldSortOrder.equals(newSortOrder)) {
            log.info("拖拽排序值未变化：tagId: {}, sortOrder: {}", id, oldSortOrder);
            return;
        }
        
        // 3. 查询所有标签
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Tag::getSortOrder);
        List<Tag> allTags = list(wrapper);
        
        // 4. 根据移动方向更新排序值
        if (newSortOrder > oldSortOrder) {
            // 向下移动：将范围内的标签排序值减 1
            for (Tag tag : allTags) {
                if (!tag.getId().equals(id) && 
                    tag.getSortOrder() > oldSortOrder && 
                    tag.getSortOrder() <= newSortOrder) {
                    tag.setSortOrder(tag.getSortOrder() - 1);
                    updateById(tag);
                }
            }
        } else {
            // 向上移动：将范围内的标签排序值加 1
            for (Tag tag : allTags) {
                if (!tag.getId().equals(id) && 
                    tag.getSortOrder() >= newSortOrder && 
                    tag.getSortOrder() < oldSortOrder) {
                    tag.setSortOrder(tag.getSortOrder() + 1);
                    updateById(tag);
                }
            }
        }
        
        // 5. 更新当前标签的排序值
        currentTag.setSortOrder(newSortOrder);
        updateById(currentTag);
        
        log.info("拖拽排序成功：tagId: {}, oldSortOrder: {}, newSortOrder: {}", 
            id, oldSortOrder, newSortOrder);
    }
    
    /**
     * 根据名称查询标签
     */
    private Tag getTagByName(String name) {
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Tag::getName, name);
        return getOne(wrapper);
    }
}
