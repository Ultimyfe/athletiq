"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type RecordSummary = {
  id: number;
  measured_at: string;
  summary: {
    motor_age?: { value?: number | null } | null;
    type?: { label?: string | null } | null;
    class?: { label?: string | null } | null;
  };
  abilities?: Array<{
    key: string;
    label: string;
    t: number;
    decile: number;
  }>;
  tests?: Array<{
    key: string;
    label: string;
    value: number;
    unit: string;
    t: number;
  }>;
};

function fmtDate(s: string) {
  return s.slice(0, 10);
}

export default function SummaryClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const patientId = sp.get("patient_id");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordSummary[]>([]);

  const apiBase = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
    return base.replace(/\/+$/, "");
  }, []);

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

        // 測定履歴を取得
        const res = await fetch(`${apiBase}/records?patient_id=${encodeURIComponent(patientId)}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`records api error: ${res.status}`);

        const json = await res.json();
        const items = json.items || [];

        // 各レコードの詳細を取得
        const details = await Promise.all(
          items.map(async (item: any) => {
            const detailRes = await fetch(
              `${apiBase}/records/${item.id}?patient_id=${encodeURIComponent(patientId)}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              }
            );
            if (!detailRes.ok) return null;
            const detail = await detailRes.json();
            return {
              id: item.id,
              measured_at: item.measured_at,
              summary: item.summary,
              abilities: detail.result?.abilities || [],
              tests: detail.result?.tests || [],
            };
          })
        );

        setRecords(details.filter(Boolean) as RecordSummary[]);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router, apiBase]);

  // グラフ1: 運動器年齢の推移
  const motorAgeData = useMemo(() => {
    return records
      .filter((r) => r.summary?.motor_age?.value != null)
      .map((r) => ({
        date: fmtDate(r.measured_at),
        age: r.summary.motor_age!.value,
      }))
      .reverse();
  }, [records]);

  // グラフ2: 6能力値の推移（最新のみ）
  const abilitiesData = useMemo(() => {
    if (records.length === 0) return [];
    const latest = records[0];
    return (latest.abilities || []).map((a) => ({
      name: a.label,
      value: a.t,
    }));
  }, [records]);

  // グラフ3: 個別測定項目の推移（握力のみ例示）
  const gripData = useMemo(() => {
    return records
      .map((r) => {
        const grip = r.tests?.find((t) => t.key === "grip");
        return grip
          ? {
              date: fmtDate(r.measured_at),
              value: grip.value,
            }
          : null;
      })
      .filter(Boolean)
      .reverse();
  }, [records]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push(`/patients/records?patient_id=${patientId}`)}
          >
            ← 記録一覧へ
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-2xl font-bold text-[#173b7a]">測定データサマリ</h1>
            <div className="mt-1 text-sm text-slate-500">patient_id: {patientId}</div>
          </div>

          <div className="px-8 py-6 space-y-8">
            {loading ? (
              <div className="text-center py-10 text-slate-600">読み込み中...</div>
            ) : err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                {err}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-slate-600">測定データがありません</div>
            ) : (
              <>
                {/* グラフ1: 運動器年齢の推移 */}
                {motorAgeData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">運動器年齢の推移</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={motorAgeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="age" stroke="#173b7a" strokeWidth={2} name="運動器年齢" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* グラフ2: 6能力値（最新） */}
                {abilitiesData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">6能力値（最新測定）</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={abilitiesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 80]} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2a61c9" name="T得点" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* グラフ3: 個別測定項目（握力） */}
                {gripData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">握力の推移</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={gripData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="握力 (kg)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}