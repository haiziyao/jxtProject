import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
  minio?: Minio.Client;
};

const MINIO_ENDPOINT_FALLBACK = "8.152.100.169";
const MINIO_PORT_FALLBACK = "9000";
const MINIO_USE_SSL_FALLBACK = "false";
const MINIO_ACCESS_KEY_FALLBACK = "minioadmin";
const MINIO_SECRET_KEY_FALLBACK = "minioadmin";
const MINIO_BUCKET_FALLBACK = "jxt";

function createClient() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || MINIO_ENDPOINT_FALLBACK,
    port: parseInt(process.env.MINIO_PORT || MINIO_PORT_FALLBACK, 10),
    useSSL: (process.env.MINIO_USE_SSL || MINIO_USE_SSL_FALLBACK) === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || MINIO_ACCESS_KEY_FALLBACK,
    secretKey: process.env.MINIO_SECRET_KEY || MINIO_SECRET_KEY_FALLBACK,
  });
}

export const minioClient = globalForMinio.minio ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET || MINIO_BUCKET_FALLBACK;

export function getPublicUrl(objectName: string) {
  const protocol = (process.env.MINIO_USE_SSL || MINIO_USE_SSL_FALLBACK) === "true" ? "https" : "http";
  const endpoint = process.env.MINIO_ENDPOINT || MINIO_ENDPOINT_FALLBACK;
  const port = process.env.MINIO_PORT || MINIO_PORT_FALLBACK;
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
