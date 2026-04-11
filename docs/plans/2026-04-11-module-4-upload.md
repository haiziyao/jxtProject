# Module 4: 鏂囦欢涓婁紶 (MinIO)

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 3.

---

### Task 4.1: MinIO 瀹㈡埛绔崟渚?
**Files:**
- Create: `src/lib/minio.ts`

**Step 1: 鍒涘缓 `src/lib/minio.ts`**

```ts
import * as Minio from "minio";

// 闃叉鐑噸杞芥椂澶氭瀹炰緥鍖?const globalForMinio = globalThis as unknown as { minio: Minio.Client };

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

// 鐢熸垚鏂囦欢鍏紑璁块棶 URL
export function getPublicUrl(objectName: string): string {
  const proto = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port = process.env.MINIO_PORT ?? "9000";
  return `${proto}://${process.env.MINIO_ENDPOINT}:${port}/${MINIO_BUCKET}/${objectName}`;
}
```

**Step 2: 纭繚 MinIO bucket 鍏佽鍏紑璇诲彇**

鍦ㄤ簯鏈嶅姟鍣ㄤ笂鎵ц锛堟垨閫氳繃 MinIO Console `http://minio-host:9001`锛夛細

```bash
# 璁剧疆 bucket 绛栫暐涓哄叕寮€鍙
mc alias set myminio http://minio-host:9000 your-minio-secret your-minio-secret
mc anonymous set download myminio/jxt
```

**Step 3: Commit**

```bash
git add src/lib/minio.ts
git commit -m "feat: add MinIO client singleton with public URL helper"
```

---

### Task 4.2: 鏂囦欢涓婁紶 API Route

**Files:**
- Create: `src/app/api/upload/route.ts`

**Step 1: 鍒涘缓 `src/app/api/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { minioClient, MINIO_BUCKET, getPublicUrl } from "@/lib/minio";
import { randomUUID } from "crypto";
import path from "path";

// 鍏佽鐨勬枃浠剁被鍨?const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// 鏈€澶ф枃浠跺ぇ灏忥細10MB
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "璇锋眰鏍煎紡閿欒" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "鏈彁渚涙枃浠? }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "涓嶆敮鎸佺殑鏂囦欢绫诲瀷" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "鏂囦欢澶у皬瓒呰繃 10MB 闄愬埗" }, { status: 400 });
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

**Step 2: 楠岃瘉涓婁紶 API**

鍏堝惎鍔ㄥ紑鍙戞湇鍔″櫒锛岀劧鍚庣敤 curl 娴嬭瘯锛?
```bash
# 鍏堢敤姝ｇ‘瀵嗙爜鐧诲綍鑾峰彇 Cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_site_password"}'

# 涓婁紶娴嬭瘯鍥剧墖
curl -b cookies.txt -X POST http://localhost:3000/api/upload \
  -F "file=@test.jpg"
```

棰勬湡杩斿洖锛?```json
{"url":"http://minio-host:9000/jxt/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jpg"}
```

楠岃瘉璇?URL 鍦ㄦ祻瑙堝櫒涓彲鐩存帴璁块棶鍥剧墖銆?
**Step 3: Commit**

```bash
git add src/app/api/upload/
git commit -m "feat: add file upload API route with MinIO storage and type/size validation"
```

---

**Module 4 瀹屾垚妫€鏌ユ竻鍗曪細**
- [ ] MinIO 瀹㈡埛绔彲姝ｅ父杩炴帴鍒?`minio-host:9000`
- [ ] 涓婁紶 API 杩斿洖姝ｇ‘鐨勫叕寮€璁块棶 URL
- [ ] 涓婁紶鐨勬枃浠跺彲閫氳繃杩斿洖鐨?URL 鍦ㄦ祻瑙堝櫒鐩存帴璁块棶
- [ ] 瓒呰繃 10MB 鐨勬枃浠惰繑鍥?400 閿欒
- [ ] 涓嶆敮鎸佺殑鏂囦欢绫诲瀷杩斿洖 400 閿欒
- [ ] `npm run build` 鏃犻敊璇?
