export async function readObject(request: { json(): Promise<unknown> }): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown> : null;
  } catch { return null; }
}

// MySQL TEXT is limited by encoded bytes, including multibyte Chinese text.
export function fitsText(value: string) { return new TextEncoder().encode(value).length <= 65535; }
