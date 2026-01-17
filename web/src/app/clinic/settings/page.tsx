// web/src/app/clinic/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClinicMe = {
  id: number;
  clinic_name: string;
  postal_code: string;
  address: string;
  owner_name: string;
  email: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const API_BASE_FALLBACK = "http://127.0.0.1:8000";

export default function ClinicSettingsPage() {
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_FALLBACK;

  const clinicId = useMemo(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("clinic_id") : null;
    return v ? Number(v) : null;
  }, []);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // 基本情報
  const [me, setMe] = useState<ClinicMe | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // パスワード
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  useEffect(() => {
    // 未ログインなら /login
    if (!clinicId) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);

        const res = await fetch(`${base}/clinics/me?clinic_id=${encodeURIComponent(String(clinicId))}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `failed to load: ${res.status}`);
        }

        const json = (await res.json()) as ClinicMe;
        setMe(json);
      } catch (e: any) {
        setMe(null);
        setLoadErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [base, clinicId, router]);

  const logout = () => {
    localStorage.removeItem("clinic_id");
    localStorage.removeItem("clinic_name");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    router.replace("/login");
  };

  const saveProfile = async () => {
    if (!clinicId || !me) return;

    setSaveMsg(null);
    setSaveErr(null);

    // 最低限の入力チェック
    if (!me.clinic_name?.trim()) return setSaveErr("院名を入力してください");
    if (!me.email?.trim()) return setSaveErr("メールアドレスを入力してください");

    try {
      setSaving(true);

      const res = await fetch(`${base}/clinics/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          clinic_id: clinicId,
          clinic_name: me.clinic_name,
          postal_code: me.postal_code,
          address: me.address,
          owner_name: me.owner_name,
          email: me.email,
        }),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = text || `update failed: ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j?.detail) msg = String(j.detail);
        } catch {}
        throw new Error(msg);
      }

      // clinic_name は他画面でも使うので更新
      try {
        const j = JSON.parse(text);
        if (j?.clinic_name) localStorage.setItem("clinic_name", String(j.clinic_name));
      } catch {}

      setSaveMsg("更新しました");
    } catch (e: any) {
      setSaveErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!clinicId) return;

    setPwMsg(null);
    setPwErr(null);

    if (!currentPw.trim()) return setPwErr("現在のパスワードを入力してください");
    if (!newPw.trim()) return setPwErr("新しいパスワードを入力してください");
    if (newPw !== newPw2) return setPwErr("新しいパスワード（確認）が一致しません");

    try {
      setPwSaving(true);

      const res = await fetch(`${base}/clinics/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          clinic_id: clinicId,
          current_password: currentPw,
          new_password: newPw,
        }),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = text || `password update failed: ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j?.detail) msg = String(j.detail);
        } catch {}
        throw new Error(msg);
      }

      setPwMsg("パスワードを更新しました");
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    } catch (e: any) {
      setPwErr(String(e?.message ?? e));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* 上部ナビ（既存トーン踏襲） */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button className="rounded-full px-3 py-2 text-sm hover:bg-white/10" onClick={() => router.push("/patients")}>
            ← Top
          </button>

          <div className="flex items-center gap-2">
            <button className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={() => router.push("/clinic/settings")}>
              設定
            </button>
            <button className="rounded-full px-3 py-2 text-sm hover:bg-white/10" onClick={logout}>
              ログアウト
            </button>
          </div>
        </div>

        {/* 本体カード */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-xl font-bold text-[#173b7a]">治療院設定</h1>
            <div className="mt-1 text-xs text-slate-500">アカウント・院情報の編集</div>
          </div>

          <div className="px-8 py-6">
            {loading ? (
              <div className="text-sm text-slate-600">読み込み中…</div>
            ) : loadErr ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="text-sm font-bold text-amber-900">読み込みに失敗しました</div>
                <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80">{loadErr}</div>
              </div>
            ) : !me ? null : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 左：院情報 */}
                <section className="rounded-2xl border border-slate-200">
                  <div className="border-b px-6 py-5">
                    <h2 className="text-lg font-extrabold text-[#173b7a]">院の基本情報</h2>
                    <p className="mt-1 text-sm text-slate-500">院名・住所・責任者・メールアドレス</p>

                    {saveErr && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {saveErr}
                      </div>
                    )}
                    {saveMsg && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        {saveMsg}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-6 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">院名</label>
                      <input
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={me.clinic_name ?? ""}
                        onChange={(e) => setMe({ ...me, clinic_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">郵便番号</label>
                        <input
                          className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                          value={me.postal_code ?? ""}
                          onChange={(e) => setMe({ ...me, postal_code: e.target.value })}
                          placeholder="1234567"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">責任者氏名</label>
                        <input
                          className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                          value={me.owner_name ?? ""}
                          onChange={(e) => setMe({ ...me, owner_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">住所</label>
                      <input
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={me.address ?? ""}
                        onChange={(e) => setMe({ ...me, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">メールアドレス</label>
                      <input
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={me.email ?? ""}
                        onChange={(e) => setMe({ ...me, email: e.target.value })}
                        autoComplete="email"
                      />
                    </div>

                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className={cn(
                        "w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-3 text-sm font-extrabold text-white shadow hover:opacity-90",
                        saving && "opacity-60"
                      )}
                    >
                      {saving ? "更新中..." : "更新する"}
                    </button>

                    <div className="text-center text-xs text-slate-400">
                      ※院情報は患者一覧などに反映されます
                    </div>
                  </div>
                </section>

                {/* 右：パスワード */}
                <section className="rounded-2xl border border-slate-200">
                  <div className="border-b px-6 py-5">
                    <h2 className="text-lg font-extrabold text-[#173b7a]">パスワード変更</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      00000000 など弱いパスワードを使っている場合は、こちらで変更してください
                    </p>

                    {pwErr && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {pwErr}
                      </div>
                    )}
                    {pwMsg && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        {pwMsg}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-6 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">現在のパスワード</label>
                      <input
                        type="password"
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">新しいパスワード</label>
                      <input
                        type="password"
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        autoComplete="new-password"
                        placeholder="8文字以上（00000000等は不可）"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">新しいパスワード（確認）</label>
                      <input
                        type="password"
                        className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                        value={newPw2}
                        onChange={(e) => setNewPw2(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    <button
                      onClick={savePassword}
                      disabled={pwSaving}
                      className={cn(
                        "w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-3 text-sm font-extrabold text-white shadow hover:opacity-90",
                        pwSaving && "opacity-60"
                      )}
                    >
                      {pwSaving ? "更新中..." : "パスワードを更新する"}
                    </button>

                    <div className="text-center text-xs text-slate-400">
                      ※更新後は次回ログインから新しいパスワードになります
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="border-t px-8 py-6 text-xs text-slate-500">
            API: {base}
          </div>
        </div>
      </div>
    </main>
  );
}