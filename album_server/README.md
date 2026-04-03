# 基于阿里云OSS的个人相册管理系统（服务端）

一个基于 Spring Boot 3 + MyBatis-Plus 的个人相册管理与在线展示系统，支持多用户、多站点管理，采用阿里云 OSS 实现文件存储与 CDN 加速。

## 📖 项目简介

本项目是一套完整的相册管理系统，包含**服务端**、**管理平台**和**前端网站**三个部分。系统采用前后端分离架构，支持多用户、多站点管理，通过域名自动区分不同站点，实现一套代码部署多个独立站点。

### 核心特点

- **多用户多站点**: 支持多个用户创建和管理多个独立站点，通过数据库手动配置用户与站点的关联关系
- **基于域名的站点路由**: 通过 HTTP Referer 自动识别访问域名，返回对应站点数据
- **OSS 直传架构**: 文件上传和存储均在阿里云 OSS 完成，对服务器带宽零要求
- **STS 安全授权**: 采用阿里云 STS 临时授权 + 前端直传模式，安全可靠
- **灵活配置**: 支持自定义站点标题、描述、Banner、相册密码等功能
- **高性能缓存**: 使用 Caffeine 实现多级缓存，优化访问性能

## 🏗️ 系统架构

### 技术栈

#### 后端 (本仓库)
- **框架**: Spring Boot 3.2.0
- **ORM**: MyBatis-Plus 3.5.5
- **数据库**: MySQL 8.0+
- **缓存**: Caffeine
- **安全**: Spring Security + Token 认证
- **对象存储**: 阿里云 OSS SDK 3.18.1
- **JDK**: Java 17

#### 前端 (独立仓库)
- 管理平台：用于相册、媒体资源、站点配置的管理
- 前端网站：面向最终用户的相册展示页面

### 架构图

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   用户浏览器  │      │  管理平台     │      │  前端网站    │
│             │      │              │      │             │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                      │
       │  Token 认证        │ API 调用             │ API 调用
       │  STS 临时凭证       │                      │
       └────────────────────┼──────────────────────┘
                            │
                     ┌──────▼──────┐
                     │  Album Server │
                     │  (Spring Boot)│
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │   MySQL     │ │Caffeine│ │ 阿里云 OSS│
       │  (元数据)    │ │ (缓存)  │ │(文件存储) │
       └─────────────┘ └────────┘ └──────────┘
```

## 🚀 快速开始

### 环境要求

- JDK 17+
- MySQL 8.0+
- Maven 3.6+
- 阿里云账号（已开通 OSS 服务）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/album_server.git
cd album_server
```

#### 2. 配置数据库

创建数据库并导入 Schema：

```sql
CREATE DATABASE album_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE album_db;
```

执行 `src/main/resources/db/schema.sql` 初始化表结构。

执行 `src/main/resources/db/init.sql` 插入默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

#### 3. 配置文件

修改 `src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/album_db?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password

# 阿里云 OSS 配置
aliyun:
  oss:
    region: cn-shanghai
    access-key-id: YOUR_ACCESS_KEY_ID
    access-key-secret: YOUR_ACCESS_KEY_SECRET
    sts-duration-seconds: 3600
    role-arn: acs:ram::YOUR_USER_ID:role/oss-sh-access-role
    bucket-name: your-bucket-name
    bucket-domain: https://your-bucket-domain.com
```

#### 4. 编译运行

```bash
mvn clean package
java -jar target/album-server-1.0.0.jar
```

默认访问地址：http://localhost:8888/api

## 📋 核心功能

### 1. 多用户多站点管理

系统支持多用户和多站点，但**站点和用户的创建、以及用户与站点的关联需要手动在数据库进行操作**。

#### 数据库表结构

- **site_info**: 站点信息表（域名、标题、描述等）
- **sys_account**: 用户账号表
- **user_site_rel**: 用户站点关联表

#### 手动配置示例

```sql
-- 1. 创建站点
INSERT INTO site_info (id, domain, title, description, admin_url, create_time) 
VALUES (1, 'photo.example.com', '我的相册', '记录美好生活', 'https://admin.example.com', NOW());

-- 2. 创建用户（或复用已有用户）
INSERT INTO sys_account (id, username, password, create_time) 
VALUES (2, 'user1', '$10$bcrypt_hash', NOW());

-- 3. 建立用户与站点的关联
INSERT INTO user_site_rel (id, user_id, site_id, create_time) 
VALUES (1, 2, 1, NOW());
```

#### 站点路由机制

系统通过 HTTP Referer 头自动识别访问域名，并返回对应站点数据：

```java
// SiteInfoController.java
@GetMapping("/open/site/info")
public Result<SiteInfoVO> getSiteInfo(HttpServletRequest request) {
    String referer = request.getHeader("Referer");
    String domain = HttpUtil.extractDomain(referer);
    SiteInfoVO siteDetail = siteInfoOpenService.getSiteDetail(domain);
    return Result.success(siteDetail);
}
```

**前端部署方案**：
- 一套前端代码可部署到多个域名
- 每个域名对应 `site_info` 表中的一条记录
- 前端每次启动时调用 `/api/open/site/config` 获取当前域名的站点配置

### 2. OSS 直传与 STS 授权

系统采用**前端直传 OSS**模式，文件不经过应用服务器，极大降低服务器带宽压力。

#### 工作流程

```
1. 前端请求 STS Token
   GET /api/admin/oss/sts-token?siteId=1
   
2. 后端返回临时凭证
   {
     "accessKeyId": "STS.xxx",
     "accessKeySecret": "xxx",
     "securityToken": "CAIShwJ1q6Ft5B2dFi...",
     "expiration": "2024-01-01T12:00:00Z",
     "region": "cn-shanghai",
     "bucketName": "album-sh",
     "publicDomain": "https://oss-album-sh.example.com"
   }
   
3. 前端使用凭证直传 OSS
   POST https://album-sh.oss-cn-shanghai.aliyuncs.com/
   Headers: 
     - x-oss-security-token: CAIShwJ1q6Ft5B2dFi...
   Body: file
```

#### 技术实现

参考文档：[阿里云 OSS 客户端直传](https://help.aliyun.com/zh/oss/user-guide/uploading-objects-to-oss-directly-from-clients/)

```java
// OssServiceImpl.java - 获取 STS Token
public StsTokenResponse getStsToken(Long siteId) {
    // 1. 从缓存获取（避免频繁请求）
    // 2. 调用阿里云 STS 服务 AssumeRole
    // 3. 返回临时凭证给前端
    IClientProfile profile = DefaultProfile.getProfile(region, accessKeyId, accessKeySecret);
    AssumeRoleRequest request = new AssumeRoleRequest();
    request.setRoleArn(roleArn);
    request.setRoleSessionName("album-upload-session");
    request.setDurationSeconds(stsDurationSeconds);
    // ...
}
```

### 3. 相册与媒体资源管理

#### 相册功能
- 支持按年份分类
- 支持密码保护（可选）
- 自定义 OSS 路径前缀
- 封面图设置
- 排序控制

#### 媒体资源
- 支持图片、视频上传
- EXIF 信息自动提取
- 缩略图生成
- 标签管理
- 批量操作

### 4. 标签系统

- 支持为媒体资源添加标签
- 标签云展示
- 按标签筛选媒体
- 多对多关系（media_tag_rel 表）

### 5. Banner 轮播图

- 每个站点支持多个 Banner
- 自定义排序
- 支持标题和描述
- EXIF 信息展示

## 🔐 安全机制

### Token 认证

系统采用自定义 Token 认证机制（非 JWT），Token 存储在服务器内存缓存中：

```java
// TokenAuthenticationFilter.java
protected void doFilterInternal(HttpServletRequest request, 
                                HttpServletResponse response, 
                                FilterChain filterChain) {
    String token = extractToken(request);
    Long userId = sysAccountService.verifyToken(token);
    if (userId != null) {
        // 设置认证上下文
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    filterChain.doFilter(request, response);
}
```

**特点**：
- Token 有效期：24 小时（可配置）
- 支持登录失败锁定（5 次失败后锁定 30 分钟）
- BCrypt 密码加密
- 支持退出登录（Token 失效）

### 权限控制

- 基于用户 - 站点关联的权限校验
- 所有管理接口均需 Token 认证
- 公开接口（/open/**）无需认证

## 📊 API 接口概览

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 退出登录
- `POST /api/auth/change-password` - 修改密码

### 站点管理
- `GET /api/admin/sites` - 获取当前用户的站点列表
- `PUT /api/admin/sites` - 更新站点信息
- `DELETE /api/admin/sites/{id}` - 删除站点

### 公开接口（基于域名）
- `GET /api/open/site/info` - 获取站点完整详情
- `GET /api/open/site/config` - 获取站点配置（带 60 秒缓存）

### 相册管理
- `GET /api/admin/albums` - 获取相册列表
- `POST /api/admin/albums` - 创建相册
- `PUT /api/admin/albums` - 更新相册
- `DELETE /api/admin/albums/{id}` - 删除相册
- `GET /api/open/albums` - 公开相册列表（按站点）

### 媒体资源
- `POST /api/admin/media` - 创建媒体资源
- `PUT /api/admin/media` - 更新媒体信息
- `DELETE /api/admin/media/{id}` - 删除媒体
- `POST /api/admin/media/search` - 搜索媒体
- `GET /api/open/media` - 公开媒体详情

### OSS 相关
- `GET /api/admin/oss/sts-token` - 获取 STS 临时凭证

### 标签管理
- `GET /api/admin/tags` - 获取标签列表
- `POST /api/admin/tags` - 创建标签
- `DELETE /api/admin/tags/{id}` - 删除标签

## 🗄️ 数据库设计

### 核心表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `sys_account` | 系统用户表 | username, password, last_login_ip |
| `site_info` | 站点信息表 | domain, title, description, admin_url |
| `user_site_rel` | 用户站点关联表 | user_id, site_id |
| `album` | 相册表 | site_id, year, title, oss_prefix, need_password |
| `media_resource` | 媒体资源表 | album_id, file_url, thumbnail_url, exif_info, is_cover |
| `tag` | 标签表 | name, color |
| `media_tag_rel` | 媒体标签关联表 | media_id, tag_id |
| `site_banner` | 站点 Banner 表 | site_id, image_url, sort_order |

所有表均采用逻辑删除（deleted 字段），使用雪花算法生成主键 ID。

## 🔧 配置说明

### application.yml 关键配置

```yaml
# 服务端口和上下文路径
server:
  port: 8888
  servlet:
    context-path: /api

# 数据库连接
spring.datasource:
  url: jdbc:mysql://host:port/database
  hikari:
    minimum-idle: 5
    maximum-pool-size: 20

# MyBatis-Plus 配置
mybatis-plus:
  global-config:
    db-config:
      id-type: assign_id  # 雪花算法
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

# Token 配置
token:
  expiration: 86400  # 24 小时

# 登录安全配置
security:
  login:
    max-fail-count: 5
    lock-time: 1800

# OSS 配置（必须）
aliyun.oss:
  region: cn-shanghai
  access-key-id: xxx
  access-key-secret: xxx
  sts-duration-seconds: 3600
  role-arn: acs:ram::xxx:role/xxx
  bucket-name: xxx
  bucket-domain: https://xxx
```

## 🛠️ 开发指南

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/album_server.git

# 进入目录
cd album_server

# 修改配置文件 src/main/resources/application.yml

# 启动应用
mvn spring-boot:run
```

### 打包部署

```bash
# 编译打包
mvn clean package -DskipTests

# 运行
java -jar target/album-server-1.0.0.jar

# 或使用 nohup 后台运行
nohup java -jar target/album-server-1.0.0.jar > app.log 2>&1 &
```

### Docker 部署（可选）

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/album-server-1.0.0.jar app.jar
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 📝 常见问题

### Q1: 如何添加新用户？

目前需要通过数据库手动添加：

```sql
-- 使用 BCrypt 加密密码（例如 admin123）
-- 可使用在线工具生成 bcrypt 哈希：https://bcrypt-generator.com/
INSERT INTO sys_account (id, username, password, create_time) 
VALUES (snowflake_id, 'newuser', '$10$bcrypt_hash', NOW());

-- 关联用户到站点
INSERT INTO user_site_rel (id, user_id, site_id, create_time) 
VALUES (snowflake_id, user_id, site_id, NOW());
```

### Q2: 如何创建新站点？

```sql
INSERT INTO site_info (id, domain, title, description, admin_url, create_time) 
VALUES (snowflake_id, 'new.yourdomain.com', '新站点', '描述内容', 'https://admin.yourdomain.com', NOW());
```

### Q3: OSS 上传失败？

检查以下配置：
1. 阿里云 AccessKey 是否正确
2. RAM 角色 ARN 是否配置并授予 OSS 权限
3. Bucket 名称和 Region 是否匹配
4. 防火墙是否允许访问 OSS API

### Q4: 前端如何根据域名区分站点？

前端项目在每个页面的初始化阶段调用：

```javascript
// 前端初始化时
const response = await fetch('/api/open/site/config', {
  headers: {
    'Referer': window.location.href
  }
});
const config = await response.json();
// config.title, config.description 即为当前站点配置
```

## 🔄 版本历史

### v1.0.0 (2024-01)
- ✅ 基础相册管理功能
- ✅ 多用户多站点支持
- ✅ OSS 直传与 STS 授权
- ✅ 标签系统
- ✅ Banner 轮播图
- ✅ Token 认证与安全机制
- ✅ Caffeine 缓存优化

## 📄 License

本项目采用 MIT 开源协议。

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- Email: your.email@example.com
- GitHub Issues: [提交 Issue](https://github.com/yourusername/album_server/issues)

---

**注意**：本项目为个人相册管理系统，请勿用于商业用途。使用过程中请遵守相关法律法规，尊重版权和隐私。
