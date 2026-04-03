package com.album.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 媒体标签关联实体
 */
@Data
@TableName("media_tag_rel")
public class MediaTagRel implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 媒体 ID
     */
    private Long mediaId;
    
    /**
     * 标签 ID
     */
    private Long tagId;
}
