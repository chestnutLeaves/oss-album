package com.album.admin.mapper;

import com.album.admin.entity.Tag;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 标签 Mapper 接口
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
    
}
