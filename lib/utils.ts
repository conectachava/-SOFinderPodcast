import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const headers = new Headers(init?.headers || {});
    if (!headers.has("x-aistudio-client")) {
      headers.set("x-aistudio-client", "sourcefinder-app");
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers,
    };

    const res = await fetch(input, modifiedInit);
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    let data: any = null;
    if (text && (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("["))) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn("[safeFetchJson] Failed to parse JSON text:", text.slice(0, 150));
      }
    }

    if (!res.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        (text.startsWith("<") ? `Error del servidor (${res.status})` : text) ||
        `Error (${res.status})`;
      return { ok: false, status: res.status, error: errorMessage, data };
    }

    if (!data && text) {
      return { ok: true, status: res.status, data: text as any };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("abort")) {
      return { ok: false, status: 0, error: "Operación cancelada" };
    }
    return { ok: false, status: 0, error: err?.message || "Error de red" };
  }
}
