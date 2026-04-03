package com.album.admin.mapper;

import com.album.admin.entity.Album;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 相册 Mapper 接口
 */
@Mapper
public interface AlbumMapper extends BaseMapper<Album> {
    
}
