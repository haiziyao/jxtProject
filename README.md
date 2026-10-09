# JXT 实验资料平台

项目介绍与进度、成员资料、实验记录、Markdown 正文、附件和待办管理。使用 Next.js 14、Prisma/MySQL 和 MinIO，登录后访问项目数据。

实验正文使用 Vditor 编辑器，支持即时渲染、所见即所得和 Markdown 源码模式。阅读页提供文档目录、表格、公式、代码高亮和 `.md` 导出；手机使用全宽编辑区域。使用与维护说明见 [Markdown 文档界面](docs/markdown-editor.md)。

## 开发

需要 Node.js 22、MySQL 和 MinIO。

```bash
npm ci
cp .env.example .env
# 填入实际环境配置，并设置随机 JWT_SECRET
npx prisma generate
npm run dev
```

已有数据库使用现有表，启动和构建都不会执行迁移、初始化或种子写入。只有全新的空开发库才使用 `npx prisma db push` 建表；不要对已有生产库执行 reset、seed 或未经审查的结构同步。

## 检查与部署

```bash
npm test
npm run lint
npm run build
```

构建输出为 standalone。将 `.next/static` 复制到 `.next/standalone/.next/static`，存在 `public` 时也复制到 standalone 目录；通过服务管理器运行 `node .next/standalone/server.js`。运行时提供 `.env.example` 所列配置及 `PORT`、`HOSTNAME`。

生产部署应在独立版本目录完成构建，保留旧版本，切换链接后重启服务。数据库备份、配置、凭据和用户上传文件不进入 Git。HTTP 部署支持登录；使用 HTTPS 时登录 Cookie 自动启用 Secure。

数据接入与回归范围见 [恢复与检查记录](docs/recovery-and-audit.md)。
