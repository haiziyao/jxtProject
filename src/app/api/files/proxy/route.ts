import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getObjectNameFromUrl, MINIO_BUCKET, minioClient } from "@/lib/minio";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get("url");
  const download = request.nextUrl.searchParams.get("download") === "1";
  const name = request.nextUrl.searchParams.get("name") ?? "file";

  if (!fileUrl) {
    return NextResponse.json({ error: "url 参数缺失" }, { status: 400 });
  }

  const objectName = getObjectNameFromUrl(fileUrl);
  if (!objectName) {
    return NextResponse.json({ error: "无效文件地址" }, { status: 400 });
  }

  try {
    const [stat, stream] = await Promise.all([
      minioClient.statObject(MINIO_BUCKET, objectName),
      minioClient.getObject(MINIO_BUCKET, objectName),
    ]);

    const headers = new Headers();
    const contentType = stat.metaData?.["content-type"] || "application/octet-stream";
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, max-age=60");
    if (stat.size) {
      headers.set("Content-Length", String(stat.size));
    }
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(name)}"`,
    );

    return new NextResponse(Readable.toWeb(stream as Readable) as ReadableStream, { headers });
  } catch {
    return NextResponse.json({ error: "文件读取失败" }, { status: 404 });
  }
}
