import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
  minio?: Minio.Client;
};

function createClient() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
  });
}

export const minioClient = globalForMinio.minio ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "jxt";

export function getPublicUrl(objectName: string) {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = process.env.MINIO_ENDPOINT || "127.0.0.1";
  const port = process.env.MINIO_PORT || "9000";
  return `${protocol}://${endpoint}:${port}/${MINIO_BUCKET}/${objectName}`;
}

export function getObjectNameFromUrl(fileUrl: string) {
  try {
    const parsed = new URL(fileUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    if (segments[0] === MINIO_BUCKET) {
      return segments.slice(1).join("/");
    }
    return segments.join("/");
  } catch {
    return "";
  }
}
