"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RecordItem = {
  id: number;
  measured_at: string;
  summary?: {
    motor_age?: { value?: number | null } | null;
    type?: { label?: string | null; key?: string | null } | null;
    class?: { label?: string | null; key?: string | null } | null;
  } | null;
};

type RecordsListResponse = {
  items: RecordItem[];
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(s?: string) {
  if (!s) return "";
  return String(s).slice(0, 10);
}

export default function RecordsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const patientId = sp.get("patient_id");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RecordItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!patientId) {
      router.push("/patients");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

        const res = await fetch(`${base}/records?patient_id=${encodeURIComponent(patientId)}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("access_token");
            router.push("/login");
            return;
          }
          throw new Error(`records api error: ${res.status} ${text}`);
        }

        const json = (await res.json()) as Partial<RecordsListResponse>;
        setItems(Array.isArray(json?.items) ? (json!.items as RecordItem[]) : []);
      } catch (e: any) {
        setItems([]);
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router]);

  const title = "記録一覧";

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/patients")}
          >
            ← 受検者一覧へ
          </button>

          <button
            className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            onClick={() => {
              /* 必要なら他の処理 */
            }}
          >
            {title}
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{err}</div>
        ) : null}

        <div className="rounded-2xl bg-white/10 px-6 py-5 text-white/90">
          {loading ? (
            <div>読み込み中…</div>
          ) : items.length === 0 ? (
            <div>記録が見つかりません</div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="rounded-md bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>{fmtDate(it.measured_at)}</div>
                    <div className="text-sm text-white/70">{it.summary?.type?.label ?? ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}