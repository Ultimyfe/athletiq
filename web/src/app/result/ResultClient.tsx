"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  summary?: {
    age?: number | null;
    age_months?: number | null;
    sex?: "male" | "female" | string | null;
    motor_age?: { value?: number | null; label?: string | null; message?: string | null } | null;
    type?: {
      key?: string | null;
      label?: string | null;
      desc?: string | null;
      title?: string | null;
      description?: string | null;
    } | null;
    class?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null;
  } | null;

  // ★ APIが返している形（root直下）
  abilities?: Array<{
    key: string;
    label?: string | null;
    t?: number | null;
    decile?: number | null;
    bar_pct?: number | null; // 0-100
  }> | null;

  tests?: Array<{
    key: string;
    label?: string | null;
    unit?: string | null;
    value?: number | string | null;
    t?: number | null;
    decile?: number | null;
    bar_pct?: number | null; // 0-100
    rank_label?: string | null; // 強み/平均付近/伸びしろ
  }> | null;

  sports_top6?: Array<{
    sport: string;
    emoji?: string | null;
    score?: number | null;
    reason?: string | null;
  }> | null;

  trainings_focus?: Array<{
    id?: number | null;
    title: string;
    ability_key?: string | null;
    ability_label?: string | null;
    desc?: string | null;
    frequency?: string | null;
  }> | null;

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

function classBadge(
  cls?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null
) {
  const key = cls?.key ?? "";
  const label = cls?.label ?? "";
  if (!label) return null;

  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset";

  if (key === "expert") {
    return (
      <span className={cn(base, "bg-emerald-50 text-emerald-700 ring-emerald-200")}>
        🏅 {label}
      </span>
    );
  }
  if (key === "standard") {
    return (
      <span className={cn(base, "bg-blue-50 text-blue-700 ring-blue-200")}>
        ✅ {label}
      </span>
    );
  }
  if (key === "beginner") {
    return (
      <span className={cn(base, "bg-amber-50 text-amber-700 ring-amber-200")}>
        🌱 {label}
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-slate-50 text-slate-700 ring-slate-200")}>
      {label}
    </span>
  );
}

function gradeToneFromPct(pct: number) {
  // pct: 0-100
  if (pct < 40) {
    return {
      barFrom: "from-amber-400",
      barTo: "to-orange-500",
      note: "伸びしろ",
    };
  }
  if (pct < 70) {
    return {
      barFrom: "from-sky-400",
      barTo: "to-indigo-500",
      note: "平均付近",
    };
  }
  return {
    barFrom: "from-emerald-400",
    barTo: "to-teal-500",
    note: "強み",
  };
}

// 必要な import は元の page.tsx からそのまま移植

export default function ResultClient() {
  const router = useRouter();
  const sp = useSearchParams(); // ★追加

  // ★クエリ取得
  const back = sp.get("back"); // "records" が来る想定
  const patientId = sp.get("patient_id");
  const clinicId = sp.get("clinic_id");

  // ★記録一覧へ戻るURL（クエリが欠けたら patients に逃がす）
  const backToRecordsUrl =
    patientId && clinicId
      ? `/patients/records?patient_id=${encodeURIComponent(patientId)}&clinic_id=${encodeURIComponent(clinicId)}`
      : "/patients";

  const [data, setData] = useState<DiagnoseResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("diagnose_result");
    if (!raw) {
      router.push("/patients");
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      router.push("/patients");
    }
  }, [router]);

  const measuredAt = useMemo(() => data?.meta?.measured_at ?? "", [data]);

  // ★ name 優先（APIは user.name を返している）
  const displayName =
    data?.user?.display_name ??
    data?.user?.name ??
    "受検者";

  const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;

  // 年齢は user にも summary にも来るので「ある方」を使う
  const age = data?.user?.age ?? data?.summary?.age ?? null;
  const ageMonths = data?.user?.age_months ?? data?.summary?.age_months ?? null;

  const height = data?.user?.height_cm ?? null;
  const weight = data?.user?.weight_kg ?? null;

  const cls = data?.summary?.class ?? null;

  // 運動器年齢
  const motorAgeY = data?.summary?.motor_age?.value ?? null;
  const motorMsg =
    (data?.summary?.motor_age?.message ??
      data?.summary?.motor_age?.label ??
      "") as string;

  // 運動タイプ（APIは label/desc で来ている）
  const typeTitle =
    data?.summary?.type?.label ??
    data?.summary?.type?.title ??
    "";
  const typeDesc =
    data?.summary?.type?.desc ??
    data?.summary?.type?.description ??
    "";

  // ★ root直下を参照
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

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
          {/* 左：戻るボタン群 */}
          <div className="flex items-center gap-2">
            {/* 受検者一覧へ戻る（常に出す） */}
            <button
              className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => router.push("/patients")}
            >
              ← 受検者一覧へ
            </button>
            {/* 記録一覧へ戻る（back=records のときだけ表示してもOK。常に出すなら条件外してOK） */}
            {back === "records" ? (
              <button
                className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => router.push(backToRecordsUrl)}
              >
                ← 記録一覧へ
              </button>
            ) : null}
          </div>

          {/* 右：印刷 */}
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white/90"
            onClick={() => window.print()}
          >
            🖨️ PDF出力
          </button>
        </div>

        {/* レポート本体 */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* ヘッダー */}
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[#173b7a]">運動能力診断レポート</h1>
                <div className="mt-1 text-xs text-slate-500">Athletic Performance Assessment Report</div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center rounded-md bg-[#2a61c9] px-3 py-1 text-xs font-bold text-white">
                  サマリー
                </div>
                {measuredAt ? <div className="mt-2 text-xs text-slate-600">測定日：{measuredAt}</div> : null}
              </div>
            </div>
          </div>

          {/* 受検者カード */}
          <section className="px-8 py-6">
            <div className="rounded-xl border border-slate-200 bg-[#f2f7ff] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-600">受検者</div>
                  <div className="mt-1 text-2xl font-bold text-[#173b7a]">{displayName}</div>
                </div>

                <div className="text-right text-xs text-slate-600">
                  {rightTopLine ? <div>{rightTopLine}</div> : null}
                  <div className="mt-2 flex justify-end gap-2">{classBadge(cls)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* 運動器年齢 / 運動タイプ */}
          <section className="px-8 pb-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 px-5 py-4">
                <div className="text-xs font-bold text-slate-500">運動器年齢</div>
                <div className="mt-1 text-3xl font-extrabold text-[#173b7a]">
                  {motorAgeY != null ? `${motorAgeY}歳` : ""}
                </div>
                {motorMsg ? <div className="mt-2 text-sm text-slate-700">{motorMsg}</div> : null}
              </div>

              <div className="rounded-xl border border-slate-200 px-5 py-4">
                <div className="text-xs font-bold text-slate-500">運動タイプ</div>
                {typeTitle ? <div className="mt-1 text-xl font-extrabold text-[#173b7a]">{typeTitle}</div> : null}
                {typeDesc ? <div className="mt-2 text-sm text-slate-700">{typeDesc}</div> : null}
              </div>
            </div>
          </section>

          {/* 適性スポーツ TOP6（★ここが今不足してた部分） */}
          <section className="px-8 py-6">
            <h2 className="text-lg font-extrabold text-[#173b7a]">適性スポーツ TOP6</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {sportsTop6.length ? (
                sportsTop6.map((s, idx) => (
                  <div key={`${s.sport}-${idx}`} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-extrabold text-slate-700">#{idx + 1}</div>
                        <div className="text-xl">{s.emoji ?? "🏅"}</div>
                        <div className="font-extrabold text-slate-900">{s.sport}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        {s.score != null ? `${_fmt1(s.score)}pt` : ""}
                      </div>
                    </div>
                    {s.reason ? <div className="mt-2 text-xs text-slate-600">{s.reason}</div> : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">スポーツ候補がありません。</div>
              )}
            </div>
          </section>

          {/* 重点トレーニング提案（★ここも今不足してた部分） */}
          <section className="px-8 py-6">
            <h2 className="text-lg font-extrabold text-[#173b7a]">重点トレーニング提案</h2>
            <div className="mt-3 space-y-3">
              {trainings.length ? (
                trainings.slice(0, 4).map((t, idx) => (
                  <div key={`${t.title}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
                    <div className="text-xs font-bold text-slate-500">
                      重点：{t.ability_label ?? ""} {t.frequency ? ` / ${t.frequency}` : ""}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-slate-900">{t.title}</div>
                    {t.desc ? <div className="mt-2 text-sm text-slate-700">{t.desc}</div> : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">トレーニング提案がありません。</div>
              )}
            </div>
          </section>

          {/* 6能力（APIは bar_pct を返しているので、それで確実にバーが動く） */}
          {abilities.length ? (
            <section className="px-8 pb-8">
              <h2 className="text-lg font-extrabold text-[#173b7a]">6能力スコア</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {abilities.map((a, idx) => {
                  const pct = Math.max(0, Math.min(100, Number(a.bar_pct ?? 0)));
                  const tone = gradeToneFromPct(pct);
                  return (
                    <div key={`${a.key}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">{a.label ?? a.key}</div>
                        <div className="text-xs text-slate-600">
                          T <span className="font-bold tabular-nums">{_fmt1(a.t)}</span>
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
                        <div
                          className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{tone.note}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* 測定結果（7種目）: bar_pct をそのまま表示するので “0%固定” にならない */}
          {tests.length ? (
            <section className="px-8 pb-10">
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">測定結果（7種目）</div>
                    <div className="text-xs text-slate-200">T=偏差値（50が平均）</div>
                  </div>
                </div>

                <div className="bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold text-slate-600">
                          <th className="px-5 py-3">測定項目</th>
                          <th className="px-5 py-3">記録</th>
                          <th className="px-5 py-3">偏差値T</th>
                          <th className="px-5 py-3">評価バー</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {tests.map((t, idx) => {
                          const pct = Math.max(0, Math.min(100, Number(t.bar_pct ?? 0)));
                          const tone = gradeToneFromPct(pct);
                          const unit = t.unit ? String(t.unit) : "";
                          return (
                            <tr key={`${t.key}-${idx}`} className="hover:bg-slate-50/60">
                              <td className="px-5 py-4">
                                <div className="font-semibold text-slate-900">{t.label ?? t.key}</div>
                                <div className="mt-1 text-xs text-slate-500">{t.key}</div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="font-semibold tabular-nums text-slate-900">
                                  {_fmtValue(t.value)}
                                  {unit ? <span className="ml-1 text-sm font-medium text-slate-600">{unit}</span> : null}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900">
                                  {_fmt1(t.t)}
                                </span>
                              </td>

                              <td className="px-5 py-4 w-[420px]">
                                <div className="flex items-center gap-3">
                                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                                    <div
                                      className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
                                    {pct}%
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                  {t.rank_label ?? tone.note}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                    ※ バーはAPIが返す <code>bar_pct</code>（0〜100）を表示しています
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 保護者向け / 1ヶ月目標（APIは guardian_message / month_goal） */}
          {(guardianMsg || monthGoal) ? (
            <section className="px-8 pb-10">
              {guardianMsg ? (
                <>
                  <h2 className="text-lg font-extrabold text-[#173b7a]">保護者向けコメント</h2>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800">
                    {guardianMsg}
                  </div>
                </>
              ) : null}

              {monthGoal ? (
                <>
                  <h2 className="mt-8 text-lg font-extrabold text-[#173b7a]">最初の1ヶ月の目標</h2>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800">
                    {monthGoal}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {/* フッター */}
          <div className="border-t px-8 py-6 text-xs text-slate-500">
            ※ 本レポートは入力された測定値に基づく推定結果です。ケガや痛みがある場合は無理をせず、専門家に相談してください。
          </div>
        </div>
      </div>
    </main>
  );
}