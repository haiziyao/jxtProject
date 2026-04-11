# 大创项目实验数据平台 — 设计文档

**项目名称**：避雷器高性能高电位梯度氧化锌压敏电阻片的研发和应用  
**文档日期**：2026-04-11  
**使用人员**：小组成员 5 人 + 指导老师/学长 2 人，共 7 人

---

## 一、项目目标

构建一个内部实验数据管理网站，供团队成员记录、查看实验数据和项目进度。要求：

- 密码保护，防止外部访问
- 支持手机和电脑浏览器访问
- 核心功能：项目介绍管理 + 实验数据收集与展示

---

## 二、技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | Next.js 14（App Router）|
| UI 组件库 | shadcn/ui + Tailwind CSS |
| 富文本编辑器 | Tiptap |
| 后端 | Next.js API Routes |
| 数据库 | MySQL 8（云服务器） |
| ORM | Prisma |
| 图片存储 | MinIO |
| 认证 | 单一密码 + JWT Cookie（14天有效期）|
| 部署 | Vercel（前端+API）|

---

## 三、基础设施连接信息

```
MySQL:
  host:     8.152.100.169:3306
  database: jxt
  username: jxt
  password: 123456

MinIO:
  endpoint:   http://8.152.100.169:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket:     jxt

认证:
  SITE_PASSWORD: 存于 .env 配置文件，可随时修改
  JWT_SECRET:    存于 .env 配置文件
  Cookie 有效期: 14 天
```

---

## 四、整体架构

```
用户浏览器（手机/电脑）
        │ HTTPS
        ▼
  Vercel 托管
  Next.js 14 App Router
  ├── 前端页面（React + Tailwind + shadcn/ui）
  └── API Routes（/api/*）
        ├── MySQL（Prisma ORM）
        └── MinIO（图片上传/读取）
```

**认证流程**：  
用户输入密码 → `/api/auth/login` 对比 `.env` 中 `SITE_PASSWORD` → 匹配则签发 JWT Cookie（14天）→ 后续请求中间件自动验证 Cookie

---

## 五、数据库设计（MySQL）

### 1. 标签表 `tags`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
name        VARCHAR(50) NOT NULL
color       VARCHAR(20) NOT NULL  -- 十六进制颜色值，如 #FF5733
created_at  DATETIME DEFAULT NOW()
```

### 2. 项目介绍板块表 `project_sections`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
title       VARCHAR(100) NOT NULL   -- 如"项目实施方法"、"创新点"
content     LONGTEXT                -- 富文本 HTML
sort_order  INT DEFAULT 0
updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW()
```

### 3. 项目附件表 `project_attachments`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
name        VARCHAR(200) NOT NULL   -- 文件名
file_url    VARCHAR(500) NOT NULL   -- MinIO 文件 URL
file_size   BIGINT                  -- 字节数
uploaded_at DATETIME DEFAULT NOW()
```

### 4. 实验记录表 `experiments`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
title       VARCHAR(200) NOT NULL   -- 实验标题
recorder    VARCHAR(50) NOT NULL    -- 实验记录人
exp_date    DATE NOT NULL           -- 实验时间
summary     TEXT NOT NULL           -- 实验简介
created_at  DATETIME DEFAULT NOW()
updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW()
```

### 5. 实验图片表 `experiment_images`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
experiment_id   INT NOT NULL REFERENCES experiments(id)
image_url       VARCHAR(500) NOT NULL
sort_order      INT DEFAULT 0
```

### 6. 实验-标签关联表 `experiment_tags`
```sql
experiment_id   INT NOT NULL REFERENCES experiments(id)
tag_id          INT NOT NULL REFERENCES tags(id)
PRIMARY KEY (experiment_id, tag_id)
```

### 7. 实验备注表 `experiment_notes`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
experiment_id   INT NOT NULL REFERENCES experiments(id)
content         LONGTEXT NOT NULL  -- 富文本 HTML，可含图片
created_at      DATETIME DEFAULT NOW()
```

---

## 六、页面路由结构

```
/                          密码登录页
/dashboard                 主页（两个入口卡片）
/project                   项目介绍
  └── 各板块富文本展示 + 附件下载 + 编辑按钮
/experiments               实验统计列表
  ├── 标签筛选栏（多选）
  ├── 实验记录卡片列表（时间倒序）
  └── 新建实验按钮（弹窗）
/experiments/[id]          实验详情页
  ├── 基本信息（标题/记录人/时间/简介/标签）
  ├── 实验图片画廊
  └── 备注区（富文本，可追加多条备注）
```

---

## 七、API 接口设计

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 验证密码，签发 JWT Cookie |
| POST | `/api/auth/logout` | 清除 Cookie |

### 项目介绍
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/project/sections` | 获取所有板块 |
| PUT | `/api/project/sections/[id]` | 更新某板块内容 |
| POST | `/api/project/sections` | 新建板块 |
| DELETE | `/api/project/sections/[id]` | 删除板块 |
| GET | `/api/project/attachments` | 获取所有附件 |
| POST | `/api/project/attachments` | 上传附件 |
| DELETE | `/api/project/attachments/[id]` | 删除附件 |

### 实验记录
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/experiments` | 获取列表（支持标签筛选） |
| POST | `/api/experiments` | 新建实验记录 |
| GET | `/api/experiments/[id]` | 获取实验详情 |
| PUT | `/api/experiments/[id]` | 编辑实验记录 |
| DELETE | `/api/experiments/[id]` | 删除实验记录 |
| POST | `/api/experiments/[id]/notes` | 新增备注 |
| DELETE | `/api/experiments/[id]/notes/[noteId]` | 删除备注 |

### 标签
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tags` | 获取所有标签 |
| POST | `/api/tags` | 新建标签 |
| DELETE | `/api/tags/[id]` | 删除标签 |

### 文件上传
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传图片/文件到 MinIO，返回 URL |

---

## 八、响应式设计策略

- 全程使用 Tailwind CSS 响应式断点（`sm:` / `md:` / `lg:`）
- 手机端：单列布局，底部或汉堡菜单导航
- 电脑端：侧边栏导航 + 主内容区双栏布局
- 图片画廊：手机 2 列，电脑 3-4 列

---

## 九、环境变量（.env）

```env
# 数据库
DATABASE_URL="mysql://jxt:123456@8.152.100.169:3306/jxt"

# MinIO
MINIO_ENDPOINT="http://8.152.100.169:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="jxt"

# 认证
SITE_PASSWORD="your_password_here"
JWT_SECRET="your_jwt_secret_here"
```

---

## 十、部署方案

1. 代码托管：GitHub 私有仓库
2. Vercel 连接 GitHub，自动 CI/CD
3. Vercel 环境变量配置（同 `.env` 内容）
4. MinIO bucket 设置适当的访问策略（图片公开可读）
5. MySQL 数据库通过 Prisma migrate 初始化表结构
