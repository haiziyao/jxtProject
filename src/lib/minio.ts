import * as Minio from "minio";
import { objectNameFromStorageUrl, storageBaseUrl } from "@/lib/storage-url";

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
  return storageBaseUrl() + objectName.split("/").map(encodeURIComponent).join("/");
}

export function getObjectNameFromUrl(fileUrl: string) {
  return objectNameFromStorageUrl(fileUrl, storageBaseUrl());
}
