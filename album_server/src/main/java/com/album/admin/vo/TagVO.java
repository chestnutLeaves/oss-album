package com.album.admin.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import java.io.Serializable;

/**
 * 标签视图对象（开放接口）
 */
@Data
public class TagVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键 ID
     */
    @JsonSerialize(using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class)
    private Long id;
    
    /**
     * 标签名称
     */
    private String name;

    /**
     * 排序值
     */
    private Integer sortOrder;
    
    /**
     * 关联的媒体资源数量
     */
    private Long mediaCount;
}
