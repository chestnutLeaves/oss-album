package com.album.admin.service.impl;

import com.album.admin.common.ErrorCode;
import com.album.admin.entity.Album;
import com.album.admin.entity.MediaResource;
import com.album.admin.entity.MediaTagRel;
import com.album.admin.entity.SiteInfo;
import com.album.admin.entity.Tag;
import com.album.admin.entity.UserSiteRel;
import com.album.admin.exception.BusinessException;
import com.album.admin.mapper.AlbumMapper;
import com.album.admin.mapper.SiteInfoMapper;
import com.album.admin.service.AlbumService;
import com.album.admin.service.MediaResourceService;
import com.album.admin.service.MediaTagRelService;
import com.album.admin.service.TagService;
import com.album.admin.service.UserSiteRelService;
import com.album.admin.vo.AlbumDetailVO;
import com.album.admin.vo.AlbumVO;
import com.album.admin.vo.MediaSimpleVO;
import com.album.admin.vo.MediaTagVO;
import com.album.admin.vo.TagVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 相册服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlbumServiceImpl extends ServiceImpl<AlbumMapper, Album> implements AlbumService {
    
    private final UserSiteRelService userSiteRelService;
    private final MediaResourceService mediaResourceService;
    private final MediaTagRelService mediaTagRelService;
    private final TagService tagService;
    private final SiteInfoMapper siteInfoMapper;
    
    @Override
    public List<Album> getSiteAlbums(Long siteId) {
        LambdaQueryWrapper<Album> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Album::getSiteId, siteId)
               .orderByDesc(Album::getYear)  // 年份倒序
               .orderByAsc(Album::getSortOrder);  // 排序字段升序
        return list(wrapper);
    }
    
    @Override
    public List<AlbumVO> getUserAlbums(Long siteId, Long userId) {
        // 1. 确定要查询的站点 ID 列表
        List<Long> siteIds = new ArrayList<>();
        if (siteId != null) {
            // 指定了站点，只查询该站点
            siteIds.add(siteId);
        } else {
            // 未指定站点，查询用户关联的所有站点
            List<UserSiteRel> siteRels = userSiteRelService.getUserSiteRels(userId);
            if (CollectionUtils.isEmpty(siteRels)) {
                log.warn("用户暂无关联站点：userId: {}", userId);
                return new ArrayList<>();
            }
            siteIds = siteRels.stream()
                    .map(UserSiteRel::getSiteId)
                    .collect(Collectors.toList());
        }
        
        // 2. 查询这些站点的所有相册
        LambdaQueryWrapper<Album> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Album::getSiteId, siteIds)
               .orderByAsc(Album::getSortOrder);
        List<Album> albums = list(wrapper);
        
        if (CollectionUtils.isEmpty(albums)) {
            return new ArrayList<>();
        }
        
        // 3. 批量获取每个相册的封面图
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        
        // 查询每个相册的前 9 张图片作为封面图
        Map<Long, List<String>> albumCoverMap = getAlbumCoverImages(albumIds);
        
        // 4. 转换为 VO 对象
        return albums.stream()
                .map(album -> {
                    AlbumVO vo = new AlbumVO();
                    vo.setId(album.getId());
                    vo.setSiteId(album.getSiteId());
                    vo.setYear(album.getYear());
                    vo.setNeedPassword(album.getNeedPassword());
                    vo.setPassword(album.getPassword());  // 管理员可见密码
                    vo.setOssPrefix(album.getOssPrefix());
                    vo.setTitle(album.getTitle());
                    vo.setDescription(album.getDescription());
                    vo.setSortOrder(album.getSortOrder());
                    vo.setCreateTime(album.getCreateTime());
                    vo.setUpdateTime(album.getUpdateTime());
                    vo.setCoverImages(albumCoverMap.getOrDefault(album.getId(), new ArrayList<>()));
                    return vo;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 批量获取相册的封面图
     * @param albumIds 相册 ID 列表
     * @return Map<AlbumId, List<CoverImageUrls>>
     */
    private Map<Long, List<String>> getAlbumCoverImages(List<Long> albumIds) {
        // 为每个相册查询标记为封面的图片
        return albumIds.stream()
                .collect(Collectors.toMap(
                        albumId -> albumId,
                        albumId -> {
                            LambdaQueryWrapper<MediaResource> wrapper = new LambdaQueryWrapper<>();
                            wrapper.eq(MediaResource::getAlbumId, albumId)
                                   .eq(MediaResource::getIsCover, 1)
                                   .orderByAsc(MediaResource::getSortOrder);
                            List<MediaResource> medias = mediaResourceService.list(wrapper);
                            return medias.stream()
                                    .map(MediaResource::getThumbnailUrl)
                                    .filter(url -> url != null && !url.isEmpty())
                                    .collect(Collectors.toList());
                        }
                ));
    }
    
    /**
     * 检查 OSS 路径前缀的唯一性
     * @param siteId 站点 ID
     * @param albumId 当前相册 ID（更新时传入，用于排除自身）
     * @param ossPrefix OSS 路径前缀
     */
    private void checkOssPrefixUnique(Long siteId, Long albumId, String ossPrefix) {
        LambdaQueryWrapper<Album> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Album::getSiteId, siteId)
               .eq(Album::getOssPrefix, ossPrefix);
        
        // 如果是更新操作，需要排除当前相册
        if (albumId != null) {
            wrapper.ne(Album::getId, albumId);
        }
        
        Album existAlbum = getOne(wrapper);
        if (existAlbum != null) {
            throw new BusinessException(ErrorCode.ALBUM_OSS_PREFIX_EXISTS);
        }
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createAlbum(Album album) {
        // 检查 ossPrefix 是否已存在
        checkOssPrefixUnique(album.getSiteId(), null, album.getOssPrefix());
        
        album.setCreateTime(LocalDateTime.now());
        save(album);
        log.info("创建相册成功：{}, siteId: {}", album.getTitle(), album.getSiteId());
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAlbum(Album album) {
        Album existAlbum = getById(album.getId());
        if (existAlbum == null) {
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 检查 ossPrefix 是否与其他相册冲突
        checkOssPrefixUnique(existAlbum.getSiteId(), album.getId(), album.getOssPrefix());
        
        updateById(album);
        log.info("更新相册成功：{}", album.getTitle());
    }
    
    @Override
    public void deleteAlbum(Long id) {
        Album existAlbum = getById(id);
        if (existAlbum == null) {
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 逻辑删除
        removeById(id);
        log.info("删除相册成功：{}", id);
    }
    
    @Override
    public AlbumDetailVO getAlbumDetailWithPasswordCheck(Long albumId, String password) {
        // 1. 查询相册信息
        Album album = getById(albumId);
        if (album == null) {
            return null;
        }
        
        // 2. 验证密码（如果需要）
        if (album.getNeedPassword() == 1) {
            if (password == null || password.isEmpty()) {
                throw new BusinessException(ErrorCode.ALBUM_PASSWORD_REQUIRED);
            }
            if (!album.getPassword().equals(password)) {
                throw new BusinessException(ErrorCode.ALBUM_PASSWORD_ERROR);
            }
        }
        
        // 3. 构建返回对象
        AlbumDetailVO vo = new AlbumDetailVO();
        vo.setYear(album.getYear());
        vo.setTitle(album.getTitle());
        vo.setDescription(album.getDescription());
        
        // 4. 查询相册内的所有媒体资源
        LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
        mediaWrapper.eq(MediaResource::getAlbumId, albumId)
                    .orderByAsc(MediaResource::getSortOrder);
        List<MediaResource> medias = mediaResourceService.list(mediaWrapper);
        
        // 5. 转换为 VO 并提取标签
        List<MediaSimpleVO> mediaVOList = new ArrayList<>();
        List<Long> allTagIds = new ArrayList<>();
        
        for (MediaResource media : medias) {
            MediaSimpleVO mediaVO = new MediaSimpleVO();
            mediaVO.setId(media.getId());
            mediaVO.setAlbumId(media.getAlbumId());
            mediaVO.setAlbumTitle(album.getTitle());
            mediaVO.setAlbumNeedPassword(album.getNeedPassword());
            mediaVO.setOriginalFilename(media.getOriginalFilename());
            mediaVO.setThumbnailUrl(media.getThumbnailUrl());
            mediaVO.setOriginalUrl(media.getOriginalUrl());
            mediaVO.setType(media.getType());
            mediaVO.setDescription(media.getDescription());  // 设置媒体描述
            mediaVO.setExifInfo(media.getExifInfo());      // 设置 EXIF 信息
            
            // 查询该媒体的标签
            LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
            relWrapper.eq(MediaTagRel::getMediaId, media.getId());
            List<MediaTagRel> rels = mediaTagRelService.list(relWrapper);
            
            List<MediaTagVO> tagVOList = new ArrayList<>();
            for (MediaTagRel rel : rels) {
                allTagIds.add(rel.getTagId());
                
                MediaTagVO tagVO = new MediaTagVO();
                tagVO.setId(rel.getTagId());
                Tag tag = tagService.getById(rel.getTagId());
                if (tag != null) {
                    tagVO.setName(tag.getName());
                }
                tagVOList.add(tagVO);
            }
            mediaVO.setTags(tagVOList);
            
            mediaVOList.add(mediaVO);
        }
        
        vo.setMediaList(mediaVOList);
        
        // 6. 统计每个标签关联的媒体数量并去重
        Map<Long, Long> tagMediaCountMap = new java.util.HashMap<>();
        for (Long tagId : allTagIds) {
            tagMediaCountMap.put(tagId, tagMediaCountMap.getOrDefault(tagId, 0L) + 1L);
        }
        
        // 7. 构建标签列表并按媒体数量降序排序
        List<TagVO> uniqueTags = tagMediaCountMap.entrySet().stream()
                .map(entry -> {
                    Tag tag = tagService.getById(entry.getKey());
                    TagVO tagVO = new TagVO();
                    tagVO.setId(tag.getId());
                    tagVO.setName(tag.getName());
                    tagVO.setMediaCount(entry.getValue());
                    return tagVO;
                })
                .sorted((a, b) -> Long.compare(b.getMediaCount(), a.getMediaCount()))  // 按媒体数量降序
                .collect(Collectors.toList());
        
        vo.setTags(uniqueTags);
        
        return vo;
    }
    
    @Override
    public List<MediaSimpleVO> searchMediaByKeyword(String domain, String keyword) {
        // 1. 根据域名查询站点
        LambdaQueryWrapper<SiteInfo> siteWrapper = new LambdaQueryWrapper<>();
        siteWrapper.eq(SiteInfo::getDomain, domain);
        SiteInfo siteInfo = siteInfoMapper.selectOne(siteWrapper);
        
        if (siteInfo == null) {
            return new ArrayList<>();
        }
        
        // 2. 查询该站点的所有相册
        LambdaQueryWrapper<Album> albumWrapper = new LambdaQueryWrapper<>();
        albumWrapper.eq(Album::getSiteId, siteInfo.getId());
        List<Album> albums = list(albumWrapper);
        
        if (albums.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 3. 提取所有相册 ID
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        
        // 4. 查询这些相册中的所有媒体资源（未删除的）
        LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
        mediaWrapper.in(MediaResource::getAlbumId, albumIds)
                    .and(wrapper -> wrapper
                        .like(MediaResource::getOriginalFilename, keyword)
                        .or()
                        .like(MediaResource::getDescription, keyword)
                    );
        List<MediaResource> medias = mediaResourceService.list(mediaWrapper);
        
        // 5. 转换为 VO
        return medias.stream()
                .map(media -> {
                    MediaSimpleVO vo = new MediaSimpleVO();
                    vo.setId(media.getId());
                    vo.setAlbumId(media.getAlbumId());
                    vo.setOriginalFilename(media.getOriginalFilename());
                    vo.setThumbnailUrl(media.getThumbnailUrl());
                    vo.setType(media.getType());
                    
                    // 查找所属相册信息
                    Album album = albums.stream()
                            .filter(a -> a.getId().equals(media.getAlbumId()))
                            .findFirst()
                            .orElse(null);
                    
                    if (album != null) {
                        vo.setAlbumTitle(album.getTitle());
                        vo.setAlbumNeedPassword(album.getNeedPassword());
                    }
                    
                    return vo;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public List<MediaSimpleVO> searchMediaByTagId(String domain, Long tagId) {
        // 1. 根据域名查询站点
        LambdaQueryWrapper<SiteInfo> siteWrapper = new LambdaQueryWrapper<>();
        siteWrapper.eq(SiteInfo::getDomain, domain);
        SiteInfo siteInfo = siteInfoMapper.selectOne(siteWrapper);
        
        if (siteInfo == null) {
            return new ArrayList<>();
        }
        
        // 2. 查询该站点的所有相册
        LambdaQueryWrapper<Album> albumWrapper = new LambdaQueryWrapper<>();
        albumWrapper.eq(Album::getSiteId, siteInfo.getId());
        List<Album> albums = list(albumWrapper);
        
        if (albums.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 3. 提取所有相册 ID
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        
        // 4. 查询这些相册中与该标签关联的所有媒体资源
        // 先通过标签 ID 查询所有关联的媒体 ID
        LambdaQueryWrapper<MediaTagRel> tagRelWrapper = new LambdaQueryWrapper<>();
        tagRelWrapper.eq(MediaTagRel::getTagId, tagId);
        List<MediaTagRel> tagRels = mediaTagRelService.list(tagRelWrapper);
        
        if (tagRels.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 提取所有媒体 ID
        List<Long> mediaIds = tagRels.stream()
                .map(MediaTagRel::getMediaId)
                .collect(Collectors.toList());
        
        // 5. 查询这些媒体资源（只查询属于该站点相册的）
        LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
        mediaWrapper.in(MediaResource::getId, mediaIds)
                    .in(MediaResource::getAlbumId, albumIds)
                    .orderByDesc(MediaResource::getShootTime);  // 按拍摄时间降序
        List<MediaResource> medias = mediaResourceService.list(mediaWrapper);
        
        // 6. 转换为 VO 并补充相册信息
        return medias.stream()
                .map(media -> {
                    MediaSimpleVO vo = new MediaSimpleVO();
                    vo.setId(media.getId());
                    vo.setAlbumId(media.getAlbumId());
                    vo.setOriginalFilename(media.getOriginalFilename());
                    vo.setOriginalUrl(media.getOriginalUrl());
                    vo.setThumbnailUrl(media.getThumbnailUrl());
                    vo.setType(media.getType());
                    
                    // 查找所属相册信息
                    Album album = albums.stream()
                            .filter(a -> a.getId().equals(media.getAlbumId()))
                            .findFirst()
                            .orElse(null);
                    
                    if (album != null) {
                        vo.setAlbumTitle(album.getTitle());
                        vo.setAlbumNeedPassword(album.getNeedPassword());
                    }
                    
                    // 查询该媒体的标签
                    LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
                    relWrapper.eq(MediaTagRel::getMediaId, media.getId());
                    List<MediaTagRel> rels = mediaTagRelService.list(relWrapper);
                    
                    List<MediaTagVO> tagVOList = new ArrayList<>();
                    for (MediaTagRel rel : rels) {
                        MediaTagVO tagVO = new MediaTagVO();
                        tagVO.setId(rel.getTagId());
                        Tag tag = tagService.getById(rel.getTagId());
                        if (tag != null) {
                            tagVO.setName(tag.getName());
                        }
                        tagVOList.add(tagVO);
                    }
                    vo.setTags(tagVOList);
                    
                    return vo;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public void dragSort(Long id, Integer newSortOrder, Long siteId, Long userId) {
        // 1. 查询当前相册
        Album currentAlbum = getById(id);
        if (currentAlbum == null) {
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 2. 校验站点权限（确保相册属于该站点）
        if (!currentAlbum.getSiteId().equals(siteId)) {
            throw new BusinessException(ErrorCode.ALBUM_NOT_FOUND);
        }
        
        // 3. 校验用户对该站点的管理权限
        boolean hasPermission = userSiteRelService.hasPermission(userId, siteId);
        if (!hasPermission) {
            throw new BusinessException(ErrorCode.NO_SITE_PERMISSION);
        }
        
        Integer oldSortOrder = currentAlbum.getSortOrder();
        
        // 4. 如果排序值没有变化，直接返回
        if (oldSortOrder.equals(newSortOrder)) {
            log.info("拖拽排序值未变化：albumId: {}, sortOrder: {}", id, oldSortOrder);
            return;
        }
        
        // 5. 查询该站点的所有相册（按排序值升序）
        LambdaQueryWrapper<Album> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Album::getSiteId, siteId)
               .orderByAsc(Album::getSortOrder);
        List<Album> allAlbums = list(wrapper);
        
        // 6. 根据移动方向更新排序值
        if (newSortOrder > oldSortOrder) {
            // 向下移动：将范围内的相册排序值减 1
            for (Album album : allAlbums) {
                if (!album.getId().equals(id) && 
                    album.getSortOrder() > oldSortOrder && 
                    album.getSortOrder() <= newSortOrder) {
                    album.setSortOrder(album.getSortOrder() - 1);
                    updateById(album);
                }
            }
        } else {
            // 向上移动：将范围内的相册排序值加 1
            for (Album album : allAlbums) {
                if (!album.getId().equals(id) && 
                    album.getSortOrder() >= newSortOrder && 
                    album.getSortOrder() < oldSortOrder) {
                    album.setSortOrder(album.getSortOrder() + 1);
                    updateById(album);
                }
            }
        }
        
        // 7. 更新当前相册的排序值
        currentAlbum.setSortOrder(newSortOrder);
        updateById(currentAlbum);
        
        log.info("拖拽排序成功：albumId: {}, oldSortOrder: {}, newSortOrder: {}", 
            id, oldSortOrder, newSortOrder);
    }
    
    @Override
    public List<MediaSimpleVO> searchMedia(String domain, String keyword, List<Long> tagIds) {
        // 1. 根据域名查询站点
        LambdaQueryWrapper<SiteInfo> siteWrapper = new LambdaQueryWrapper<>();
        siteWrapper.eq(SiteInfo::getDomain, domain);
        SiteInfo siteInfo = siteInfoMapper.selectOne(siteWrapper);
        
        if (siteInfo == null) {
            return new ArrayList<>();
        }
        
        // 2. 查询该站点的所有相册
        LambdaQueryWrapper<Album> albumWrapper = new LambdaQueryWrapper<>();
        albumWrapper.eq(Album::getSiteId, siteInfo.getId());
        List<Album> albums = list(albumWrapper);
        
        if (albums.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 3. 提取所有相册 ID
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());
        
        // 4. 如果关键词和标签都为空，随机返回 20 个媒体
        if ((keyword == null || keyword.isEmpty()) && (tagIds == null || tagIds.isEmpty())) {
            LambdaQueryWrapper<MediaResource> randomWrapper = new LambdaQueryWrapper<>();
            randomWrapper.in(MediaResource::getAlbumId, albumIds);
            List<MediaResource> allMedias = mediaResourceService.list(randomWrapper);
            
            // 随机打乱并取前 20 个
            java.util.Collections.shuffle(allMedias);
            List<MediaResource> randomMedias = allMedias.stream()
                    .limit(20)
                    .collect(java.util.stream.Collectors.toList());
            
            return convertToMediaSimpleVO(randomMedias, albums);
        }
        
        // 5. 有关键词，先按关键词搜索
        List<MediaResource> filteredMedias;
        if (keyword != null && !keyword.isEmpty()) {
            LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
            mediaWrapper.in(MediaResource::getAlbumId, albumIds)
                        .and(wrapper -> wrapper
                            .like(MediaResource::getOriginalFilename, keyword)
                            .or()
                            .like(MediaResource::getDescription, keyword)
                        );
            filteredMedias = mediaResourceService.list(mediaWrapper);
        } else {
            // 没有关键词，查询所有媒体
            LambdaQueryWrapper<MediaResource> mediaWrapper = new LambdaQueryWrapper<>();
            mediaWrapper.in(MediaResource::getAlbumId, albumIds);
            filteredMedias = mediaResourceService.list(mediaWrapper);
        }
        
        if (filteredMedias.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 6. 有标签过滤条件
        if (tagIds != null && !tagIds.isEmpty()) {
            List<Long> distinctTagIds = tagIds.stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            if (distinctTagIds.isEmpty()) {
                return convertToMediaSimpleVO(filteredMedias, albums);
            }

            // 查询这些媒体关联的标签
            List<Long> mediaIds = filteredMedias.stream()
                    .map(MediaResource::getId)
                    .collect(java.util.stream.Collectors.toList());
            
            LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
            relWrapper.in(MediaTagRel::getMediaId, mediaIds)
                      .in(MediaTagRel::getTagId, distinctTagIds);
            List<MediaTagRel> rels = mediaTagRelService.list(relWrapper);
            
            Map<Long, Set<Long>> mediaTagMap = new HashMap<>();
            for (MediaTagRel rel : rels) {
                mediaTagMap.computeIfAbsent(rel.getMediaId(), k -> new HashSet<>()).add(rel.getTagId());
            }

            Set<Long> qualifiedMediaIds = mediaTagMap.entrySet().stream()
                    .filter(entry -> entry.getValue().size() == distinctTagIds.size())
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toSet());

            filteredMedias = filteredMedias.stream()
                    .filter(media -> qualifiedMediaIds.contains(media.getId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        return convertToMediaSimpleVO(filteredMedias, albums);
    }
    
    /**
     * 将 MediaResource 列表转换为 MediaSimpleVO 列表
     */
    private List<MediaSimpleVO> convertToMediaSimpleVO(List<MediaResource> medias, List<Album> albums) {
        // 1. 提取所有媒体 ID
        List<Long> mediaIds = medias.stream()
                .map(MediaResource::getId)
                .collect(java.util.stream.Collectors.toList());
        
        // 2. 批量查询所有媒体的标签关联关系
        Map<Long, List<MediaTagRel>> mediaRelsMap = new java.util.HashMap<>();
        if (!mediaIds.isEmpty()) {
            LambdaQueryWrapper<MediaTagRel> relWrapper = new LambdaQueryWrapper<>();
            relWrapper.in(MediaTagRel::getMediaId, mediaIds);
            List<MediaTagRel> allRels = mediaTagRelService.list(relWrapper);
            
            // 按媒体 ID 分组
            for (MediaTagRel rel : allRels) {
                mediaRelsMap.computeIfAbsent(rel.getMediaId(), k -> new java.util.ArrayList<>())
                        .add(rel);
            }
        }
        
        // 3. 提取所有不重复的标签 ID
        Set<Long> distinctTagIds = new java.util.HashSet<>();
        for (List<MediaTagRel> rels : mediaRelsMap.values()) {
            for (MediaTagRel rel : rels) {
                distinctTagIds.add(rel.getTagId());
            }
        }
        
        // 4. 批量查询所有标签信息（关键优化：避免 N+1 查询）
        Map<Long, String> tagNameMap = new java.util.HashMap<>();
        if (!distinctTagIds.isEmpty()) {
            LambdaQueryWrapper<Tag> tagWrapper = new LambdaQueryWrapper<>();
            tagWrapper.in(Tag::getId, distinctTagIds);
            List<Tag> allTags = tagService.list(tagWrapper);
            
            // 构建标签 ID 到名称的映射
            for (Tag tag : allTags) {
                tagNameMap.put(tag.getId(), tag.getName());
            }
        }
        
        // 5. 构建媒体 - 标签映射
        Map<Long, List<MediaTagVO>> mediaTagMap = new java.util.HashMap<>();
        for (Map.Entry<Long, List<MediaTagRel>> entry : mediaRelsMap.entrySet()) {
            Long mediaId = entry.getKey();
            List<MediaTagRel> rels = entry.getValue();
            
            List<MediaTagVO> tagVOList = new java.util.ArrayList<>();
            for (MediaTagRel rel : rels) {
                MediaTagVO tagVO = new MediaTagVO();
                tagVO.setId(rel.getTagId());
                String tagName = tagNameMap.get(rel.getTagId());
                if (tagName != null) {
                    tagVO.setName(tagName);
                }
                tagVOList.add(tagVO);
            }
            mediaTagMap.put(mediaId, tagVOList);
        }
        
        // 6. 将相册列表转换为 Map 以便快速查找
        Map<Long, Album> albumMap = albums.stream()
                .collect(java.util.stream.Collectors.toMap(Album::getId, album -> album));
        
        // 7. 转换为 VO 并填充 tags
        return medias.stream()
                .map(media -> {
                    MediaSimpleVO vo = new MediaSimpleVO();
                    vo.setId(media.getId());
                    vo.setAlbumId(media.getAlbumId());
                    vo.setOriginalFilename(media.getOriginalFilename());
                    vo.setOriginalUrl(media.getOriginalUrl());
                    vo.setThumbnailUrl(media.getThumbnailUrl());
                    vo.setType(media.getType());
                    vo.setDescription(media.getDescription());  // 设置媒体描述
                    vo.setExifInfo(media.getExifInfo());      // 设置 EXIF 信息
                    vo.setShootTime(media.getShootTime());    // 设置拍摄时间
                    
                    // 设置该媒体的标签列表（精简版）
                    List<MediaTagVO> tags = mediaTagMap.getOrDefault(media.getId(), new java.util.ArrayList<>());
                    vo.setTags(tags);
                    
                    // 从 Map 中查找所属相册信息（O(1) 时间复杂度）
                    Album album = albumMap.get(media.getAlbumId());
                    
                    if (album != null) {
                        vo.setAlbumTitle(album.getTitle());
                        vo.setAlbumNeedPassword(album.getNeedPassword());
                    }
                    
                    return vo;
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
