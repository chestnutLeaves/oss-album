# 📷 个人相册管理系统

> **本项目由国产 AI IDE [TRAE](https://trae.ai) 从零到一全程辅助完成。**  
> 虽然在开发过程中存在一些局限性与不足，但系统功能完整、可正常部署使用，是一次 AI 辅助全栈开发的完整实践。

---

## 📌 项目简介

这是一套完整的**个人相册管理与展示系统**，包含三个子模块：

| 模块 | 说明 |
|------|------|
| `album_server` | Spring Boot 后端服务，提供 RESTful API |
| `album_admin` | 管理后台（Web），用于内容管理 |
| `album_web` | 前端展示网站，面向最终用户 |

系统采用**前后端分离架构**，以阿里云 OSS 为文件存储核心，支持多用户、多站点管理，实现一套代码部署多个独立相册站点。

---

## 🖼️ 项目截图

### 站点首页

![album_index](.\screen_shot\album_index.png)

---

### 站点搜索页

![album_explore](.\screen_shot\album_explore.png)

---

### 站点相册页

![album_info](.\screen_shot\album_info.png)

---

### 站点查看大图

![album_preview](.\screen_shot\album_preview.png)

---

### 相册管理

![admin_album_info](.\screen_shot\admin_album_info.png)

## ✨ 项目亮点

### 🗂️ 多用户多站点架构
- 支持多用户创建并管理各自独立的相册站点
- 通过 HTTP Referer 自动识别访问域名，动态路由至对应站点数据
- 一套代码、一次部署，即可驱动多个个性化相册网站

### ☁️ OSS 直传 + STS 安全授权
- 文件上传全程走阿里云 OSS，**不经过应用服务器**，对服务器带宽零压力
- 采用 STS 临时凭证机制，安全可靠，避免密钥泄露

### 🚀 高性能缓存设计
- 使用 Caffeine 本地缓存，减少数据库频繁查询
- 公开接口配置 60 秒缓存，显著提升高并发访问性能

### 🔐 安全机制完善
- 登录失败锁定（5 次失败后锁定 30 分钟）
- BCrypt 密码加密存储
- Token 服务端管理，支持主动失效

### 🌐 相册加密访问
- 支持为相册设置密码，保护私密照片不被随意浏览

### 📸 丰富的媒体能力
- 支持图片、视频上传与展示
- EXIF 信息自动提取与展示（拍摄参数、地理位置等）
- 缩略图自动生成，标签管理与标签云展示

### 📱 现代化 UI + 响应式设计
- 前端采用 Tailwind CSS，界面美观、交互流畅
- 完整适配 PC 端、平板、移动设备

---

## 🏗️ 系统架构

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  用户浏览器   │      │   管理后台    │      │  展示网站    │
│  (album_web) │      │(album_admin) │      │ (album_web) │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                      │
       │              Token 认证 / API 调用         │
       └────────────────────┼──────────────────────┘
                            │
                     ┌──────▼──────┐
                     │ album_server │
                     │ (Spring Boot)│
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │   MySQL     │ │Caffeine│ │ 阿里云 OSS│
       │  (元数据)    │ │ (缓存)  │ │(文件存储) │
       └─────────────┘ └────────┘ └──────────┘
```

---

## 🛠️ 技术栈总览

| 层次 | 技术 |
|------|------|
| 后端框架 | Spring Boot 3.2.0 + MyBatis-Plus 3.5.5 |
| 数据库 | MySQL 8.0+ |
| 缓存 | Caffeine |
| 安全认证 | Spring Security + 自定义 Token |
| 对象存储 | 阿里云 OSS + STS 临时授权 |
| 运行环境 | JDK 17 + Maven 3.6+ |
| 前端框架 | 原生 JavaScript (ES6 Modules) |
| CSS 框架 | Tailwind CSS |
| 图标库 | Font Awesome |
| 视频播放 | Video.js |

---

## 📦 模块说明

### 🔧 album_server（后端服务）

基于 Spring Boot 3 的 RESTful API 服务。

- 提供认证、相册、媒体、标签、Banner、OSS 等完整接口
- 支持多站点路由（基于域名自动识别）
- STS 临时凭证签发
- 逻辑删除 + 雪花算法主键

详见 → [`album_server/README.md`](./album_server/README.md)

---

### 🖥️ album_admin（管理后台）

纯前端静态页面，无需构建，开箱即用。

- 站点管理、相册管理、媒体上传、标签管理、轮播图管理
- 支持 EXIF 信息查看
- JWT Token 认证 + 自动登录过期处理
- 响应式设计，适配各种屏幕

详见 → [`album_admin/README.md`](./album_admin/README.md)

---

### 🌐 album_web（展示网站）

面向访问者的相册展示前端，纯静态，无需构建。

- 首页轮播 Banner + 相册列表 + 年份筛选
- 相册详情页：图片网格、视频播放、照片大图预览
- 标签云 + 关键词搜索
- 相册密码保护
- 拍摄参数（EXIF）展示

详见 → [`album_web/README.md`](./album_web/README.md)

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd album_server
# 修改 src/main/resources/application.yml 中的数据库和 OSS 配置
mvn clean package -DskipTests
java -jar target/album-server-1.0.0.jar
# 默认监听 http://localhost:8888/api
```

### 2. 部署管理后台

```bash
# 修改 album_admin/js/config.js 中的 API_BASE_URL
# 将 album_admin 目录部署到任意 Web 服务器
# 访问 index.html 登录，默认账号：admin / admin123
```

### 3. 部署展示网站

```bash
# 修改 album_web/assets/js/config.js 中的 API_BASE_URL
# 将 album_web 目录部署到目标域名的 Web 服务器
# 访问首页即可
```

### 4. 初始化数据库

```sql
CREATE DATABASE album_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 执行 album_server/src/main/resources/db/schema.sql
-- 执行 album_server/src/main/resources/db/init.sql
```

---

## ⚠️ 已知局限性

> 本项目由 AI 全程辅助生成，在以下方面存在一定局限，后续可进一步优化：

- 新用户注册与站点创建目前需手动操作数据库，暂无 UI 入口
- 多用户权限体系相对简单，暂不支持细粒度角色管理
- 前端未使用构建工具（Webpack/Vite），大型场景下性能有待提升
- 图片处理基于JS的简单压缩，不支持精细控制

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

## 🤖 关于本项目

> 本项目由 **[TRAE](https://trae.ai)**（国产 AI IDE）从零到一全程辅助生成，涵盖需求分析、架构设计、数据库设计、后端开发、前端开发全流程。  
> 这是一次完整的 AI 辅助全栈开发实践——虽然存在一些局限与不完美，但系统功能完整、可正常运行部署，展示了 AI 辅助开发在真实项目中的可行性。

---

*记录生活中的每一个美好瞬间 📸*
