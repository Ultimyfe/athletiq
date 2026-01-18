"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl, getAuthHeaders } from "../../lib/api";

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

type DiagnoseResult = {
  meta?: { measured_at?: string | null } | null;
  user?: {
    name?: string | null;
    display_name?: string | null;
    sex?: "male" | "female" | string | null;
    age?: number | null;
    age_months?: number | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    school_name?: string | null;
    patient_id?: number | null;
    clinic_id?: number | null;
  } | null;
  summary?: any | null;
  abilities?: Array<any> | null;
  tests?: Array<any> | null;
  sports_top6?: Array<any> | null;
  trainings_focus?: Array<any> | null;
  guardian_message?: string | null;
  month_goal?: string | null;
};

function formatSex(sex?: string | null) {
  if (sex === "male") return "男子";
  if (sex === "female") return "女子";
  return "";
}

function _fmt1(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return v.toFixed(1);
}

function _fmtValue(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (Number.isInteger(n)) return n.toFixed(0);
  return n.toFixed(1);
}

export default function ResultClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // クエリ取得
  const back = sp.get("back"); // "records" が来る想定
  const patientId = sp.get("patient_id");
  const clinicId = sp.get("clinic_id");

  const backToRecordsUrl =
    patientId && clinicId
      ? `/patients/records?patient_id=${encodeURIComponent(patientId)}&clinic_id=${encodeURIComponent(clinicId)}`
      : "/patients";

  const [data, setData] = useState<DiagnoseResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // Try to load from sessionStorage first; if missing, fallback to API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) sessionStorage に保存された診断結果があれば使う
        const raw = typeof window !== "undefined" ? sessionStorage.getItem("diagnose_result") : null;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setData(parsed as DiagnoseResult);
            setLoading(false);
            return;
          } catch (e) {
            console.warn("diagnose_result parse failed, will fallback to API", e);
            // fallthrough to API fetch
          }
        }

        // 2) sessionStorage なければ patient_id クエリから API に問い合わせる
        if (!patientId) {
          // 直接訪問で ID が無ければ受検者一覧へ
          router.push("/patients");
          return;
        }

        // prepare API base and headers
        let base: string;
        try {
          base = getApiBaseUrl();
        } catch (e: any) {
          console.error("API base not configured", e);
          setErr("サーバの設定が見つかりません");
          setLoading(false);
          return;
        }

        const headers = getAuthHeaders();
        if (!headers.Authorization) {
          // ログインが必要
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        // 2a) まず /records?patient_id=... に問い合わせ（最新の record を取る）
        try {
          const r = await fetch(`${base}/records?patient_id=${encodeURIComponent(patientId)}`, {
            headers,
            cache: "no-store",
          });

          if (r.ok) {
            const j = await r.json().catch(() => null);
            // j が { items: [...] } の場合などを想定してパース
            let candidate: any = null;
            if (!j) {
              candidate = null;
            } else if (Array.isArray(j)) {
              candidate = j[0] ?? null;
            } else if (Array.isArray(j.items) && j.items.length) {
              candidate = j.items[0];
            } else if (j.result) {
              candidate = j.result;
            } else {
              // If the records endpoint returned a single record object
              candidate = j;
            }

            if (candidate) {
              // candidate にそのまま診断結果の形が入っているか確認して setData
              setData(candidate as DiagnoseResult);
              // also cache to sessionStorage so subsequent navigations work
              try {
                sessionStorage.setItem("diagnose_result", JSON.stringify(candidate));
              } catch {}
              setLoading(false);
              return;
            }
          } else {
            console.warn("/records returned", r.status);
          }
        } catch (e) {
          console.warn("/records fetch failed", e);
        }

        // 2b) もし上がダメなら /patients/<id> で患者情報だけでも取得して表示する（軽い代替）
        try {
          const rp = await fetch(`${base}/patients/${encodeURIComponent(patientId)}`, {
            headers,
            cache: "no-store",
          });
          if (rp.ok) {
            const pj = await rp.json().catch(() => null);
            if (pj) {
              // Minimal shape to render basic header
              const minimal: DiagnoseResult = {
                user: {
                  name: pj.last_name && pj.first_name ? `${pj.last_name} ${pj.first_name}` : pj.last_name ?? pj.first_name ?? "受検者",
                  display_name: pj.last_name && pj.first_name ? `${pj.last_name} ${pj.first_name}` : pj.last_name ?? pj.first_name ?? "受検者",
                  sex: pj.sex ?? null,
                  patient_id: pj.id ?? null,
                  clinic_id: pj.clinic_id ?? null,
                },
                summary: {},
              };
              setData(minimal);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("/patients fetch failed", e);
        }

        // 何も取れなければ受検者一覧へ戻す
        router.push("/patients");
      } catch (e: any) {
        console.error("ResultClient fallback failed", e);
        setErr(String(e?.message ?? e));
        setLoading(false);
      }
    })();
  // intentionally run on mount and when patientId changes
  }, [patientId, router]);

  const measuredAt = useMemo(() => data?.meta?.measured_at ?? "", [data]);
  const displayName =
    data?.user?.display_name ??
    data?.user?.name ??
    "受検者";
  const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;
  const age = data?.user?.age ?? data?.summary?.age ?? null;
  const ageMonths = data?.user?.age_months ?? data?.summary?.age_months ?? null;
  const height = data?.user?.height_cm ?? null;
  const weight = data?.user?.weight_kg ?? null;
  const cls = data?.summary?.class ?? null;
  const abilities = Array.isArray(data?.abilities) ? data!.abilities! : [];
  const tests = Array.isArray(data?.tests) ? data!.tests! : [];
  const sportsTop6 = Array.isArray(data?.sports_top6) ? data!.sports_top6! : [];
  const trainings = Array.isArray(data?.trainings_focus) ? data!.trainings_focus! : [];
  const guardianMsg = (data?.guardian_message ?? "") as string;
  const monthGoal = (data?.month_goal ?? "") as string;

  const rightTopLine = useMemo(() => {
    const parts: string[] = [];
    if (age != null) {
      const m =
        Number.isFinite(Number(ageMonths)) && ageMonths != null
          ? Math.max(0, Number(ageMonths) - Number(age) * 12)
          : null;
      parts.push(`年齢：${age}歳${m != null ? `${m}ヶ月` : ""}`);
    }
    if (sex) parts.push(`性別：${formatSex(sex)}`);
    if (height != null) parts.push(`身長 ${_fmtValue(height)}cm`);
    if (weight != null) parts.push(`体重 ${_fmtValue(weight)}kg`);
    return parts.filter(Boolean).join(" / ");
  }, [age, ageMonths, sex, height, weight]);

  if (loading) {
    return <div className="p-6">読み込み中…</div>;
  }

  if (err) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            エラー: {err}
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
          <div className="flex items-center gap-2">
            <button className="rounded-full px-3 py-2 text-sm hover:bg-white/10" onClick={() => router.push("/patients")}>
              ← 受検者一覧へ
            </button>
            {back === "records" ? (
              <button className="rounded-full px-3 py-2 text-sm hover:bg-white/10" onClick={() => router.push(backToRecordsUrl)}>
                ← 記録一覧へ
              </button>
            ) : null}
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white/90" onClick={() => window.print()}>
            🖨️ PDF出力
          </button>
        </div>

        {/* レポートヘッダー */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-xl font-bold text-[#173b7a]">運動能力診断レポート</h1>
          </div>

          <section className="px-8 py-6">
            <div className="rounded-xl border border-slate-200 bg-[#f2f7ff] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-600">受検者</div>
                  <div className="mt-1 text-2xl font-bold text-[#173b7a]">{displayName}</div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  {rightTopLine ? <div>{rightTopLine}</div> : null}
                </div>
              </div>
            </div>
          </section>

          {/* 省略: 残りは既存 UI と同じなので必要に応じてここに追加 */}
        </div>
      </div>
    </main>
  );
}