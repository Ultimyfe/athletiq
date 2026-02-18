"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  access_token: string;
  token_type?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ access_token があるならログイン済み扱い
    const token = localStorage.getItem("access_token");
    if (token) router.replace("/patients");
  }, [router]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL が未設定です（web/.env.local を確認してください）");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        setError("メールかパスワードが違います");
        return;
      }

      const data = (await res.json()) as LoginResponse;

      if (!data?.access_token) {
        setError("ログイン応答に access_token がありません（APIの返却形式を確認してください）");
        return;
      }

      // ✅ token を保存（唯一の認証情報）
      localStorage.setItem("access_token", String(data.access_token));

      // ✅ 表示用の clinic 情報を /clinics/me から取得（改竄防止・APIと整合）
      try {
        const meRes = await fetch(`${API_BASE}/clinics/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.access_token}`,
          },
          cache: "no-store",
        });

        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.id != null) localStorage.setItem("clinic_id", String(me.id)); // 表示用（任意）
          if (me?.clinic_name != null) localStorage.setItem("clinic_name", String(me.clinic_name)); // 表示用
        } else {
          // ここが失敗しても token があるので patients へは行ける
          localStorage.removeItem("clinic_id");
          localStorage.removeItem("clinic_name");
        }
      } catch {
        // ignore
      }

      router.replace("/patients");
    } catch (e: any) {
      setError(String(e?.message ?? "ログインに失敗しました"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <h1 className="text-2xl font-extrabold">治療院ログイン</h1>
          <p className="mt-1 text-sm text-white/70">Athletiq Clinic Console</p>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <section className="border-b px-8 py-6">
            <h2 className="text-lg font-extrabold text-[#173b7a]">アカウント情報</h2>
            <p className="mt-1 text-sm text-slate-500">メールアドレスとパスワードを入力してください</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-sm font-semibold text-slate-700">メールアドレス</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@seikotsu.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">パスワード</label>
                <input
                  type="password"
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-4 text-lg font-extrabold text-white shadow hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>

              <div className="mt-4 text-center text-xs text-slate-400">※ログイン後、受検者一覧へ移動します</div>

              <div className="pt-2 text-center text-xs text-slate-500">
                アカウントをお持ちでない方は{" "}
                <button
                  type="button"
                  className="font-bold text-[#2a61c9] hover:underline"
                  onClick={() => router.push("/signup")}
                >
                  サインアップ
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}