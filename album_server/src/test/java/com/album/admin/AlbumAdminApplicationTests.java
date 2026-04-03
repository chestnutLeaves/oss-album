package com.album.admin;

import com.album.admin.service.SysAccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 应用启动测试
 */
@SpringBootTest
public class AlbumAdminApplicationTests {
    
    @Autowired
    private SysAccountService sysAccountService;
    
    @Test
    public void contextLoads() {
        // 验证应用能否正常启动
        System.out.println("应用启动成功!");
    }
    
    @Test
    public void testGetByUsername() {
        // 测试查询账号
        var account = sysAccountService.getByUsername("admin");
        System.out.println("查询到账号：" + (account != null ? account.getUsername() : "null"));
    }
}
