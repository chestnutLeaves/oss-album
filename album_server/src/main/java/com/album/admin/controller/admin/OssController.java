package com.album.admin.controller.admin;

import com.album.admin.common.Result;
import com.album.admin.service.OssService;
import com.album.admin.dto.StsTokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * OSS 管理 Controller
 */
@RestController
@RequestMapping("/admin/oss")
@RequiredArgsConstructor
public class OssController {
    
    private final OssService ossService;

    /**
     * 获取阿里云 OSS STS 临时凭证
     * @param siteId 站点 ID（可选，不传则使用默认 bucket）
     */
    @GetMapping("/sts-token")
    public Result<StsTokenResponse> getStsToken(@RequestParam(required = false) Long siteId) {
        StsTokenResponse stsToken = ossService.getStsToken(siteId);
        return Result.success(stsToken);
    }
}
