// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// type DiagnoseResult = {
//   meta?: { measured_at?: string | null } | null;

//   user?: {
//     name?: string | null;
//     display_name?: string | null;
//     sex?: "male" | "female" | string | null;
//     age?: number | null;
//     age_months?: number | null;
//     height_cm?: number | null;
//     weight_kg?: number | null;
//     school_name?: string | null;
//     patient_id?: number | null;
//     clinic_id?: number | null;
//   } | null;

//   summary?: {
//     age?: number | null;
//     age_months?: number | null;
//     sex?: "male" | "female" | string | null;
//     motor_age?: { value?: number | null; label?: string | null; message?: string | null } | null;
//     type?: {
//       key?: string | null;
//       label?: string | null;
//       desc?: string | null;
//       title?: string | null;
//       description?: string | null;
//     } | null;
//     class?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null;
//   } | null;

//   // ★ APIが返している形（root直下）
//   abilities?: Array<{
//     key: string;
//     label?: string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null; // 0-100
//   }> | null;

//   tests?: Array<{
//     key: string;
//     label?: string | null;
//     unit?: string | null;
//     value?: number | string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null; // 0-100
//     rank_label?: string | null; // 強み/平均付近/伸びしろ
//   }> | null;

//   sports_top6?: Array<{
//     sport: string;
//     emoji?: string | null;
//     score?: number | null;
//     reason?: string | null;
//   }> | null;

//   trainings_focus?: Array<{
//     id?: number | null;
//     title: string;
//     ability_key?: string | null;
//     ability_label?: string | null;
//     desc?: string | null;
//     frequency?: string | null;
//   }> | null;

//   guardian_message?: string | null;
//   month_goal?: string | null;
// };

// function formatSex(sex?: string | null) {
//   if (sex === "male") return "男子";
//   if (sex === "female") return "女子";
//   return "";
// }

// function _fmt1(n: any) {
//   const v = Number(n);
//   if (!Number.isFinite(v)) return "";
//   return v.toFixed(1);
// }

// function _fmtValue(v: any) {
//   const n = Number(v);
//   if (!Number.isFinite(n)) return "";
//   if (Number.isInteger(n)) return n.toFixed(0);
//   return n.toFixed(1);
// }

// function classBadge(
//   cls?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null
// ) {
//   const key = cls?.key ?? "";
//   const label = cls?.label ?? "";
//   if (!label) return null;

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

// function gradeToneFromPct(pct: number) {
//   // pct: 0-100
//   if (pct < 40) {
//     return {
//       barFrom: "from-amber-400",
//       barTo: "to-orange-500",
//       note: "伸びしろ",
//     };
//   }
//   if (pct < 70) {
//     return {
//       barFrom: "from-sky-400",
//       barTo: "to-indigo-500",
//       note: "平均付近",
//     };
//   }
//   return {
//     barFrom: "from-emerald-400",
//     barTo: "to-teal-500",
//     note: "強み",
//   };
// }

// // 必要な import は元の page.tsx からそのまま移植

// export default function ResultClient() {
//   const router = useRouter();
//   const sp = useSearchParams(); // ★追加

//   // ★クエリ取得
//   const back = sp.get("back"); // "records" が来る想定
//   const patientId = sp.get("patient_id");
//   const clinicId = sp.get("clinic_id");

//   // ★記録一覧へ戻るURL（クエリが欠けたら patients に逃がす）
//   const backToRecordsUrl =
//     patientId && clinicId
//       ? `/patients/records?patient_id=${encodeURIComponent(patientId)}&clinic_id=${encodeURIComponent(clinicId)}`
//       : "/patients";

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

//   // ★ name 優先（APIは user.name を返している）
//   const displayName =
//     data?.user?.display_name ??
//     data?.user?.name ??
//     "受検者";

//   const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;

//   // 年齢は user にも summary にも来るので「ある方」を使う
//   const age = data?.user?.age ?? data?.summary?.age ?? null;
//   const ageMonths = data?.user?.age_months ?? data?.summary?.age_months ?? null;

//   const height = data?.user?.height_cm ?? null;
//   const weight = data?.user?.weight_kg ?? null;

//   const cls = data?.summary?.class ?? null;

//   // 運動器年齢
//   const motorAgeY = data?.summary?.motor_age?.value ?? null;
//   const motorMsg =
//     (data?.summary?.motor_age?.message ??
//       data?.summary?.motor_age?.label ??
//       "") as string;

//   // 運動タイプ（APIは label/desc で来ている）
//   const typeTitle =
//     data?.summary?.type?.label ??
//     data?.summary?.type?.title ??
//     "";
//   const typeDesc =
//     data?.summary?.type?.desc ??
//     data?.summary?.type?.description ??
//     "";

//   // ★ root直下を参照
//   const abilities = Array.isArray(data?.abilities) ? data!.abilities! : [];
//   const tests = Array.isArray(data?.tests) ? data!.tests! : [];
//   const sportsTop6 = Array.isArray(data?.sports_top6) ? data!.sports_top6! : [];
//   const trainings = Array.isArray(data?.trainings_focus) ? data!.trainings_focus! : [];
//   const guardianMsg = (data?.guardian_message ?? "") as string;
//   const monthGoal = (data?.month_goal ?? "") as string;

//   const rightTopLine = useMemo(() => {
//     const parts: string[] = [];
//     if (age != null) {
//       const m =
//         Number.isFinite(Number(ageMonths)) && ageMonths != null
//           ? Math.max(0, Number(ageMonths) - Number(age) * 12)
//           : null;
//       parts.push(`年齢：${age}歳${m != null ? `${m}ヶ月` : ""}`);
//     }
//     if (sex) parts.push(`性別：${formatSex(sex)}`);
//     if (height != null) parts.push(`身長 ${_fmtValue(height)}cm`);
//     if (weight != null) parts.push(`体重 ${_fmtValue(weight)}kg`);
//     return parts.filter(Boolean).join(" / ");
//   }, [age, ageMonths, sex, height, weight]);

//   if (!data) return null;

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
//           {/* 左：戻るボタン群 */}
//           <div className="flex items-center gap-2">
//             {/* 受検者一覧へ戻る（常に出す） */}
//             <button
//               className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//               onClick={() => router.push("/patients")}
//             >
//               ← 受検者一覧へ
//             </button>
//             {/* 記録一覧へ戻る（back=records のときだけ表示してもOK。常に出すなら条件外してOK） */}
//             {back === "records" ? (
//               <button
//                 className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//                 onClick={() => router.push(backToRecordsUrl)}
//               >
//                 ← 記録一覧へ
//               </button>
//             ) : null}
//           </div>

//           {/* 右：印刷 */}
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
//                   <div className="mt-2 flex justify-end gap-2">{classBadge(cls)}</div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* 運動器年齢 / 運動タイプ */}
//           <section className="px-8 pb-2">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動器年齢</div>
//                 <div className="mt-1 text-3xl font-extrabold text-[#173b7a]">
//                   {motorAgeY != null ? `${motorAgeY}歳` : ""}
//                 </div>
//                 {motorMsg ? <div className="mt-2 text-sm text-slate-700">{motorMsg}</div> : null}
//               </div>

//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動タイプ</div>
//                 {typeTitle ? <div className="mt-1 text-xl font-extrabold text-[#173b7a]">{typeTitle}</div> : null}
//                 {typeDesc ? <div className="mt-2 text-sm text-slate-700">{typeDesc}</div> : null}
//               </div>
//             </div>
//           </section>

//           {/* 適性スポーツ TOP6（★ここが今不足してた部分） */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">適性スポーツ TOP6</h2>
//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
//               {sportsTop6.length ? (
//                 sportsTop6.map((s, idx) => (
//                   <div key={`${s.sport}-${idx}`} className="rounded-xl border border-slate-200 px-4 py-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="text-sm font-extrabold text-slate-700">#{idx + 1}</div>
//                         <div className="text-xl">{s.emoji ?? "🏅"}</div>
//                         <div className="font-extrabold text-slate-900">{s.sport}</div>
//                       </div>
//                       <div className="text-xs font-bold text-slate-500">
//                         {s.score != null ? `${_fmt1(s.score)}pt` : ""}
//                       </div>
//                     </div>
//                     {s.reason ? <div className="mt-2 text-xs text-slate-600">{s.reason}</div> : null}
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">スポーツ候補がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 重点トレーニング提案（★ここも今不足してた部分） */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">重点トレーニング提案</h2>
//             <div className="mt-3 space-y-3">
//               {trainings.length ? (
//                 trainings.slice(0, 4).map((t, idx) => (
//                   <div key={`${t.title}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="text-xs font-bold text-slate-500">
//                       重点：{t.ability_label ?? ""} {t.frequency ? ` / ${t.frequency}` : ""}
//                     </div>
//                     <div className="mt-1 text-lg font-extrabold text-slate-900">{t.title}</div>
//                     {t.desc ? <div className="mt-2 text-sm text-slate-700">{t.desc}</div> : null}
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">トレーニング提案がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 6能力（APIは bar_pct を返しているので、それで確実にバーが動く） */}
//           {abilities.length ? (
//             <section className="px-8 pb-8">
//               <h2 className="text-lg font-extrabold text-[#173b7a]">6能力スコア</h2>
//               <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
//                 {abilities.map((a, idx) => {
//                   const pct = Math.max(0, Math.min(100, Number(a.bar_pct ?? 0)));
//                   const tone = gradeToneFromPct(pct);
//                   return (
//                     <div key={`${a.key}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                       <div className="flex items-center justify-between">
//                         <div className="font-extrabold text-slate-900">{a.label ?? a.key}</div>
//                         <div className="text-xs text-slate-600">
//                           T <span className="font-bold tabular-nums">{_fmt1(a.t)}</span>
//                         </div>
//                       </div>
//                       <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
//                         <div
//                           className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                           style={{ width: `${pct}%` }}
//                         />
//                       </div>
//                       <div className="mt-2 text-xs text-slate-500">{tone.note}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>
//           ) : null}

//           {/* 測定結果（7種目）: bar_pct をそのまま表示するので “0%固定” にならない */}
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
//                           <th className="px-5 py-3">評価バー</th>
//                         </tr>
//                       </thead>

//                       <tbody className="divide-y divide-slate-100">
//                         {tests.map((t, idx) => {
//                           const pct = Math.max(0, Math.min(100, Number(t.bar_pct ?? 0)));
//                           const tone = gradeToneFromPct(pct);
//                           const unit = t.unit ? String(t.unit) : "";
//                           return (
//                             <tr key={`${t.key}-${idx}`} className="hover:bg-slate-50/60">
//                               <td className="px-5 py-4">
//                                 <div className="font-semibold text-slate-900">{t.label ?? t.key}</div>
//                                 <div className="mt-1 text-xs text-slate-500">{t.key}</div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <div className="font-semibold tabular-nums text-slate-900">
//                                   {_fmtValue(t.value)}
//                                   {unit ? <span className="ml-1 text-sm font-medium text-slate-600">{unit}</span> : null}
//                                 </div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900">
//                                   {_fmt1(t.t)}
//                                 </span>
//                               </td>

//                               <td className="px-5 py-4 w-[420px]">
//                                 <div className="flex items-center gap-3">
//                                   <div className="h-2.5 w-full rounded-full bg-slate-100">
//                                     <div
//                                       className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                                       style={{ width: `${pct}%` }}
//                                     />
//                                   </div>
//                                   <div className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
//                                     {pct}%
//                                   </div>
//                                 </div>
//                                 <div className="mt-2 text-xs text-slate-500">
//                                   {t.rank_label ?? tone.note}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
//                     ※ バーはAPIが返す <code>bar_pct</code>（0〜100）を表示しています
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           {/* 保護者向け / 1ヶ月目標（APIは guardian_message / month_goal） */}
//           {(guardianMsg || monthGoal) ? (
//             <section className="px-8 pb-10">
//               {guardianMsg ? (
//                 <>
//                   <h2 className="text-lg font-extrabold text-[#173b7a]">保護者向けコメント</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800">
//                     {guardianMsg}
//                   </div>
//                 </>
//               ) : null}

//               {monthGoal ? (
//                 <>
//                   <h2 className="mt-8 text-lg font-extrabold text-[#173b7a]">最初の1ヶ月の目標</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800">
//                     {monthGoal}
//                   </div>
//                 </>
//               ) : null}
//             </section>
//           ) : null}

//           {/* フッター */}
//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 本レポートは入力された測定値に基づく推定結果です。ケガや痛みがある場合は無理をせず、専門家に相談してください。
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// type DiagnoseResult = {
//   meta?: { 
//     measured_at?: string | null;
//     event_name?: string | null; // ✅ 追加
//   } | null;

//   user?: {
//     name?: string | null;
//     display_name?: string | null;
//     sex?: "male" | "female" | string | null;
//     age?: number | null;
//     age_months?: number | null;
//     height_cm?: number | null;
//     weight_kg?: number | null;
//     school_name?: string | null;
//     patient_id?: number | null;
//     clinic_id?: number | null;
//   } | null;

//   summary?: {
//     age?: number | null;
//     age_months?: number | null;
//     sex?: "male" | "female" | string | null;
//     motor_age?: { value?: number | null; label?: string | null; message?: string | null } | null;
//     type?: {
//       key?: string | null;
//       label?: string | null;
//       desc?: string | null;
//       title?: string | null;
//       description?: string | null;
//     } | null;
//     class?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null;
//   } | null;

//   abilities?: Array<{
//     key: string;
//     label?: string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null;
//   }> | null;

//   tests?: Array<{
//     key: string;
//     label?: string | null;
//     unit?: string | null;
//     value?: number | string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null;
//     rank_label?: string | null;
//   }> | null;

//   sports_top6?: Array<{
//     sport: string;
//     emoji?: string | null;
//     score?: number | null;
//     reason?: string | null;
//   }> | null;

//   trainings_focus?: Array<{
//     id?: number | null;
//     title: string;
//     ability_key?: string | null;
//     ability_label?: string | null;
//     desc?: string | null;
//     frequency?: string | null;
//     image?: string | null;
//   }> | null;

//   guardian_message?: string | null;
//   month_goal?: string | null;
// };

// function formatSex(sex?: string | null) {
//   if (sex === "male") return "男子";
//   if (sex === "female") return "女子";
//   return "";
// }

// // ✅ 日付フォーマット関数を追加
// function formatDateJapanese(dateStr?: string | null): string {
//   if (!dateStr) return "—";
//   try {
//     const d = new Date(dateStr);
//     const y = d.getFullYear();
//     const m = d.getMonth() + 1;
//     const day = d.getDate();
//     return `${y}年${m}月${day}日`;
//   } catch {
//     return dateStr;
//   }
// }

// // ✅ 3ヶ月後の日付を計算
// function getNextRecommendedDate(dateStr?: string | null): string {
//   if (!dateStr) return "—";
//   try {
//     const d = new Date(dateStr);
//     d.setMonth(d.getMonth() + 3);
//     const y = d.getFullYear();
//     const m = d.getMonth() + 1;
//     const day = d.getDate();
//     return `${y}年${m}月${day}日`;
//   } catch {
//     return "—";
//   }
// }

// function _fmt1(n: any) {
//   const v = Number(n);
//   if (!Number.isFinite(v)) return "";
//   return v.toFixed(1);
// }

// function _fmtValue(v: any) {
//   const n = Number(v);
//   if (!Number.isFinite(n)) return "";
//   if (Number.isInteger(n)) return n.toFixed(0);
//   return n.toFixed(1);
// }

// function classBadge(
//   cls?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null
// ) {
//   const key = cls?.key ?? "";
//   const label = cls?.label ?? "";
//   if (!label) return null;

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

// function gradeToneFromPct(pct: number) {
//   if (pct < 40) {
//     return {
//       barFrom: "from-amber-400",
//       barTo: "to-orange-500",
//       note: "伸びしろ",
//     };
//   }
//   if (pct < 70) {
//     return {
//       barFrom: "from-sky-400",
//       barTo: "to-indigo-500",
//       note: "平均付近",
//     };
//   }
//   return {
//     barFrom: "from-emerald-400",
//     barTo: "to-teal-500",
//     note: "強み",
//   };
// }

// export default function ResultClient() {
//   const router = useRouter();
//   const sp = useSearchParams();

//   const back = sp.get("back");
//   const patientId = sp.get("patient_id");
//   const clinicId = sp.get("clinic_id");

//   const backToRecordsUrl =
//     patientId && clinicId
//       ? `/patients/records?patient_id=${encodeURIComponent(patientId)}&clinic_id=${encodeURIComponent(clinicId)}`
//       : "/patients";

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
//   const eventName = useMemo(() => data?.meta?.event_name ?? "", [data]); // ✅ 追加
//   const nextRecommendedDate = useMemo(() => getNextRecommendedDate(measuredAt), [measuredAt]); // ✅ 追加

//   const displayName =
//     data?.user?.display_name ??
//     data?.user?.name ??
//     "受検者";

//   const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;

//   const age = data?.user?.age ?? data?.summary?.age ?? null;
//   const ageMonths = data?.user?.age_months ?? data?.summary?.age_months ?? null;

//   const height = data?.user?.height_cm ?? null;
//   const weight = data?.user?.weight_kg ?? null;

//   const cls = data?.summary?.class ?? null;

//   const motorAgeY = data?.summary?.motor_age?.value ?? null;
//   const motorMsg =
//     (data?.summary?.motor_age?.message ??
//       data?.summary?.motor_age?.label ??
//       "") as string;

//   const typeTitle =
//     data?.summary?.type?.label ??
//     data?.summary?.type?.title ??
//     "";
//   const typeDesc =
//     data?.summary?.type?.desc ??
//     data?.summary?.type?.description ??
//     "";

//   const abilities = Array.isArray(data?.abilities) ? data!.abilities! : [];
//   const tests = Array.isArray(data?.tests) ? data!.tests! : [];
//   const sportsTop6 = Array.isArray(data?.sports_top6) ? data!.sports_top6! : [];
//   const trainings = Array.isArray(data?.trainings_focus) ? data!.trainings_focus! : [];
//   const guardianMsg = (data?.guardian_message ?? "") as string;
//   const monthGoal = (data?.month_goal ?? "") as string;

//   const rightTopLine = useMemo(() => {
//     const parts: string[] = [];
//     if (age != null) {
//       const m =
//         Number.isFinite(Number(ageMonths)) && ageMonths != null
//           ? Math.max(0, Number(ageMonths) - Number(age) * 12)
//           : null;
//       parts.push(`年齢：${age}歳${m != null ? `${m}ヶ月` : ""}`);
//     }
//     if (sex) parts.push(`性別：${formatSex(sex)}`);
//     if (height != null) parts.push(`身長 ${_fmtValue(height)}cm`);
//     if (weight != null) parts.push(`体重 ${_fmtValue(weight)}kg`);
//     return parts.filter(Boolean).join(" / ");
//   }, [age, ageMonths, sex, height, weight]);

//   if (!data) return null;

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
//           <div className="flex items-center gap-2">
//             <button
//               className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//               onClick={() => router.push("/patients")}
//             >
//               ← 受検者一覧へ
//             </button>
//             {back === "records" ? (
//               <button
//                 className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//                 onClick={() => router.push(backToRecordsUrl)}
//               >
//                 ← 記録一覧へ
//               </button>
//             ) : null}
//           </div>

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
//                 {measuredAt ? <div className="mt-2 text-xs text-slate-600">測定日：{measuredAt}</div> : null}
//               </div>
//             </div>
//           </div>

//           {/* ✅ 測定情報セクションを追加 */}
//           <section className="border-b bg-slate-50 px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">測定情報</h2>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               {/* 測定日 */}
//               <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">測定日</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                   {formatDateJapanese(measuredAt)}
//                 </div>
//               </div>

//               {/* 測定イベント */}
//               <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">測定イベント</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                   {eventName || "—"}
//                 </div>
//               </div>

//               {/* 次回おすすめ測定日 */}
//               <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
//                 <div className="text-xs font-bold text-emerald-700">次回おすすめ測定日</div>
//                 <div className="mt-1 text-base font-extrabold text-emerald-900">
//                   {nextRecommendedDate}
//                 </div>
//                 <div className="mt-1 text-xs text-emerald-600">（3ヶ月後）</div>
//               </div>
//             </div>
//           </section>

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
//                   <div className="mt-2 flex justify-end gap-2">{classBadge(cls)}</div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* 運動器年齢 / 運動タイプ */}
//           <section className="px-8 pb-2">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動器年齢</div>
//                 <div className="mt-1 text-3xl font-extrabold text-[#173b7a]">
//                   {motorAgeY != null ? `${motorAgeY}歳` : ""}
//                 </div>
//                 {motorMsg ? <div className="mt-2 text-sm text-slate-700">{motorMsg}</div> : null}
//               </div>

//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動タイプ</div>
//                 {typeTitle ? <div className="mt-1 text-xl font-extrabold text-[#173b7a]">{typeTitle}</div> : null}
//                 {typeDesc ? <div className="mt-2 text-sm text-slate-700">{typeDesc}</div> : null}
//               </div>
//             </div>
//           </section>

//           {/* 適性スポーツ TOP6 */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">適性スポーツ TOP6</h2>
//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
//               {sportsTop6.length ? (
//                 sportsTop6.map((s, idx) => (
//                   <div key={`${s.sport}-${idx}`} className="rounded-xl border border-slate-200 px-4 py-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="text-sm font-extrabold text-slate-700">#{idx + 1}</div>
//                         <div className="text-xl">{s.emoji ?? "🏅"}</div>
//                         <div className="font-extrabold text-slate-900">{s.sport}</div>
//                       </div>
//                       <div className="text-xs font-bold text-slate-500">
//                         {s.score != null ? `${_fmt1(s.score)}pt` : ""}
//                       </div>
//                     </div>
//                     {s.reason ? <div className="mt-2 text-xs text-slate-600">{s.reason}</div> : null}
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
//                 trainings.slice(0, 4).map((t, idx) => (
//                   <div key={`${t.title}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="flex items-start justify-between gap-4">
//                       {/* 左側：テキスト */}
//                       <div className="flex-1 min-w-0">
//                         <div className="text-xs font-bold text-slate-500">
//                           重点：{t.ability_label ?? ""} {t.frequency ? ` / ${t.frequency}` : ""}
//                         </div>
//                         <div className="mt-1 text-lg font-extrabold text-slate-900">{t.title}</div>
//                         {t.desc ? <div className="mt-2 text-sm text-slate-700">{t.desc}</div> : null}
//                       </div>

//                       {/* 右側：画像 */}
//                       {t.image && (
//                         <div className="flex-shrink-0">
//                           <img 
//                             src={t.image} 
//                             alt={t.title} 
//                             className="w-28 h-28 object-contain rounded-lg border border-slate-200 bg-slate-50"
//                             loading="lazy"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">トレーニング提案がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 6能力 */}
//           {abilities.length ? (
//             <section className="px-8 pb-8">
//               <h2 className="text-lg font-extrabold text-[#173b7a]">6能力スコア</h2>
//               <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
//                 {abilities.map((a, idx) => {
//                   const pct = Math.max(0, Math.min(100, Number(a.bar_pct ?? 0)));
//                   const tone = gradeToneFromPct(pct);
//                   return (
//                     <div key={`${a.key}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                       <div className="flex items-center justify-between">
//                         <div className="font-extrabold text-slate-900">{a.label ?? a.key}</div>
//                         <div className="text-xs text-slate-600">
//                           T <span className="font-bold tabular-nums">{_fmt1(a.t)}</span>
//                         </div>
//                       </div>
//                       <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
//                         <div
//                           className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                           style={{ width: `${pct}%` }}
//                         />
//                       </div>
//                       <div className="mt-2 text-xs text-slate-500">{tone.note}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>
//           ) : null}

//           {/* 測定結果（7種目） */}
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
//                           <th className="px-5 py-3">評価バー</th>
//                         </tr>
//                       </thead>

//                       <tbody className="divide-y divide-slate-100">
//                         {tests.map((t, idx) => {
//                           const pct = Math.max(0, Math.min(100, Number(t.bar_pct ?? 0)));
//                           const tone = gradeToneFromPct(pct);
//                           const unit = t.unit ? String(t.unit) : "";
//                           return (
//                             <tr key={`${t.key}-${idx}`} className="hover:bg-slate-50/60">
//                               <td className="px-5 py-4">
//                                 <div className="font-semibold text-slate-900">{t.label ?? t.key}</div>
//                                 <div className="mt-1 text-xs text-slate-500">{t.key}</div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <div className="font-semibold tabular-nums text-slate-900">
//                                   {_fmtValue(t.value)}
//                                   {unit ? <span className="ml-1 text-sm font-medium text-slate-600">{unit}</span> : null}
//                                 </div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900">
//                                   {_fmt1(t.t)}
//                                 </span>
//                               </td>

//                               <td className="px-5 py-4 w-[420px]">
//                                 <div className="flex items-center gap-3">
//                                   <div className="h-2.5 w-full rounded-full bg-slate-100">
//                                     <div
//                                       className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                                       style={{ width: `${pct}%` }}
//                                     />
//                                   </div>
//                                   <div className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
//                                     {pct}%
//                                   </div>
//                                 </div>
//                                 <div className="mt-2 text-xs text-slate-500">
//                                   {t.rank_label ?? tone.note}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
//                     ※ バーはAPIが返す <code>bar_pct</code>（0〜100）を表示しています
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           {/* 保護者向け / 1ヶ月目標 */}
//           {(guardianMsg || monthGoal) ? (
//             <section className="px-8 pb-10">
//               {guardianMsg ? (
//                 <>
//                   <h2 className="text-lg font-extrabold text-[#173b7a]">保護者向けコメント</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800">
//                     {guardianMsg}
//                   </div>
//                 </>
//               ) : null}

//               {monthGoal ? (
//                 <>
//                   <h2 className="mt-8 text-lg font-extrabold text-[#173b7a]">最初の1ヶ月の目標</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800">
//                     {monthGoal}
//                   </div>
//                 </>
//               ) : null}
//             </section>
//           ) : null}

//           {/* フッター */}
//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 本レポートは入力された測定値に基づく推定結果です。ケガや痛みがある場合は無理をせず、専門家に相談してください。
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }


// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// type DiagnoseResult = {
//   meta?: { 
//     measured_at?: string | null;
//     event_name?: string | null;
//   } | null;

//   user?: {
//     name?: string | null;
//     display_name?: string | null;
//     sex?: "male" | "female" | string | null;
//     age?: number | null;
//     age_months?: number | null;
//     height_cm?: number | null;
//     weight_kg?: number | null;
//     school_name?: string | null;
//     patient_id?: number | null;
//     clinic_id?: number | null;
//   } | null;

//   summary?: {
//     age?: number | null;
//     age_months?: number | null;
//     sex?: "male" | "female" | string | null;
//     motor_age?: { value?: number | null; label?: string | null; message?: string | null } | null;
//     type?: {
//       key?: string | null;
//       label?: string | null;
//       desc?: string | null;
//       title?: string | null;
//       description?: string | null;
//     } | null;
//     class?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null;
//   } | null;

//   abilities?: Array<{
//     key: string;
//     label?: string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null;
//   }> | null;

//   tests?: Array<{
//     key: string;
//     label?: string | null;
//     unit?: string | null;
//     value?: number | string | null;
//     t?: number | null;
//     decile?: number | null;
//     bar_pct?: number | null;
//     rank_label?: string | null;
//   }> | null;

//   sports_top6?: Array<{
//     sport: string;
//     emoji?: string | null;
//     score?: number | null;
//     reason?: string | null;
//   }> | null;

//   trainings_focus?: Array<{
//     id?: number | null;
//     title: string;
//     ability_key?: string | null;
//     ability_label?: string | null;
//     desc?: string | null;
//     frequency?: string | null;
//     image?: string | null;
//   }> | null;

//   guardian_message?: string | null;
//   month_goal?: string | null;
// };

// function formatSex(sex?: string | null) {
//   if (sex === "male") return "男子";
//   if (sex === "female") return "女子";
//   return "";
// }

// function formatDateJapanese(dateStr?: string | null): string {
//   if (!dateStr) return "—";
//   try {
//     const d = new Date(dateStr);
//     const y = d.getFullYear();
//     const m = d.getMonth() + 1;
//     const day = d.getDate();
//     return `${y}年${m}月${day}日`;
//   } catch {
//     return dateStr;
//   }
// }

// // ✅ 1ヶ月後の日付を計算
// function getOneMonthLaterDate(dateStr?: string | null): string {
//   if (!dateStr) return "—";
//   try {
//     const d = new Date(dateStr);
//     d.setMonth(d.getMonth() + 1);
//     const y = d.getFullYear();
//     const m = d.getMonth() + 1;
//     const day = d.getDate();
//     return `${y}年${m}月${day}日`;
//   } catch {
//     return "—";
//   }
// }

// // ✅ 3ヶ月後の日付を計算
// function getThreeMonthsLaterDate(dateStr?: string | null): string {
//   if (!dateStr) return "—";
//   try {
//     const d = new Date(dateStr);
//     d.setMonth(d.getMonth() + 3);
//     const y = d.getFullYear();
//     const m = d.getMonth() + 1;
//     const day = d.getDate();
//     return `${y}年${m}月${day}日`;
//   } catch {
//     return "—";
//   }
// }

// function _fmt1(n: any) {
//   const v = Number(n);
//   if (!Number.isFinite(v)) return "";
//   return v.toFixed(1);
// }

// function _fmtValue(v: any) {
//   const n = Number(v);
//   if (!Number.isFinite(n)) return "";
//   if (Number.isInteger(n)) return n.toFixed(0);
//   return n.toFixed(1);
// }

// function classBadge(
//   cls?: { key?: "beginner" | "standard" | "expert" | string; label?: string | null } | null
// ) {
//   const key = cls?.key ?? "";
//   const label = cls?.label ?? "";
//   if (!label) return null;

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

// function gradeToneFromPct(pct: number) {
//   if (pct < 40) {
//     return {
//       barFrom: "from-amber-400",
//       barTo: "to-orange-500",
//       note: "伸びしろ",
//     };
//   }
//   if (pct < 70) {
//     return {
//       barFrom: "from-sky-400",
//       barTo: "to-indigo-500",
//       note: "平均付近",
//     };
//   }
//   return {
//     barFrom: "from-emerald-400",
//     barTo: "to-teal-500",
//     note: "強み",
//   };
// }

// export default function ResultClient() {
//   const router = useRouter();
//   const sp = useSearchParams();

//   const back = sp.get("back");
//   const patientId = sp.get("patient_id");
//   const clinicId = sp.get("clinic_id");

//   const backToRecordsUrl =
//     patientId && clinicId
//       ? `/patients/records?patient_id=${encodeURIComponent(patientId)}&clinic_id=${encodeURIComponent(clinicId)}`
//       : "/patients";

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
//   const eventName = useMemo(() => data?.meta?.event_name ?? "", [data]);
//   const nextOneMonthDate = useMemo(() => getOneMonthLaterDate(measuredAt), [measuredAt]); // ✅ 1ヶ月後
//   const nextThreeMonthsDate = useMemo(() => getThreeMonthsLaterDate(measuredAt), [measuredAt]); // ✅ 3ヶ月後

//   const displayName =
//     data?.user?.display_name ??
//     data?.user?.name ??
//     "受検者";

//   const sex = (data?.user?.sex ?? data?.summary?.sex ?? "") as string;

//   const age = data?.user?.age ?? data?.summary?.age ?? null;
//   const ageMonths = data?.user?.age_months ?? data?.summary?.age_months ?? null;

//   const height = data?.user?.height_cm ?? null;
//   const weight = data?.user?.weight_kg ?? null;

//   const cls = data?.summary?.class ?? null;

//   const motorAgeY = data?.summary?.motor_age?.value ?? null;
//   const motorMsg =
//     (data?.summary?.motor_age?.message ??
//       data?.summary?.motor_age?.label ??
//       "") as string;

//   const typeTitle =
//     data?.summary?.type?.label ??
//     data?.summary?.type?.title ??
//     "";
//   const typeDesc =
//     data?.summary?.type?.desc ??
//     data?.summary?.type?.description ??
//     "";

//   const abilities = Array.isArray(data?.abilities) ? data!.abilities! : [];
//   const tests = Array.isArray(data?.tests) ? data!.tests! : [];
//   const sportsTop6 = Array.isArray(data?.sports_top6) ? data!.sports_top6! : [];
//   const trainings = Array.isArray(data?.trainings_focus) ? data!.trainings_focus! : [];
//   const guardianMsg = (data?.guardian_message ?? "") as string;
//   const monthGoal = (data?.month_goal ?? "") as string;

//   const rightTopLine = useMemo(() => {
//     const parts: string[] = [];
//     if (age != null) {
//       const m =
//         Number.isFinite(Number(ageMonths)) && ageMonths != null
//           ? Math.max(0, Number(ageMonths) - Number(age) * 12)
//           : null;
//       parts.push(`年齢：${age}歳${m != null ? `${m}ヶ月` : ""}`);
//     }
//     if (sex) parts.push(`性別：${formatSex(sex)}`);
//     if (height != null) parts.push(`身長 ${_fmtValue(height)}cm`);
//     if (weight != null) parts.push(`体重 ${_fmtValue(weight)}kg`);
//     return parts.filter(Boolean).join(" / ");
//   }, [age, ageMonths, sex, height, weight]);

//   if (!data) return null;

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80 print:hidden">
//           <div className="flex items-center gap-2">
//             <button
//               className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//               onClick={() => router.push("/patients")}
//             >
//               ← 受検者一覧へ
//             </button>
//             {back === "records" ? (
//               <button
//                 className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//                 onClick={() => router.push(backToRecordsUrl)}
//               >
//                 ← 記録一覧へ
//               </button>
//             ) : null}
//           </div>

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
//                 {measuredAt ? <div className="mt-2 text-xs text-slate-600">測定日：{measuredAt}</div> : null}
//               </div>
//             </div>
//           </div>

//           {/* ✅ 測定情報セクション（4列グリッドに変更） */}
//           <section className="border-b bg-slate-50 px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">測定情報</h2>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//               {/* 測定日 */}
//               <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">測定日</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                   {formatDateJapanese(measuredAt)}
//                 </div>
//               </div>

//               {/* 測定イベント */}
//               <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">測定イベント</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                   {eventName || "—"}
//                 </div>
//               </div>

//               {/* ✅ 次回おすすめ測定日（1ヶ月後） */}
//               <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
//                 <div className="text-xs font-bold text-sky-700">次回おすすめ測定日</div>
//                 <div className="mt-1 text-base font-extrabold text-sky-900">
//                   {nextOneMonthDate}
//                 </div>
//                 <div className="mt-1 text-xs text-sky-600">（1ヶ月後）</div>
//               </div>

//               {/* ✅ 次々回おすすめ測定日（3ヶ月後） */}
//               <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
//                 <div className="text-xs font-bold text-emerald-700">次々回おすすめ測定日</div>
//                 <div className="mt-1 text-base font-extrabold text-emerald-900">
//                   {nextThreeMonthsDate}
//                 </div>
//                 <div className="mt-1 text-xs text-emerald-600">（3ヶ月後）</div>
//               </div>
//             </div>
//           </section>

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
//                   <div className="mt-2 flex justify-end gap-2">{classBadge(cls)}</div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* 運動器年齢 / 運動タイプ */}
//           <section className="px-8 pb-2">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動器年齢</div>
//                 <div className="mt-1 text-3xl font-extrabold text-[#173b7a]">
//                   {motorAgeY != null ? `${motorAgeY}歳` : ""}
//                 </div>
//                 {motorMsg ? <div className="mt-2 text-sm text-slate-700">{motorMsg}</div> : null}
//               </div>

//               <div className="rounded-xl border border-slate-200 px-5 py-4">
//                 <div className="text-xs font-bold text-slate-500">運動タイプ</div>
//                 {typeTitle ? <div className="mt-1 text-xl font-extrabold text-[#173b7a]">{typeTitle}</div> : null}
//                 {typeDesc ? <div className="mt-2 text-sm text-slate-700">{typeDesc}</div> : null}
//               </div>
//             </div>
//           </section>

//           {/* 適性スポーツ TOP6 */}
//           <section className="px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">適性スポーツ TOP6</h2>
//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
//               {sportsTop6.length ? (
//                 sportsTop6.map((s, idx) => (
//                   <div key={`${s.sport}-${idx}`} className="rounded-xl border border-slate-200 px-4 py-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="text-sm font-extrabold text-slate-700">#{idx + 1}</div>
//                         <div className="text-xl">{s.emoji ?? "🏅"}</div>
//                         <div className="font-extrabold text-slate-900">{s.sport}</div>
//                       </div>
//                       <div className="text-xs font-bold text-slate-500">
//                         {s.score != null ? `${_fmt1(s.score)}pt` : ""}
//                       </div>
//                     </div>
//                     {s.reason ? <div className="mt-2 text-xs text-slate-600">{s.reason}</div> : null}
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
//                 trainings.slice(0, 4).map((t, idx) => (
//                   <div key={`${t.title}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="flex items-start justify-between gap-4">
//                       {/* 左側：テキスト */}
//                       <div className="flex-1 min-w-0">
//                         <div className="text-xs font-bold text-slate-500">
//                           重点：{t.ability_label ?? ""} {t.frequency ? ` / ${t.frequency}` : ""}
//                         </div>
//                         <div className="mt-1 text-lg font-extrabold text-slate-900">{t.title}</div>
//                         {t.desc ? <div className="mt-2 text-sm text-slate-700">{t.desc}</div> : null}
//                       </div>

//                       {/* 右側：画像 */}
//                       {t.image && (
//                         <div className="flex-shrink-0">
//                           <img 
//                             src={t.image} 
//                             alt={t.title} 
//                             className="w-28 h-28 object-contain rounded-lg border border-slate-200 bg-slate-50"
//                             loading="lazy"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-slate-500">トレーニング提案がありません。</div>
//               )}
//             </div>
//           </section>

//           {/* 6能力 */}
//           {abilities.length ? (
//             <section className="px-8 pb-8">
//               <h2 className="text-lg font-extrabold text-[#173b7a]">6能力スコア</h2>
//               <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
//                 {abilities.map((a, idx) => {
//                   const pct = Math.max(0, Math.min(100, Number(a.bar_pct ?? 0)));
//                   const tone = gradeToneFromPct(pct);
//                   return (
//                     <div key={`${a.key}-${idx}`} className="rounded-xl border border-slate-200 px-5 py-4">
//                       <div className="flex items-center justify-between">
//                         <div className="font-extrabold text-slate-900">{a.label ?? a.key}</div>
//                         <div className="text-xs text-slate-600">
//                           T <span className="font-bold tabular-nums">{_fmt1(a.t)}</span>
//                         </div>
//                       </div>
//                       <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
//                         <div
//                           className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                           style={{ width: `${pct}%` }}
//                         />
//                       </div>
//                       <div className="mt-2 text-xs text-slate-500">{tone.note}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>
//           ) : null}

//           {/* 測定結果（7種目） */}
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
//                           <th className="px-5 py-3">評価バー</th>
//                         </tr>
//                       </thead>

//                       <tbody className="divide-y divide-slate-100">
//                         {tests.map((t, idx) => {
//                           const pct = Math.max(0, Math.min(100, Number(t.bar_pct ?? 0)));
//                           const tone = gradeToneFromPct(pct);
//                           const unit = t.unit ? String(t.unit) : "";
//                           return (
//                             <tr key={`${t.key}-${idx}`} className="hover:bg-slate-50/60">
//                               <td className="px-5 py-4">
//                                 <div className="font-semibold text-slate-900">{t.label ?? t.key}</div>
//                                 <div className="mt-1 text-xs text-slate-500">{t.key}</div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <div className="font-semibold tabular-nums text-slate-900">
//                                   {_fmtValue(t.value)}
//                                   {unit ? <span className="ml-1 text-sm font-medium text-slate-600">{unit}</span> : null}
//                                 </div>
//                               </td>

//                               <td className="px-5 py-4">
//                                 <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900">
//                                   {_fmt1(t.t)}
//                                 </span>
//                               </td>

//                               <td className="px-5 py-4 w-[420px]">
//                                 <div className="flex items-center gap-3">
//                                   <div className="h-2.5 w-full rounded-full bg-slate-100">
//                                     <div
//                                       className={cn("h-2.5 rounded-full bg-gradient-to-r", tone.barFrom, tone.barTo)}
//                                       style={{ width: `${pct}%` }}
//                                     />
//                                   </div>
//                                   <div className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
//                                     {pct}%
//                                   </div>
//                                 </div>
//                                 <div className="mt-2 text-xs text-slate-500">
//                                   {t.rank_label ?? tone.note}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
//                     ※ バーはAPIが返す <code>bar_pct</code>（0〜100）を表示しています
//                   </div>
//                 </div>
//               </div>
//             </section>
//           ) : null}

//           {/* 保護者向け / 1ヶ月目標 */}
//           {(guardianMsg || monthGoal) ? (
//             <section className="px-8 pb-10">
//               {guardianMsg ? (
//                 <>
//                   <h2 className="text-lg font-extrabold text-[#173b7a]">保護者向けコメント</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800">
//                     {guardianMsg}
//                   </div>
//                 </>
//               ) : null}

//               {monthGoal ? (
//                 <>
//                   <h2 className="mt-8 text-lg font-extrabold text-[#173b7a]">最初の1ヶ月の目標</h2>
//                   <div className="mt-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800">
//                     {monthGoal}
//                   </div>
//                 </>
//               ) : null}
//             </section>
//           ) : null}

//           {/* フッター */}
//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 本レポートは入力された測定値に基づく推定結果です。ケガや痛みがある場合は無理をせず、専門家に相談してください。
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Patient = {
  id: number;
  last_name: string;
  first_name: string;
  birth_date: string; // YYYY-MM-DD
  sex: "male" | "female";
  school_name?: string | null;
};

type FormState = {
  measured_at: string;
  event_name: string;
  
  height_cm: string;
  weight_kg: string;

  grip_best_kg: string;
  standing_jump_cm: string;
  dash_15m_sec: string;
  continuous_jump_cm: string;

  squat_30s_cnt: string;
  side_step_20s_cnt: string;
  ball_throw_m: string;
};

const initialState: FormState = {
  measured_at: new Date().toISOString().slice(0, 10),
  event_name: "",
  
  height_cm: "",
  weight_kg: "",
  grip_best_kg: "",
  standing_jump_cm: "",
  dash_15m_sec: "",
  continuous_jump_cm: "",
  squat_30s_cnt: "",
  side_step_20s_cnt: "",
  ball_throw_m: "",
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function formatSex(sex: Patient["sex"]) {
  return sex === "male" ? "男子" : "女子";
}

function calcAgeYMD(birthDateStr: string) {
  const [y, m, d] = birthDateStr.split("-").map((x) => Number(x));
  const bd = new Date(y, (m ?? 1) - 1, d ?? 1);

  const now = new Date();
  let years = now.getFullYear() - bd.getFullYear();
  let months = now.getMonth() - bd.getMonth();
  if (now.getDate() < bd.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return { years: 0, months: 0, label: "-" };
  return { years, months, label: `${years}歳${months}ヶ月` };
}

function sanitizeFloatInput(raw: string) {
  return raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}
function sanitizeIntInput(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

function toFloat(s: string) {
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}
function toInt(s: string) {
  if (!/^\d+$/.test(s)) return NaN;
  const v = Number(s);
  return Number.isInteger(v) ? v : NaN;
}

export default function MeasurePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

  const [clinicName, setClinicName] = useState<string>("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const cname = localStorage.getItem("clinic_name") ?? "";
    const pid = sp.get("patient_id");

    if (!token) {
      router.push("/login");
      return;
    }
    if (!pid) {
      router.push("/patients");
      return;
    }

    setClinicName(cname);
    setPatientId(pid);

    const fetchPatient = async () => {
      try {
        setLoadingPatient(true);
        setError(null);

        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です（web/.env.local を確認してください）");

        const res = await fetch(`${base}/patients/${encodeURIComponent(pid)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const txt = await res.text().catch(() => "");
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("access_token");
            router.push("/login");
            return;
          }
          throw new Error(txt || `受検者情報の取得に失敗しました (HTTP ${res.status})`);
        }

        const p = JSON.parse(txt) as Patient;
        setPatient(p);
      } catch (e: any) {
        setPatient(null);
        setError(e?.message ?? "不明なエラーが発生しました");
      } finally {
        setLoadingPatient(false);
      }
    };

    fetchPatient();
  }, [router, sp]);

  const update = <K extends keyof FormState>(k: K, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const validate = () => {
    const labels: Record<keyof FormState, string> = {
      measured_at: "測定日",
      event_name: "測定イベント",
      height_cm: "身長（cm）",
      weight_kg: "体重（kg）",
      grip_best_kg: "握力（kg）",
      standing_jump_cm: "立ち幅跳び（cm）",
      dash_15m_sec: "15m走（秒）",
      continuous_jump_cm: "連続立ち幅跳び（cm）",
      squat_30s_cnt: "30秒スクワット（回）",
      side_step_20s_cnt: "反復横跳び（回）",
      ball_throw_m: "ボール投げ（m）",
    };

    if (!form.measured_at.trim()) {
      setError("測定日を入力してください");
      return false;
    }

    const required: (keyof FormState)[] = [
      "grip_best_kg",
      "standing_jump_cm",
      "dash_15m_sec",
      "continuous_jump_cm",
      "squat_30s_cnt",
      "side_step_20s_cnt",
      "ball_throw_m",
    ];

    const missing = required.filter((k) => String(form[k]).trim() === "").map((k) => labels[k]);
    if (missing.length) {
      setError(`未入力があります：${missing.join("、")}`);
      return false;
    }

    const floatKeys: (keyof FormState)[] = [
      "height_cm",
      "weight_kg",
      "grip_best_kg",
      "standing_jump_cm",
      "dash_15m_sec",
      "continuous_jump_cm",
      "ball_throw_m",
    ];
    for (const k of floatKeys) {
      const s = form[k].trim();
      if (!s) continue;
      const v = toFloat(s);
      if (!Number.isFinite(v)) {
        setError(`${labels[k]} は数値で入力してください`);
        return false;
      }
      if (v < 0) {
        setError(`${labels[k]} は0以上で入力してください`);
        return false;
      }
    }

    const intKeys: (keyof FormState)[] = ["squat_30s_cnt", "side_step_20s_cnt"];
    for (const k of intKeys) {
      const v = toInt(form[k].trim());
      if (!Number.isFinite(v)) {
        setError(`${labels[k]} は整数で入力してください`);
        return false;
      }
      if (v < 0) {
        setError(`${labels[k]} は0以上で入力してください`);
        return false;
      }
    }

    if (toFloat(form.dash_15m_sec.trim()) <= 0) {
      setError("15m走（秒）は 0 より大きい値で入力してください");
      return false;
    }

    if (!patient) {
      setError("受検者情報を取得できていません（少し待ってから再実行してください）");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!patientId) return;

    if (!apiBase) {
      setError("NEXT_PUBLIC_API_BASE_URL が未設定です（.env.local を確認）");
      return;
    }
    if (!validate()) return;
    if (!patient) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const gripBest = toFloat(form.grip_best_kg.trim());
      const standingJump = toFloat(form.standing_jump_cm.trim());
      const dash15 = toFloat(form.dash_15m_sec.trim());
      const continuousJump = toFloat(form.continuous_jump_cm.trim());
      const squat30 = toInt(form.squat_30s_cnt.trim());
      const sideStep20 = toInt(form.side_step_20s_cnt.trim());
      const ballThrow = toFloat(form.ball_throw_m.trim());

      const payload: Record<string, any> = {
        patient_id: Number(patientId),
        
        measured_at: form.measured_at.trim() || new Date().toISOString().slice(0, 10),
        ...(form.event_name.trim() ? { event_name: form.event_name.trim() } : {}),

        ...(form.height_cm.trim() ? { height_cm: toFloat(form.height_cm.trim()) } : {}),
        ...(form.weight_kg.trim() ? { weight_kg: toFloat(form.weight_kg.trim()) } : {}),

        grip_right: gripBest,
        grip_left: gripBest,
        standing_jump: standingJump,
        dash_15m_sec: dash15,
        continuous_standing_jump: continuousJump,
        squat_30s: squat30,
        side_step: sideStep20,
        ball_throw: ballThrow,
      };

      const res = await fetch(`${apiBase}/diagnose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const txt = await res.text().catch(() => "");

      if (!res.ok) {
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j?.detail ?? txt;
        } catch {}
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }
        throw new Error(msg || `診断に失敗しました (HTTP ${res.status})`);
      }

      const data = txt ? JSON.parse(txt) : null;

      const enriched = {
        ...(data ?? {}),
        meta: {
          ...(data?.meta ?? {}),
          measured_at: payload.measured_at,
          event_name: payload.event_name ?? null,
        },
        user: {
          ...(data?.user ?? {}),
          height_cm: payload.height_cm ?? data?.user?.height_cm ?? null,
          weight_kg: payload.weight_kg ?? data?.user?.weight_kg ?? null,
          sex: data?.summary?.sex ?? data?.user?.sex ?? null,
        },
      };

      sessionStorage.setItem("diagnose_result", JSON.stringify(enriched));
      router.push("/result");
    } catch (e: any) {
      setError(e?.message ?? "不明なエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between text-white/85">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/patients")}
          >
            ← 受検者一覧に戻る
          </button>

          <div className="text-right">
            <div className="text-xs text-white/60">Athletiq Clinic Console</div>
            <div className="text-sm font-semibold text-white/80">
              {clinicName}{" "}
              {patientId ? <span className="text-white/60">/ patient_id: {patientId}</span> : null}
            </div>
          </div>
        </div>

        {/* 受検者カード */}
        {loadingPatient ? (
          <div className="mt-3 text-sm text-white/70">受検者情報を読み込み中…</div>
        ) : patient ? (
          <div className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-white/90 ring-1 ring-white/15">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="font-extrabold">
                {patient.last_name} {patient.first_name}
                <span className="ml-2 text-sm font-semibold text-white/70">（{formatSex(patient.sex)}）</span>
              </div>
              <div className="text-sm text-white/80">
                生年月日：{patient.birth_date}
                <span className="mx-2 text-white/30">|</span>
                年齢：{calcAgeYMD(patient.birth_date).label}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-white/70">受検者情報を取得できませんでした</div>
        )}

        <div className="mt-4 rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* 基本情報 */}
          <section className="border-b px-8 py-6">
            <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">基本情報</h2>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {/* 測定日・イベント名 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="測定日" note="必須">
                <input
                  type="date"
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={form.measured_at}
                  onChange={(e) => update("measured_at", e.target.value)}
                />
              </Field>

              <Field label="測定イベント" note="任意">
                <input
                  type="text"
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  placeholder="例：春季測定会"
                  value={form.event_name}
                  onChange={(e) => update("event_name", e.target.value)}
                />
              </Field>
            </div>

            {/* 身長・体重（任意入力） */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="身長（cm）" note="任意">
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  inputMode="decimal"
                  placeholder="例：135.5"
                  value={form.height_cm}
                  onChange={(e) => update("height_cm", sanitizeFloatInput(e.target.value))}
                />
              </Field>

              <Field label="体重（kg）" note="任意">
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  inputMode="decimal"
                  placeholder="例：32.4"
                  value={form.weight_kg}
                  onChange={(e) => update("weight_kg", sanitizeFloatInput(e.target.value))}
                />
              </Field>
            </div>
          </section>

          {/* 測定項目 */}
          <section className="border-b px-8 py-6">
            <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">測定項目</h2>

            <div className="space-y-4">
              <InputFloat
                label="握力"
                note="左右どちらか高い方1回（kg）"
                placeholder="例：22.0"
                value={form.grip_best_kg}
                onChange={(v) => update("grip_best_kg", v)}
              />
              <InputFloat
                label="立ち幅跳び"
                note="両足同時踏切（cm）"
                placeholder="例：155"
                value={form.standing_jump_cm}
                onChange={(v) => update("standing_jump_cm", v)}
              />
              <InputFloat
                label="15m走"
                note="立ちスタート（秒）"
                placeholder="例：3.10"
                value={form.dash_15m_sec}
                onChange={(v) => update("dash_15m_sec", v)}
              />
              <InputFloat
                label="連続立ち幅跳び"
                note="連続3回の合計距離（cm）"
                placeholder="例：440"
                value={form.continuous_jump_cm}
                onChange={(v) => update("continuous_jump_cm", v)}
              />
              <InputInt
                label="30秒スクワット"
                note="30秒間の回数（回）"
                placeholder="例：27"
                value={form.squat_30s_cnt}
                onChange={(v) => update("squat_30s_cnt", v)}
              />
              <InputInt
                label="反復横跳び"
                note="20秒間（回）"
                placeholder="例：37"
                value={form.side_step_20s_cnt}
                onChange={(v) => update("side_step_20s_cnt", v)}
              />
              <InputFloat
                label="ボール投げ"
                note="利き手・助走なし（m）"
                placeholder="例：13.0"
                value={form.ball_throw_m}
                onChange={(v) => update("ball_throw_m", v)}
              />
            </div>
          </section>

          {/* 実行 */}
          <section className="px-8 py-8">
            <button
              disabled={saving}
              onClick={submit}
              className={cn(
                "w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-4 text-lg font-extrabold text-white shadow hover:opacity-90",
                saving && "opacity-60"
              )}
            >
              {saving ? "診断中..." : "診断を開始する"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-slate-800">{label}</label>
        {note ? <span className="text-xs text-slate-500">{note}</span> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function InputFloat({
  label,
  note,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  note: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-800">{label}</label>
        <span className="text-xs text-slate-500">{note}</span>
      </div>
      <input
        inputMode="decimal"
        className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(sanitizeFloatInput(e.target.value))}
      />
    </div>
  );
}

function InputInt({
  label,
  note,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  note: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-800">{label}</label>
        <span className="text-xs text-slate-500">{note}</span>
      </div>
      <input
        inputMode="numeric"
        className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(sanitizeIntInput(e.target.value))}
      />
    </div>
  );
}