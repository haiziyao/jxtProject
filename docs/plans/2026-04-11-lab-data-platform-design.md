# 澶у垱椤圭洰瀹為獙鏁版嵁骞冲彴 鈥?璁捐鏂囨。

**椤圭洰鍚嶇О**锛氶伩闆峰櫒楂樻€ц兘楂樼數浣嶆搴︽哀鍖栭攲鍘嬫晱鐢甸樆鐗囩殑鐮斿彂鍜屽簲鐢? 
**鏂囨。鏃ユ湡**锛?026-04-11  
**浣跨敤浜哄憳**锛氬皬缁勬垚鍛?5 浜?+ 鎸囧鑰佸笀/瀛﹂暱 2 浜猴紝鍏?7 浜?
---

## 涓€銆侀」鐩洰鏍?
鏋勫缓涓€涓唴閮ㄥ疄楠屾暟鎹鐞嗙綉绔欙紝渚涘洟闃熸垚鍛樿褰曘€佹煡鐪嬪疄楠屾暟鎹拰椤圭洰杩涘害銆傝姹傦細

- 瀵嗙爜淇濇姢锛岄槻姝㈠閮ㄨ闂?- 鏀寔鎵嬫満鍜岀數鑴戞祻瑙堝櫒璁块棶
- 鏍稿績鍔熻兘锛氶」鐩粙缁嶇鐞?+ 瀹為獙鏁版嵁鏀堕泦涓庡睍绀?
---

## 浜屻€佹妧鏈爤

| 灞傛 | 鎶€鏈?|
|------|------|
| 鍓嶇妗嗘灦 | Next.js 14锛圓pp Router锛墊
| UI 缁勪欢搴?| shadcn/ui + Tailwind CSS |
| 瀵屾枃鏈紪杈戝櫒 | Tiptap |
| 鍚庣 | Next.js API Routes |
| 鏁版嵁搴?| MySQL 8锛堜簯鏈嶅姟鍣級 |
| ORM | Prisma |
| 鍥剧墖瀛樺偍 | MinIO |
| 璁よ瘉 | 鍗曚竴瀵嗙爜 + JWT Cookie锛?4澶╂湁鏁堟湡锛墊
| 閮ㄧ讲 | Vercel锛堝墠绔?API锛墊

---

## 涓夈€佸熀纭€璁炬柦杩炴帴淇℃伅

```
MySQL:
  host:     db-host:3306
  database: jxt
  username: jxt
  password: 123456

MinIO:
  endpoint:   http://minio-host:9000
  access-key: your-minio-secret
  secret-key: your-minio-secret
  bucket:     jxt

璁よ瘉:
  SITE_PASSWORD: 瀛樹簬 .env 閰嶇疆鏂囦欢锛屽彲闅忔椂淇敼
  JWT_SECRET:    瀛樹簬 .env 閰嶇疆鏂囦欢
  Cookie 鏈夋晥鏈? 14 澶?```

---

## 鍥涖€佹暣浣撴灦鏋?
```
鐢ㄦ埛娴忚鍣紙鎵嬫満/鐢佃剳锛?        鈹?HTTPS
        鈻?  Vercel 鎵樼
  Next.js 14 App Router
  鈹溾攢鈹€ 鍓嶇椤甸潰锛圧eact + Tailwind + shadcn/ui锛?  鈹斺攢鈹€ API Routes锛?api/*锛?        鈹溾攢鈹€ MySQL锛圥risma ORM锛?        鈹斺攢鈹€ MinIO锛堝浘鐗囦笂浼?璇诲彇锛?```

**璁よ瘉娴佺▼**锛? 
鐢ㄦ埛杈撳叆瀵嗙爜 鈫?`/api/auth/login` 瀵规瘮 `.env` 涓?`SITE_PASSWORD` 鈫?鍖归厤鍒欑鍙?JWT Cookie锛?4澶╋級鈫?鍚庣画璇锋眰涓棿浠惰嚜鍔ㄩ獙璇?Cookie

---

## 浜斻€佹暟鎹簱璁捐锛圡ySQL锛?
### 1. 鏍囩琛?`tags`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
name        VARCHAR(50) NOT NULL
color       VARCHAR(20) NOT NULL  -- 鍗佸叚杩涘埗棰滆壊鍊硷紝濡?#FF5733
created_at  DATETIME DEFAULT NOW()
```

### 2. 椤圭洰浠嬬粛鏉垮潡琛?`project_sections`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
title       VARCHAR(100) NOT NULL   -- 濡?椤圭洰瀹炴柦鏂规硶"銆?鍒涙柊鐐?
content     LONGTEXT                -- 瀵屾枃鏈?HTML
sort_order  INT DEFAULT 0
updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW()
```

### 3. 椤圭洰闄勪欢琛?`project_attachments`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
name        VARCHAR(200) NOT NULL   -- 鏂囦欢鍚?file_url    VARCHAR(500) NOT NULL   -- MinIO 鏂囦欢 URL
file_size   BIGINT                  -- 瀛楄妭鏁?uploaded_at DATETIME DEFAULT NOW()
```

### 4. 瀹為獙璁板綍琛?`experiments`
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
title       VARCHAR(200) NOT NULL   -- 瀹為獙鏍囬
recorder    VARCHAR(50) NOT NULL    -- 瀹為獙璁板綍浜?exp_date    DATE NOT NULL           -- 瀹為獙鏃堕棿
summary     TEXT NOT NULL           -- 瀹為獙绠€浠?created_at  DATETIME DEFAULT NOW()
updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW()
```

### 5. 瀹為獙鍥剧墖琛?`experiment_images`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
experiment_id   INT NOT NULL REFERENCES experiments(id)
image_url       VARCHAR(500) NOT NULL
sort_order      INT DEFAULT 0
```

### 6. 瀹為獙-鏍囩鍏宠仈琛?`experiment_tags`
```sql
experiment_id   INT NOT NULL REFERENCES experiments(id)
tag_id          INT NOT NULL REFERENCES tags(id)
PRIMARY KEY (experiment_id, tag_id)
```

### 7. 瀹為獙澶囨敞琛?`experiment_notes`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
experiment_id   INT NOT NULL REFERENCES experiments(id)
content         LONGTEXT NOT NULL  -- 瀵屾枃鏈?HTML锛屽彲鍚浘鐗?created_at      DATETIME DEFAULT NOW()
```

---

## 鍏€侀〉闈㈣矾鐢辩粨鏋?
```
/                          瀵嗙爜鐧诲綍椤?/dashboard                 涓婚〉锛堜袱涓叆鍙ｅ崱鐗囷級
/project                   椤圭洰浠嬬粛
  鈹斺攢鈹€ 鍚勬澘鍧楀瘜鏂囨湰灞曠ず + 闄勪欢涓嬭浇 + 缂栬緫鎸夐挳
/experiments               瀹為獙缁熻鍒楄〃
  鈹溾攢鈹€ 鏍囩绛涢€夋爮锛堝閫夛級
  鈹溾攢鈹€ 瀹為獙璁板綍鍗＄墖鍒楄〃锛堟椂闂村€掑簭锛?  鈹斺攢鈹€ 鏂板缓瀹為獙鎸夐挳锛堝脊绐楋級
/experiments/[id]          瀹為獙璇︽儏椤?  鈹溾攢鈹€ 鍩烘湰淇℃伅锛堟爣棰?璁板綍浜?鏃堕棿/绠€浠?鏍囩锛?  鈹溾攢鈹€ 瀹為獙鍥剧墖鐢诲粖
  鈹斺攢鈹€ 澶囨敞鍖猴紙瀵屾枃鏈紝鍙拷鍔犲鏉″娉級
```

---

## 涓冦€丄PI 鎺ュ彛璁捐

### 璁よ瘉
| 鏂规硶 | 璺緞 | 璇存槑 |
|------|------|------|
| POST | `/api/auth/login` | 楠岃瘉瀵嗙爜锛岀鍙?JWT Cookie |
| POST | `/api/auth/logout` | 娓呴櫎 Cookie |

### 椤圭洰浠嬬粛
| 鏂规硶 | 璺緞 | 璇存槑 |
|------|------|------|
| GET | `/api/project/sections` | 鑾峰彇鎵€鏈夋澘鍧?|
| PUT | `/api/project/sections/[id]` | 鏇存柊鏌愭澘鍧楀唴瀹?|
| POST | `/api/project/sections` | 鏂板缓鏉垮潡 |
| DELETE | `/api/project/sections/[id]` | 鍒犻櫎鏉垮潡 |
| GET | `/api/project/attachments` | 鑾峰彇鎵€鏈夐檮浠?|
| POST | `/api/project/attachments` | 涓婁紶闄勪欢 |
| DELETE | `/api/project/attachments/[id]` | 鍒犻櫎闄勪欢 |

### 瀹為獙璁板綍
| 鏂规硶 | 璺緞 | 璇存槑 |
|------|------|------|
| GET | `/api/experiments` | 鑾峰彇鍒楄〃锛堟敮鎸佹爣绛剧瓫閫夛級 |
| POST | `/api/experiments` | 鏂板缓瀹為獙璁板綍 |
| GET | `/api/experiments/[id]` | 鑾峰彇瀹為獙璇︽儏 |
| PUT | `/api/experiments/[id]` | 缂栬緫瀹為獙璁板綍 |
| DELETE | `/api/experiments/[id]` | 鍒犻櫎瀹為獙璁板綍 |
| POST | `/api/experiments/[id]/notes` | 鏂板澶囨敞 |
| DELETE | `/api/experiments/[id]/notes/[noteId]` | 鍒犻櫎澶囨敞 |

### 鏍囩
| 鏂规硶 | 璺緞 | 璇存槑 |
|------|------|------|
| GET | `/api/tags` | 鑾峰彇鎵€鏈夋爣绛?|
| POST | `/api/tags` | 鏂板缓鏍囩 |
| DELETE | `/api/tags/[id]` | 鍒犻櫎鏍囩 |

### 鏂囦欢涓婁紶
| 鏂规硶 | 璺緞 | 璇存槑 |
|------|------|------|
| POST | `/api/upload` | 涓婁紶鍥剧墖/鏂囦欢鍒?MinIO锛岃繑鍥?URL |

---

## 鍏€佸搷搴斿紡璁捐绛栫暐

- 鍏ㄧ▼浣跨敤 Tailwind CSS 鍝嶅簲寮忔柇鐐癸紙`sm:` / `md:` / `lg:`锛?- 鎵嬫満绔細鍗曞垪甯冨眬锛屽簳閮ㄦ垨姹夊牎鑿滃崟瀵艰埅
- 鐢佃剳绔細渚ц竟鏍忓鑸?+ 涓诲唴瀹瑰尯鍙屾爮甯冨眬
- 鍥剧墖鐢诲粖锛氭墜鏈?2 鍒楋紝鐢佃剳 3-4 鍒?
---

## 涔濄€佺幆澧冨彉閲忥紙.env锛?
```env
# 鏁版嵁搴?DATABASE_URL="mysql://user:password@db-host:3306/dbname"

# MinIO
MINIO_ENDPOINT="http://minio-host:9000"
MINIO_ACCESS_KEY="your-minio-secret"
MINIO_SECRET_KEY="your-minio-secret"
MINIO_BUCKET="jxt"

# 璁よ瘉
SITE_PASSWORD="your_password_here"
JWT_SECRET="your_jwt_secret_here"
```

---

## 鍗併€侀儴缃叉柟妗?
1. 浠ｇ爜鎵樼锛欸itHub 绉佹湁浠撳簱
2. Vercel 杩炴帴 GitHub锛岃嚜鍔?CI/CD
3. Vercel 鐜鍙橀噺閰嶇疆锛堝悓 `.env` 鍐呭锛?4. MinIO bucket 璁剧疆閫傚綋鐨勮闂瓥鐣ワ紙鍥剧墖鍏紑鍙锛?5. MySQL 鏁版嵁搴撻€氳繃 Prisma migrate 鍒濆鍖栬〃缁撴瀯

