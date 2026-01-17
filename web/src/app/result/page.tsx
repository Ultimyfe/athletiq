// // web/src/app/result/page.tsx
// "use client";

// import { useEffect, useState } from "react";

// type AbilityKey = "strength" | "power" | "speed" | "agility" | "repeat" | "throw";

// function abilityLabel(key: AbilityKey) {
//   switch (key) {
//     case "strength":
//       return "筋力";
//     case "power":
//       return "瞬発力";
//     case "speed":
//       return "スピード";
//     case "agility":
//       return "敏捷性";
//     case "repeat":
//       return "反復パワー";
//     case "throw":
//       return "投力";
//   }
// }

// function sexJa(sex: any) {
//   if (sex === "male") return "男子";
//   if (sex === "female") return "女子";
//   return "";
// }

// function toNum(v: any): number | null {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// }

// function formatValue(v: any) {
//   const n = Number(v);
//   if (!Number.isFinite(n)) return "";
//   if (Number.isInteger(n)) return n.toFixed(0);
//   return n.toFixed(1);
// }

// function gradeTone(grade: number) {
//   if (grade <= 3) {
//     return {
//       badgeBg: "bg-amber-50",
//       badgeText: "text-amber-800",
//       badgeRing: "ring-amber-200",
//       barFrom: "from-amber-400",
//       barTo: "to-orange-500",
//       note: "伸びしろ",
//     };
//   }
//   if (grade <= 7) {
//     return {
//       badgeBg: "bg-sky-50",
//       badgeText: "text-sky-800",
//       badgeRing: "ring-sky-200",
//       barFrom: "from-sky-400",
//       barTo: "to-indigo-500",
//       note: "平均付近",
//     };
//   }
//   return {
//     badgeBg: "bg-emerald-50",
//     badgeText: "text-emerald-800",
//     badgeRing: "ring-emerald-200",
//     barFrom: "from-emerald-400",
//     barTo: "to-teal-500",
//     note: "強み",
//   };
// }

// function motorAgeNote(motorAge: number | null, actualAgeYears: number | null) {
//   // 値が無い時は無理に表示しない（＝「—」を出さない）
//   if (!motorAge || !Number.isFinite(motorAge) || !actualAgeYears) {
//     return "";
//   }

//   const diff = motorAge - actualAgeYears; // +なら良い想定
//   if (diff >= 2) {
//     return "同年代より高い水準です。得意な動きを活かして、色々なスポーツに挑戦してみましょう。";
//   }
//   if (diff >= 0) {
//     return "同年代と同程度〜やや高めです。得意を伸ばしつつ、苦手は週1〜2回の練習で底上げしましょう。";
//   }
//   if (diff <= -2) {
//     return "伸びしろが大きい状態です。まずはフォームと基本動作を整えて、週2回の短い練習から始めましょう。";
//   }
//   return "同年代より少し伸びしろがあります。苦手な能力を中心に、無理のない範囲で継続していきましょう。";
// }

// export default function ResultPage() {
//   const [data, setData] = useState<any>(null);

//   useEffect(() => {
//     const raw = sessionStorage.getItem("diagnose_result");
//     if (!raw) return;
//     try {
//       setData(JSON.parse(raw));
//     } catch {
//       setData(null);
//     }
//   }, []);

//   // data が null でも落ちないように、以降は全部 “安全アクセス” で組み立てる
//   const summary = data?.summary ?? {};
//   const meta = data?.meta ?? {};
//   const user = data?.user ?? {};

//   // 実年齢（年・月）
//   const ageYears = toNum(summary?.age);
//   const ageMonths = toNum(summary?.age_months);

//   let actualAgeLabel = "";
//   if (ageYears != null && ageMonths != null) {
//     const months = Math.max(0, ageMonths - ageYears * 12);
//     actualAgeLabel = `${ageYears}歳${months}ヶ月`;
//   } else if (ageYears != null) {
//     actualAgeLabel = `${ageYears}歳`;
//   }

//   const sexLabel = sexJa(user?.sex ?? summary?.sex);

//   // 身長体重（あれば）
//   const height = toNum(user?.height_cm ?? summary?.height_cm);
//   const weight = toNum(user?.weight_kg ?? summary?.weight_kg);

//   // 表示名
//   const displayName = user?.display_name ?? user?.name ?? "受検者";

//   // 運動器年齢
//   const motorAgeValue = toNum(summary?.motor_age?.value);
//   const motorAgeMessage = typeof summary?.motor_age?.message === "string" ? summary.motor_age.message : "";
//   const motorNote = motorAgeNote(motorAgeValue, ageYears);

//   // 運動タイプ（string / object両対応）
//   const typeObj = summary?.type;
//   const typeTitle =
//     typeof typeObj === "string"
//       ? typeObj
//       : (typeObj?.title ? String(typeObj.title) : (typeObj?.type ? String(typeObj.type) : ""));
//   const typeDesc =
//     typeof typeObj === "object" && typeObj?.description ? String(typeObj.description) : "";

//   // 配列（無くてもOK）
//   const abilities: any[] = Array.isArray(data?.abilities) ? data.abilities : [];
//   const tests: any[] = Array.isArray(data?.tests) ? data.tests : [];

//   // top/bottom（足りなければ空）
//   const abilitySortedHigh = [...abilities].sort((a, b) => (Number(b?.t ?? 0) - Number(a?.t ?? 0)));
//   const abilitySortedLow = [...abilities].sort((a, b) => (Number(a?.t ?? 0) - Number(b?.t ?? 0)));
//   const top2 = abilitySortedHigh.slice(0, 2);
//   const bottom2 = abilitySortedLow.slice(0, 2);

//   // “—”を出さないために、右上の2行は「あるものだけ」組み立てる
//   const rightTopLine = [actualAgeLabel, sexLabel].filter(Boolean).join("・");
//   const rightSecondLineParts: string[] = [];
//   if (height != null) rightSecondLineParts.push(`身長 ${formatValue(height)}cm`);
//   if (weight != null) rightSecondLineParts.push(`体重 ${formatValue(weight)}kg`);
//   const rightSecondLine = rightSecondLineParts.join(" ／ ");

//   const measuredAt = typeof meta?.measured_at === "string" ? meta.measured_at : "";

//   // data が無い時の表示（※ return はここでもOK。hooks呼び終わってるので）
//   if (!data) {
//     return (
//       <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
//         <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-10 text-center text-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           読み込み中...
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={() => (window.location.href = "/")}
//           >
//             ← トップに戻る
//           </button>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white/90"
//             onClick={() => window.print()}
//           >
//             🖨️ PDF出力
//           </button>
//         </div>

//         {/* レポート本体 */}
//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           {/* ヘッダー */}
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h1 className="text-xl font-bold text-[#173b7a]">運動能力診断レポート</h1>
//                 <div className="mt-1 text-xs text-slate-500">Athletic Performance Assessment Report</div>
//               </div>

//               <div className="text-right">
//                 <div className="inline-flex items-center rounded-md bg-[#2a61c9] px-3 py-1 text-xs font-bold text-white">
//                   サマリー
//                 </div>
//                 {measuredAt ? (
//                   <div className="mt-2 text-xs text-slate-600">測定日：{measuredAt}</div>
//                 ) : null}
//               </div>
//             </div>
//           </div>

//           {/* 受検者カード */}
//           <section className="px-8 py-6">
//             <div className="rounded-xl border border-slate-200 bg-[#f2f7ff] px-6 py-5">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <div className="text-xs text-slate-600">受検者</div>
//                   <div className="mt-1 text-2xl font-bold text-[#173b7a]">{displayName}</div>
//                 </div>

//                 <div className="text-right text-xs text-slate-600">
//                   {rightTopLine ? <div>{rightTopLine}</div> : null}
//                   {rightSecondLine ? <div>{rightSecondLine}</div> : null}
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* 運動器年齢（値がある時だけ出す：—排除） */}
//           {(motorAgeValue != null || motorAgeMessage || motorNote) ? (
//             <section className="px-8 pb-6">
//               <div className="rounded-xl border-2 border-[#d4a62a] bg-gradient-to-r from-[#fff6d6] to-[#fff0b6] px-6 py-5">
//                 <div className="flex items-center gap-5">
//                   {motorAgeValue != null ? (
//                     <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-b from-[#2b64cc] to-[#173b7a] text-white shadow">
//                       <div className="text-xs font-semibold">運動器年齢</div>
//                       <div className="mt-1 text-3xl font-extrabold tabular-nums">{motorAgeValue}</div>
//                       <div className="text-xs font-semibold">歳</div>
//                     </div>
//                   ) : null}

//                   <div className="text-sm text-slate-700">
//                     {motorAgeMessage ? <div>{motorAgeMessage}</div> : null}
//                     {motorNote ? (
//                       <div className="mt-2 text-base leading-relaxed text-slate-700">{motorNote}</div>
//                     ) : null}
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           {/* 運動タイプ（タイトルがある時だけ：—排除） */}
//           {typeTitle ? (
//             <section className="px-8 pb-6">
//               <div className="rounded-xl border-2 border-[#173b7a] bg-gradient-to-r from-[#e7f0ff] to-[#f4f8ff] px-6 py-6 text-center">
//                 <div className="text-xs font-semibold text-slate-500">運動タイプ診断結果</div>
//                 <div className="mt-2 text-2xl font-extrabold text-[#173b7a]">{typeTitle}</div>
//                 {typeDesc ? <div className="mt-2 text-sm text-slate-600">{typeDesc}</div> : null}
//               </div>
//             </section>
//           ) : null}

//           {/* 6能力（データがある時だけ） */}
//           {abilities.length ? (
//             <section className="px-8 pb-8">
//               <div className="flex items-end justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-extrabold text-[#173b7a]">6能力スコア</h2>
//                   <p className="mt-1 text-sm text-slate-600">
//                     強み（上位）と伸びしろ（下位）を把握して、トレーニング方針に活かします。
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
//                 <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm font-extrabold text-[#173b7a]">強み（上位2つ）</div>
//                   <div className="mt-4 space-y-3">
//                     {top2.map((a: any) => (
//                       <div key={a.key} className="rounded-lg border border-slate-200 px-4 py-3">
//                         <div className="flex items-center justify-between">
//                           <div className="font-bold text-slate-800">{abilityLabel(a.key as AbilityKey)}</div>
//                           <div className="text-xs text-slate-600">
//                             T <span className="font-bold tabular-nums">{Number(a.t ?? 0).toFixed(1)}</span> ／ 10段階{" "}
//                             <span className="font-bold tabular-nums">{Number(a.grade_10 ?? 0)}</span>
//                           </div>
//                         </div>
//                         <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
//                           <div
//                             className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
//                             style={{ width: `${Math.max(0, Math.min(100, Number(a.grade_10 ?? 0) * 10))}%` }}
//                           />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm font-extrabold text-[#173b7a]">伸びしろ（下位2つ）</div>
//                   <div className="mt-4 space-y-3">
//                     {bottom2.map((a: any) => (
//                       <div key={a.key} className="rounded-lg border border-slate-200 px-4 py-3">
//                         <div className="flex items-center justify-between">
//                           <div className="font-bold text-slate-800">{abilityLabel(a.key as AbilityKey)}</div>
//                           <div className="text-xs text-slate-600">
//                             T <span className="font-bold tabular-nums">{Number(a.t ?? 0).toFixed(1)}</span> ／ 10段階{" "}
//                             <span className="font-bold tabular-nums">{Number(a.grade_10 ?? 0)}</span>
//                           </div>
//                         </div>
//                         <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
//                           <div
//                             className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
//                             style={{ width: `${Math.max(0, Math.min(100, Number(a.grade_10 ?? 0) * 10))}%` }}
//                           />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           {/* 測定結果（tests がある時だけ） */}
//           {tests.length ? (
//             <section className="px-8 pb-10">
//               <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
//                 <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3">
//                   <div className="flex items-center justify-between">
//                     <div className="text-sm font-semibold text-white">測定結果（7種目）</div>
//                     <div className="text-xs text-slate-200">T=偏差値（50が平均）</div>
//                   </div>
//                 </div>

//                 <div className="bg-white">
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full">
//                       <thead className="bg-slate-50">
//                         <tr className="text-left text-xs font-semibold text-slate-600">
//                           <th className="px-5 py-3">測定項目</th>
//                           <th className="px-5 py-3">記録</th>
//                           <th className="px-5 py-3">偏差値T</th>
//                           <th className="px-5 py-3">10段階</th>
//                           <th className="px-5 py-3">評価バー</th>
//                         </tr>
//                       </thead>

//                       <tbody className="divide-y divide-slate-100">
//                         {tests.map((t: any) => {
//                           const grade = Number(t.grade_10 ?? 0);
//                           const pct = Math.max(0, Math.min(100, grade * 10));
//                           const tone = gradeTone(grade);

//                           const vStr = formatValue(t.value);
//                           const tStr = Number(t.t ?? 0).toFixed(1);
//                           const unit = t.unit ? String(t.unit) : "";

//                           return (
//                             <tr key={t.key} className="hover:bg-slate-50/60">
//                               <td className="px-5 py-4">
//                                 <div className="font-semibold text-slate-900">{t.label}</div>
//                                 <div className="mt-1 text-xs text-slate-500">{t.key}</div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <div className="font-semibold tabular-nums text-slate-900">
//                                   {vStr}
//                                   {unit ? <span className="ml-1 text-sm font-medium text-slate-600">{unit}</span> : null}
//                                 </div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900">
//                                   {tStr}
//                                 </span>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <span
//                                   className={[
//                                     "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums ring-1",
//                                     tone.badgeBg,
//                                     tone.badgeText,
//                                     tone.badgeRing,
//                                   ].join(" ")}
//                                 >
//                                   {grade}
//                                 </span>
//                               </td>

//                               <td className="px-5 py-4 w-[360px]">
//                                 <div className="flex items-center gap-3">
//                                   <div className="h-2.5 w-full rounded-full bg-slate-100">
//                                     <div
//                                       className={["h-2.5 rounded-full", "bg-gradient-to-r", tone.barFrom, tone.barTo].join(" ")}
//                                       style={{ width: `${pct}%` }}
//                                     />
//                                   </div>
//                                   <div className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
//                                     {pct}%
//                                   </div>
//                                 </div>
//                                 <div className="mt-2 text-xs text-slate-500">{tone.note}</div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
//                     ※ バーは「10段階×10%」の仮表現です（後で正式ロジックに合わせて変更できます）
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           <div className="h-10" />
//         </div>
//       </div>
//     </main>
//   );
// }





// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// type DiagnoseResult = {
//   meta?: { measured_at?: string | null } | null;
//   user?: {
//     display_name?: string | null;
//     sex?: "male" | "female" | string | null;
//     height_cm?: number | null;
//     weight_kg?: number | null;
//   } | null;
//   summary?: {
//     age?: number | null;
//     age_months?: number | null;
//     sex?: "male" | "female" | string | null;
//     overall?: { t?: number | null; grade_10?: number | null } | null;
//     motor_age?: { value?: number | null; message?: string | null } | null;
//     type?: { title?: string | null; description?: string | null } | null;
//     class?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null;
//   } | null;
//   detail?: {
//     sports_top6?: Array<{ rank: number; sport: string; icon_emoji?: string; score?: number }> | null;
//     trainings_focus?: Array<{
//       rank: number;
//       title: string;
//       target_ability?: string;
//       target_ability_label?: string;
//       howto?: string;
//       reps?: string;
//       effect?: string;
//     }> | null;
//     parent_message?: string | null;
//     targets_1month?: {
//       title?: string;
//       items?: Array<{ label: string; now_label: string; target_label: string }>;
//     } | null;
//   } | null;
// };

// function formatSex(sex?: string | null) {
//   if (sex === "male") return "男子";
//   if (sex === "female") return "女子";
//   return "—";
// }

// function classBadge(
//   cls?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null
// ) {
//   const key = cls?.key ?? "";
//   const label = cls?.label ?? "—";
//   const base =
//     "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset";

//   if (key === "expert") {
//     return (
//       <span className={cn(base, "bg-emerald-50 text-emerald-700 ring-emerald-200")}>
//         🏅 {label}
//       </span>
//     );
//   }
//   if (key === "standard") {
//     return (
//       <span className={cn(base, "bg-blue-50 text-blue-700 ring-blue-200")}>
//         ✅ {label}
//       </span>
//     );
//   }
//   if (key === "beginner") {
//     return (
//       <span className={cn(base, "bg-amber-50 text-amber-700 ring-amber-200")}>
//         🌱 {label}
//       </span>
//     );
//   }
//   return (
//     <span className={cn(base, "bg-slate-50 text-slate-700 ring-slate-200")}>
//       {label}
//     </span>
//   );
// }

// function gradeBadge(grade10?: number | null) {
//   const g = Number(grade10 ?? NaN);
//   const base =
//     "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset";
//   if (!Number.isFinite(g)) {
//     return <span className={cn(base, "bg-slate-50 text-slate-700 ring-slate-200")}>—</span>;
//   }
//   if (g >= 8) {
//     return <span className={cn(base, "bg-emerald-50 text-emerald-700 ring-emerald-200")}>高い</span>;
//   }
//   if (g >= 5) {
//     return <span className={cn(base, "bg-blue-50 text-blue-700 ring-blue-200")}>標準</span>;
//   }
//   return <span className={cn(base, "bg-amber-50 text-amber-700 ring-amber-200")}>伸びしろ</span>;
// }

// export default function ResultPage() {
//   const router = useRouter();
//   const [data, setData] = useState<DiagnoseResult | null>(null);

//   useEffect(() => {
//     const raw = sessionStorage.getItem("diagnose_result");
//     if (!raw) {
//       router.push("/patients");
//       return;
//     }
//     try {
//       setData(JSON.parse(raw));
//     } catch {
//       router.push("/patients");
//     }
//   }, [router]);

//   const measuredAt = useMemo(() => data?.meta?.measured_at ?? "", [data]);

//   const displayName = data?.user?.display_name ?? "受検者";
//   const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;

//   const height = data?.user?.height_cm;
//   const weight = data?.user?.weight_kg;
//   const age = data?.summary?.age;
//   const ageMonths = data?.summary?.age_months;

//   const overallT = data?.summary?.overall?.t ?? null;
//   const overallGrade = data?.summary?.overall?.grade_10 ?? null;

//   const motorAgeY = data?.summary?.motor_age?.value ?? null;
//   const motorMsg = data?.summary?.motor_age?.message ?? "";

//   const typeTitle = data?.summary?.type?.title ?? "—";
//   const typeDesc = data?.summary?.type?.description ?? "";

//   const cls = data?.summary?.class ?? null;

//   const sportsTop6 = data?.detail?.sports_top6 ?? [];
//   const trainings = data?.detail?.trainings_focus ?? [];
//   const parentMsg = data?.detail?.parent_message ?? "";
//   const targets = data?.detail?.targets_1month ?? null;

//   const rightTopLine = useMemo(() => {
//     const parts: string[] = [];
//     if (age != null) parts.push(`年齢：${age}歳${Number.isFinite(Number(ageMonths)) ? `${Math.max(0, (ageMonths ?? 0) % 12)}ヶ月` : ""}`);
//     parts.push(`性別：${formatSex(sex)}`);
//     if (height != null) parts.push(`身長：${height}cm`);
//     if (weight != null) parts.push(`体重：${weight}kg`);
//     return parts.filter(Boolean).join(" / ");
//   }, [age, ageMonths, sex, height, weight]);

//   if (!data) return null;

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={() => router.push("/patients")}
//           >
//             ← 患者一覧へ
//           </button>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white/90"
//             onClick={() => window.print()}
//           >
//             🖨️ PDF出力
//           </button>
//         </div>

//         {/* レポート本体 */}
//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           {/* ヘッダー */}
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h1 className="text-xl font-bold text-[#173b7a]">運動能力診断レポート</h1>
//                 <div className="mt-1 text-xs text-slate-500">Athletic Performance Assessment Report</div>
//               </div>

//               <div className="text-right">
//                 <div className="inline-flex items-center rounded-md bg-[#2a61c9] px-3 py-1 text-xs font-bold text-white">
//                   診断結果
//                 </div>
//                 {measuredAt ? <div className="mt-2 text-xs text-slate-600">測定日：{measuredAt}</div> : null}
//               </div>
//             </div>
//           </div>

//           {/* 受検者カード */}
//           <section className="px-8 py-6">
//             <div className="rounded-xl border border-slate-200 bg-[#f2f7ff] px-6 py-5">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <div className="text-xs text-slate-600">受検者</div>
//                   <div className="mt-1 text-2xl font-bold text-[#173b7a]">{displayName}</div>
//                 </div>

//                 <div className="text-right text-xs text-slate-600">
//                   {rightTopLine ? <div>{rightTopLine}</div> : null}
//                   <div className="mt-2 flex justify-end gap-2">
//                     {classBadge(cls)}
//                     {gradeBadge(overallGrade)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* サマリー（運動器年齢 / タイプ） */}
//           <section className="px-8 pb-2">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動器年齢</div>
//                 <div className="mt-1 flex items-baseline gap-2">
//                   <div className="text-3xl font-extrabold text-[#173b7a]">
//                     {motorAgeY != null ? `${motorAgeY}歳` : "—"}
//                   </div>
//                   <div className="text-sm font-semibold text-slate-500">
//                     （総合T {overallT != null ? _fmt1(overallT) : "—"}）
//                   </div>
//                 </div>
//                 {motorMsg ? <div className="mt-2 text-sm text-slate-700">{motorMsg}</div> : null}
//               </div>

//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動タイプ</div>
//                 <div className="mt-1 text-xl font-extrabold text-[#173b7a]">{typeTitle}</div>
//                 {typeDesc ? <div className="mt-2 text-sm text-slate-700">{typeDesc}</div> : null}
//               </div>
//             </div>
//           </section>

//           {/* 適性スポーツ TOP6 */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">適性スポーツ TOP6</h2>
//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
//               {sportsTop6.length ? (
//                 sportsTop6.map((s) => (
//                   <div key={`${s.rank}-${s.sport}`} className="rounded-xl border border-slate-200 px-4 py-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="text-sm font-extrabold text-slate-700">#{s.rank}</div>
//                         <div className="text-xl">{s.icon_emoji ?? "🏅"}</div>
//                         <div className="font-extrabold text-slate-900">{s.sport}</div>
//                       </div>
//                       <div className="text-xs font-bold text-slate-500">{s.score != null ? `${_fmt1(s.score)}pt` : ""}</div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">スポーツ候補がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 重点トレーニング提案 */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">重点トレーニング提案</h2>
//             <div className="mt-3 space-y-3">
//               {trainings.length ? (
//                 trainings.map((t) => (
//                   <div key={`${t.rank}-${t.title}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-xs font-bold text-slate-500">
//                           #{t.rank} / 重点：{t.target_ability_label ?? "—"}
//                         </div>
//                         <div className="mt-1 text-lg font-extrabold text-slate-900">{t.title}</div>
//                         {t.howto ? <div className="mt-2 text-sm text-slate-700">{t.howto}</div> : null}
//                         <div className="mt-2 flex flex-wrap gap-2 text-xs">
//                           {t.reps ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">回数：{t.reps}</span>
//                           ) : null}
//                           {t.effect ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">効果：{t.effect}</span>
//                           ) : null}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">トレーニング提案がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 保護者向け文章 */}
//           <section className="px-8 pb-2">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">保護者向けコメント</h2>
//             <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800">
//               {parentMsg ? parentMsg : "—"}
//             </div>
//           </section>

//           {/* 1ヶ月後の目標 */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">{targets?.title ?? "1ヶ月後の目標"}</h2>
//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
//               {(targets?.items ?? []).length ? (
//                 (targets?.items ?? []).map((it) => (
//                   <div key={it.label} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="text-xs font-bold text-slate-500">{it.label}</div>
//                     <div className="mt-2 flex items-center justify-between">
//                       <div className="text-sm font-bold text-slate-700">{it.now_label}</div>
//                       <div className="text-xs text-slate-400">→</div>
//                       <div className="text-sm font-extrabold text-[#173b7a]">{it.target_label}</div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">目標がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* フッター */}
//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 本レポートは入力された測定値に基づく推定結果です。ケガや痛みがある場合は無理をせず、専門家に相談してください。
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// function _fmt1(n: number) {
//   const v = Number(n);
//   if (!Number.isFinite(v)) return "—";
//   return v.toFixed(1);
// }

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

export default function ResultPage() {
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