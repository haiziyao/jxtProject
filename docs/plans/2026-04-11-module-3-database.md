# Module 3: 数据库 Schema

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 1 & 2.

---

### Task 3.1: 编写完整 Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 将 `prisma/schema.prisma` 替换为以下完整内容**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 标签表
model Tag {
  id          Int             @id @default(autoincrement())
  name        String          @db.VarChar(50)
  color       String          @db.VarChar(20)
  createdAt   DateTime        @default(now()) @map("created_at")
  experiments ExperimentTag[]

  @@map("tags")
}

// 项目介绍板块表
model ProjectSection {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(100)
  content   String   @db.LongText
  sortOrder Int      @default(0) @map("sort_order")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("project_sections")
}

// 项目附件表
model ProjectAttachment {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(200)
  fileUrl    String   @db.VarChar(500) @map("file_url")
  fileSize   BigInt?  @map("file_size")
  uploadedAt DateTime @default(now()) @map("uploaded_at")

  @@map("project_attachments")
}

// 实验记录表
model Experiment {
  id        Int               @id @default(autoincrement())
  title     String            @db.VarChar(200)
  recorder  String            @db.VarChar(50)
  expDate   DateTime          @map("exp_date") @db.Date
  summary   String            @db.Text
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")
  images    ExperimentImage[]
  tags      ExperimentTag[]
  notes     ExperimentNote[]

  @@map("experiments")
}

// 实验图片表
model ExperimentImage {
  id           Int        @id @default(autoincrement())
  experimentId Int        @map("experiment_id")
  imageUrl     String     @db.VarChar(500) @map("image_url")
  sortOrder    Int        @default(0) @map("sort_order")
  experiment   Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)

  @@map("experiment_images")
}

// 实验-标签关联表
model ExperimentTag {
  experimentId Int        @map("experiment_id")
  tagId        Int        @map("tag_id")
  experiment   Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  tag          Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([experimentId, tagId])
  @@map("experiment_tags")
}

// 实验备注表
model ExperimentNote {
  id           Int        @id @default(autoincrement())
  experimentId Int        @map("experiment_id")
  content      String     @db.LongText
  createdAt    DateTime   @default(now()) @map("created_at")
  experiment   Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)

  @@map("experiment_notes")
}
```

**Step 2: 运行数据库迁移**

```bash
npx prisma migrate dev --name init
```

预期输出：
```
✔ Generated Prisma Client (v5.x.x)
The following migration(s) have been created and applied:
migrations/
  └─ 20260411000000_init/
    └─ migration.sql
```

如果出现 `P3014` 错误（数据库已有表），改用：
```bash
npx prisma db push
```

**Step 3: 验证表结构**

```bash
npx prisma studio
```

访问 `http://localhost:5555`，确认以下 7 张表存在：
`tags` / `project_sections` / `project_attachments` / `experiments` / `experiment_images` / `experiment_tags` / `experiment_notes`

确认后 Ctrl+C 关闭。

---

### Task 3.2: 创建 Prisma Client 单例

**Files:**
- Create: `src/lib/prisma.ts`

**Step 1: 创建 `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

// 防止 Next.js 热重载时创建多个连接
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Step 2: 验证导入无错误**

```bash
npm run build
```

预期：Build 成功。

**Step 3: Commit**

```bash
git add prisma/ src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all 7 tables, run migration, add client singleton"
```

---

**Module 3 完成检查清单：**
- [ ] 7 张表在 MySQL 中创建成功
- [ ] Prisma Studio 可查看所有表
- [ ] `src/lib/prisma.ts` 可正常导入
- [ ] `npm run build` 无错误
