import { api, tokenManager } from './utils.js';
import { API_BASE_URL } from './config.js';

// OSS 客户端管理
class OSSClient {
  constructor() {
    this.client = null;
    this.credentials = null;
  }
  
  // 判断临时凭证是否到期
  isCredentialsExpired(credentials) {
    if (!credentials) {
      return true;
    }
    const expireDate = new Date(credentials.expiration);
    const now = new Date();
    // 如果有效期不足一分钟，视为过期
    return expireDate.getTime() - now.getTime() <= 60000;
  }
  
  // 获取或刷新 STS 凭证
  async getCredentials(siteId = null) {
    // 临时凭证过期时，才重新获取，减少对 STS 服务的调用
    if (this.isCredentialsExpired(this.credentials)) {

      const queryParams = siteId ? `?siteId=${siteId}` : '';
      // 使用统一的 API 基础地址
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/admin/oss/sts-token${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });
      
      if (!response.ok) {
        throw new Error(
          `获取 STS 令牌失败：${response.status} ${response.statusText}`
        );
      }
      
      const result = await response.json();
      this.credentials = result.data;

    }
    
    return this.credentials;
  }
  
  // 创建或获取 OSS 客户端实例
  async getClient(siteId = null) {
    // 如果客户端已存在且凭证未过期，直接返回
    if (this.client && !this.isCredentialsExpired(this.credentials)) {
      return this.client;
    }
    
    // 获取凭证
    const credentials = await this.getCredentials(siteId);
    
    // 动态加载 ali-oss SDK
    if (typeof OSS === 'undefined') {
      throw new Error('ali-oss SDK 未加载，请确保已引入 ali-oss.min.js');
    }
    
    // 直接使用后端返回的 region，SDK 会自动处理格式
    // 移除手动拼接 oss- 前缀的逻辑，避免域名错误
    const region = credentials.region || 'cn-shanghai';
    
    // 创建新的 OSS 客户端
    this.client = new OSS({
      region: region, // 直接使用后端返回的 region
      accessKeyId: credentials.accessKeyId,
      accessKeySecret: credentials.accessKeySecret,
      stsToken: credentials.securityToken,
      bucket: credentials.bucketName || 'album-sh',
      secure: true, // 保持安全
      timeout: 120000 // 增加超时时间到 2 分钟
      // 移除 authorizationV2: true，使用 SDK 默认签名策略
    });
    

    
    return this.client;
  }
  
  // 上传文件（带进度）
  async uploadFile(file, ossPath, siteId = null, onProgress = null) {
    try {

      
      // 获取客户端（会自动检查凭证是否过期）
      const client = await this.getClient(siteId);
      
      // 强制使用 put 方法上传所有文件，放弃分片上传
      // 保留进度监听功能
      const result = await client.put(ossPath, file, {
        progress: (progress, loaded, total) => {
          if (onProgress) {
            onProgress(Math.round(progress * 100), loaded, total);
          }
        }
      });
      
      // 替换为自定义域名
      let url = result.url;
      if (this.credentials && this.credentials.publicDomain) {
        // 提取 OSS 路径部分（去除协议和域名）
        const pathMatch = url.match(/https?:\/\/[^/]+\/(.*)/);
        if (pathMatch && pathMatch[1]) {
          const ossPath = pathMatch[1];
          url = `${this.credentials.publicDomain}/${ossPath}`;

        }
      }
      

      return url;
    } catch (error) {
      // 简化错误处理，清晰打印错误信息
      console.error('文件上传失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        status: error.status,
        name: error.name
      });
      throw error;
    }
  }
  
  // 重置凭证和客户端（强制刷新）
  reset() {
    this.credentials = null;
    this.client = null;

  }
}

// 导出单例
export const ossClient = new OSSClient();