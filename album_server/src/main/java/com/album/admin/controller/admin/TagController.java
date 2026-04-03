package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.dto.MediaSortRequest;
import com.album.admin.dto.TagRequest;
import com.album.admin.entity.Tag;
import com.album.admin.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 标签管理 Controller
 */
@RestController
@RequestMapping("/admin/tags")
@RequiredArgsConstructor
public class TagController {
    
    private final TagService tagService;
    
    /**
     * 获取所有标签列表
     */
    @GetMapping
    public Result<List<Tag>> getAllTags() {
        List<Tag> tags = tagService.getAllTags();
        return Result.success(tags);
    }
    
    /**
     * 创建标签
     */
    @PostMapping
    public Result<Void> createTag(@Valid @RequestBody TagRequest request) {
        Tag tag = new Tag();
        tag.setName(request.getName());
        tag.setSortOrder(request.getSortOrder());
        
        tagService.createTag(tag);
        return Result.success();
    }
    
    /**
     * 更新标签
     */
    @PutMapping
    public Result<Void> updateTag(@Valid @RequestBody TagRequest request) {
        Tag tag = new Tag();
        tag.setId(request.getId());
        tag.setName(request.getName());
        tag.setSortOrder(request.getSortOrder());
        
        tagService.updateTag(tag);
        return Result.success();
    }
    
    /**
     * 删除标签
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return Result.success();
    }
    
    /**
     * 拖拽排序标签
     */
    @PutMapping("/sort")
    public Result<Void> dragSort(@Valid @RequestBody MediaSortRequest request) {
        tagService.dragSort(request.getId(), request.getNewSortOrder());
        return Result.success();
    }
}
