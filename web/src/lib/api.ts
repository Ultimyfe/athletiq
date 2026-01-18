// 共通 API ヘルパ
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set (.env.local)");
  }
  return base.replace(/\/+$/, "");
}

/**
 * ブラウザ実行時に Authorization を含むヘッダを返します。
 * - サーバーサイド実行時（SSR等）は Content-Type のみ返します。
 * - トークンがない場合は Authorization を含めないので、呼び出し元でログイン遷移などを行ってください。
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
 * Authorization ヘッダが必須な呼び出しで使うユーティリティ。
 * トークンが無ければ例外を投げる（呼び出し元でログイン遷移を行う想定）。
 */
export function requireAuthHeaders(): Record<string, string> {
  const h = getAuthHeaders();
  if (!h.Authorization) {
    throw new Error("not-logged-in");
  }
  return h;
}