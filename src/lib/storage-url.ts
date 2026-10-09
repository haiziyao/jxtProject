export function storageBaseUrl() {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  return `${protocol}://${process.env.MINIO_ENDPOINT || "127.0.0.1"}:${process.env.MINIO_PORT || "9000"}/${process.env.MINIO_BUCKET || "jxt"}/`;
}

export function objectNameFromStorageUrl(fileUrl: string, baseUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const base = new URL(baseUrl);
    if (url.origin !== base.origin || url.username || url.password || !url.pathname.startsWith(base.pathname)) return "";
    const objectName = decodeURIComponent(url.pathname.slice(base.pathname.length));
    return objectName && !objectName.split("/").some(part => part === "." || part === "..") && !/[\u0000-\u001f]/.test(objectName) ? objectName : "";
  } catch { return ""; }
}

export function inlineImageUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/api/files/proxy?")) return url;
  return objectNameFromStorageUrl(url, baseUrl) ? `/api/files/proxy?url=${encodeURIComponent(url)}` : url;
}
