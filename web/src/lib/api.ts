// web/src/lib/api.ts
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です (.env.local を確認)");
  }
  return base.replace(/\/+$/, "");
}

/**
 * ブラウザ実行時に Authorization を含むヘッダを返す
 * - サーバサイド実行時は Content-Type のみ返す
 * - トークンがない場合は Authorization を含めない（呼び出し元でログイン遷移）
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Authorization が必須な場合に使用するユーティリティ。
 * トークンが無ければ例外を投げる（呼び出し元でログイン処理へ誘導してください）。
 */
export function requireAuthHeaders(): Record<string, string> {
  const h = getAuthHeaders();
  if (!h.Authorization) {
    throw new Error("not-logged-in");
  }
  return h;
}