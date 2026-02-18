"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
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
  user?: {
    name?: string | null;
    display_name?: string | null;
    age?: number | null;
    birthdate?: string | null;
    sex?: string | null;
  };
};

function fmtDate(s: string) {
  return s.slice(5, 10); // MM-DD 形式
}

function fmtDateFull(s: string) {
  try {
    const d = new Date(s);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}/${m}/${day}`;
  } catch {
    return s;
  }
}

function fmtDateJapanese(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}年${m}月${day}日`;
  } catch {
    return s;
  }
}

function formatSex(sex?: string | null) {
  if (sex === "male") return "男子";
  if (sex === "female") return "女子";
  return "";
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
              user: detail.result?.user || {},
            };
          })
        );

        // 古い順にソート
        const sorted = details.filter(Boolean).reverse() as RecordSummary[];

        // ✅ 同日に複数回測定した場合、最新のみを抽出
        const uniqueByDate = sorted.reduce((acc: RecordSummary[], record) => {
          const date = record.measured_at.slice(0, 10); // YYYY-MM-DD
          const existingIndex = acc.findIndex((r) => r.measured_at.slice(0, 10) === date);
          
          if (existingIndex === -1) {
            // 同じ日付がまだない場合は追加
            acc.push(record);
          } else {
            // 同じ日付がある場合、IDが大きい方（最新）を採用
            if (record.id > acc[existingIndex].id) {
              acc[existingIndex] = record;
            }
          }
          
          return acc;
        }, []);

        setRecords(uniqueByDate);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router, apiBase]);

  // 受検者情報（最新のレコードから取得）
  const userInfo = useMemo(() => {
    if (records.length === 0) return null;
    const latestRecord = records[records.length - 1]; // 最新
    return latestRecord.user || null;
  }, [records]);

  const displayName = useMemo(() => {
    return userInfo?.display_name || userInfo?.name || "受検者";
  }, [userInfo]);

  const birthdate = useMemo(() => {
    return userInfo?.birthdate || null;
  }, [userInfo]);

  const age = useMemo(() => {
    return userInfo?.age ?? null;
  }, [userInfo]);

  const sex = useMemo(() => {
    return userInfo?.sex || "";
  }, [userInfo]);

  // グラフ1: 運動器年齢の推移
  const motorAgeData = useMemo(() => {
    return records
      .filter((r) => r.summary?.motor_age?.value != null)
      .map((r) => ({
        date: fmtDate(r.measured_at),
        fullDate: fmtDateFull(r.measured_at),
        age: r.summary.motor_age!.value,
      }));
  }, [records]);

  // グラフ2: 6能力値の推移（折れ線6本）
  const abilitiesChartData = useMemo(() => {
    if (records.length === 0) return [];

    const abilityKeys = ["strength", "power", "speed", "agility", "throw", "repeat"];

    return records.map((r) => {
      const dataPoint: any = {
        date: fmtDate(r.measured_at),
        fullDate: fmtDateFull(r.measured_at),
      };

      abilityKeys.forEach((key) => {
        const ability = r.abilities?.find((a) => a.key === key);
        if (ability) {
          dataPoint[key] = ability.t;
        }
      });

      return dataPoint;
    });
  }, [records]);

  // グラフ3: 個別測定項目の推移（全7項目）
  const testsChartData = useMemo(() => {
    if (records.length === 0) return {};

    const testKeys = [
      "grip",
      "standing_jump",
      "dash_15m_sec",
      "continuous_standing_jump",
      "squat_30s",
      "side_step",
      "ball_throw",
    ];

    const result: Record<string, any[]> = {};

    testKeys.forEach((key) => {
      result[key] = records
        .map((r) => {
          const test = r.tests?.find((t) => t.key === key);
          return test
            ? {
                date: fmtDate(r.measured_at),
                fullDate: fmtDateFull(r.measured_at),
                value: test.value,
                label: test.label,
                unit: test.unit,
              }
            : null;
        })
        .filter(Boolean);
    });

    return result;
  }, [records]);

  const abilityLabels: Record<string, string> = {
    strength: "筋力",
    power: "瞬発力",
    speed: "スピード",
    agility: "敏捷性",
    throw: "投力",
    repeat: "反復パワー",
  };

  const abilityColors: Record<string, string> = {
    strength: "#ef4444",
    power: "#f59e0b",
    speed: "#10b981",
    agility: "#3b82f6",
    throw: "#8b5cf6",
    repeat: "#ec4899",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push(`/patients/records?patient_id=${patientId}`)}
          >
            ← 記録一覧へ
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white/90"
            onClick={() => window.print()}
          >
            🖨️ PDF出力
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* ヘッダー */}
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#173b7a]">測定データサマリ</h1>
                <div className="mt-1 text-xs text-slate-500">Athletic Performance Summary</div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center rounded-md bg-[#2a61c9] px-3 py-1 text-xs font-bold text-white">
                  推移グラフ
                </div>
              </div>
            </div>
          </div>

          {/* 受検者情報カード */}
          {userInfo && (
            <section className="px-8 py-6 border-b bg-slate-50">
              <div className="rounded-xl border border-slate-200 bg-[#f2f7ff] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-600">受検者</div>
                    <div className="mt-1 text-2xl font-bold text-[#173b7a]">{displayName}</div>
                  </div>

                  <div className="text-right text-xs text-slate-600 space-y-1">
                    {birthdate && (
                      <div>
                        <span className="font-semibold">誕生日：</span>
                        {fmtDateJapanese(birthdate)}
                      </div>
                    )}
                    {age != null && (
                      <div>
                        <span className="font-semibold">年齢：</span>
                        {age}歳
                      </div>
                    )}
                    {sex && (
                      <div>
                        <span className="font-semibold">性別：</span>
                        {formatSex(sex)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

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
                        <YAxis domain={[0, 15]} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
                                  <p className="text-xs text-slate-600">{payload[0].payload.fullDate}</p>
                                  <p className="text-sm font-bold text-slate-900">
                                    {payload[0].value}歳
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="age"
                          stroke="#173b7a"
                          strokeWidth={2}
                          name="運動器年齢"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* グラフ2: 6能力値の推移（折れ線6本） */}
                {abilitiesChartData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">6能力値の推移（偏差値）</h2>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={abilitiesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 80]} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
                                  <p className="text-xs text-slate-600 mb-1">{payload[0].payload.fullDate}</p>
                                  {payload.map((entry: any) => (
                                    <p key={entry.dataKey} className="text-xs font-semibold" style={{ color: entry.color }}>
                                      {abilityLabels[entry.dataKey]}: {entry.value?.toFixed(1)}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        {Object.keys(abilityLabels).map((key) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={abilityColors[key]}
                            strokeWidth={2}
                            name={abilityLabels[key]}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* グラフ3: 個別測定項目の推移（全7項目） */}
                {Object.entries(testsChartData).map(([key, data]) => {
                  if (!data || data.length === 0) return null;
                  const label = data[0]?.label || key;
                  const unit = data[0]?.unit || "";

                  return (
                    <div key={key} className="bg-slate-50 rounded-xl p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4">
                        {label}の推移 {unit && `(${unit})`}
                      </h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
                                    <p className="text-xs text-slate-600">{payload[0].payload.fullDate}</p>
                                    <p className="text-sm font-bold text-slate-900">
                                      {payload[0].value} {unit}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            name={`${label} (${unit})`}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* フッター */}
          <div className="border-t px-8 py-6 text-xs text-slate-500">
            ※ 本レポートは測定値に基づく推移データです。継続的な測定で成長を確認しましょう。
          </div>
        </div>
      </div>
    </main>
  );
}