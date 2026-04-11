# Module 4: 文件上传 (MinIO)

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 3.

---

### Task 4.1: MinIO 客户端单例

**Files:**
- Create: `src/lib/minio.ts`

**Step 1: 创建 `src/lib/minio.ts`**

```ts
import * as Minio from "minio";

// 防止热重载时多次实例化
const globalForMinio = globalThis as unknown as { minio: Minio.Client };

function createMinioClient(): Minio.Client {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT ?? "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

export const minioClient: Minio.Client =
  globalForMinio.minio ?? createMinioClient();

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET!;

// 生成文件公开访问 URL
export function getPublicUrl(objectName: string): string {
  const proto = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port = process.env.MINIO_PORT ?? "9000";
  return `${proto}://${process.env.MINIO_ENDPOINT}:${port}/${MINIO_BUCKET}/${objectName}`;
}
```

**Step 2: 确保 MinIO bucket 允许公开读取**

在云服务器上执行（或通过 MinIO Console `http://8.152.100.169:9001`）：

```bash
# 设置 bucket 策略为公开可读
mc alias set myminio http://8.152.100.169:9000 minioadmin minioadmin
mc anonymous set download myminio/jxt
```

**Step 3: Commit**

```bash
git add src/lib/minio.ts
git commit -m "feat: add MinIO client singleton with public URL helper"
```

---

### Task 4.2: 文件上传 API Route

**Files:**
- Create: `src/app/api/upload/route.ts`

**Step 1: 创建 `src/app/api/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { minioClient, MINIO_BUCKET, getPublicUrl } from "@/lib/minio";
import { randomUUID } from "crypto";
import path from "path";

// 允许的文件类型
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// 最大文件大小：10MB
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "文件大小超过 10MB 限制" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const objectName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": file.type,
  });

  return NextResponse.json({ url: getPublicUrl(objectName) });
}
```

**Step 2: 验证上传 API**

先启动开发服务器，然后用 curl 测试：

```bash
# 先用正确密码登录获取 Cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_site_password"}'

# 上传测试图片
curl -b cookies.txt -X POST http://localhost:3000/api/upload \
  -F "file=@test.jpg"
```

预期返回：
```json
{"url":"http://8.152.100.169:9000/jxt/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jpg"}
```

验证该 URL 在浏览器中可直接访问图片。

**Step 3: Commit**

```bash
git add src/app/api/upload/
git commit -m "feat: add file upload API route with MinIO storage and type/size validation"
```

---

**Module 4 完成检查清单：**
- [ ] MinIO 客户端可正常连接到 `8.152.100.169:9000`
- [ ] 上传 API 返回正确的公开访问 URL
- [ ] 上传的文件可通过返回的 URL 在浏览器直接访问
- [ ] 超过 10MB 的文件返回 400 错误
- [ ] 不支持的文件类型返回 400 错误
- [ ] `npm run build` 无错误
