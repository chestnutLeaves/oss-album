package com.album.admin.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一返回结果封装
 */
@Data
public class Result<T> implements Serializable {
    
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;
    
    public Result() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public static <T> Result<T> success() {
        return success(null);
    }
    
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(ErrorCode.SUCCESS.getCode());
        result.setMessage(ErrorCode.SUCCESS.getMessage());
        result.setData(data);
        return result;
    }
    
    public static <T> Result<T> error(String message) {
        return error(ErrorCode.ERROR.getCode(), message);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
    
    public static <T> Result<T> error(ErrorCode errorCode) {
        return error(errorCode.getCode(), errorCode.getMessage());
    }
    
    public static <T> Result<T> error(ErrorCode errorCode, String customMessage) {
        return error(errorCode.getCode(), customMessage);
    }
}
