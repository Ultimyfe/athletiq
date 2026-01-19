// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// type Patient = {
//   id: number;
//   last_name: string;
//   first_name: string;
//   birth_date: string; // YYYY-MM-DD
//   sex: "male" | "female";
//   school_name?: string | null;
// };

// type FormState = {
//   height_cm: string; // float (optional)
//   weight_kg: string; // float (optional)

//   grip_best_kg: string; // float（左右どちらか高い方）
//   standing_jump_cm: string; // float
//   dash_15m_sec: string; // float
//   continuous_jump_cm: string; // float

//   squat_30s_cnt: string; // int
//   side_step_20s_cnt: string; // int
//   ball_throw_m: string; // float
// };

// const initialState: FormState = {
//   height_cm: "",
//   weight_kg: "",
//   grip_best_kg: "",
//   standing_jump_cm: "",
//   dash_15m_sec: "",
//   continuous_jump_cm: "",
//   squat_30s_cnt: "",
//   side_step_20s_cnt: "",
//   ball_throw_m: "",
// };

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// function formatSex(sex: Patient["sex"]) {
//   return sex === "male" ? "男子" : "女子";
// }

// function calcAgeYMD(birthDateStr: string) {
//   const [y, m, d] = birthDateStr.split("-").map((x) => Number(x));
//   const bd = new Date(y, (m ?? 1) - 1, d ?? 1);

//   const now = new Date();
//   let years = now.getFullYear() - bd.getFullYear();
//   let months = now.getMonth() - bd.getMonth();
//   if (now.getDate() < bd.getDate()) months -= 1;
//   if (months < 0) {
//     years -= 1;
//     months += 12;
//   }
//   if (years < 0) return { years: 0, months: 0, label: "-" };
//   return { years, months, label: `${years}歳${months}ヶ月` };
// }

// function sanitizeFloatInput(raw: string) {
//   // 半角数字 + 小数点のみ
//   return raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
// }
// function sanitizeIntInput(raw: string) {
//   return raw.replace(/[^\d]/g, "");
// }

// function toFloat(s: string) {
//   const v = Number(s);
//   return Number.isFinite(v) ? v : NaN;
// }
// function toInt(s: string) {
//   if (!/^\d+$/.test(s)) return NaN;
//   const v = Number(s);
//   return Number.isInteger(v) ? v : NaN;
// }

// export default function MeasurePage() {
//   const router = useRouter();
//   const sp = useSearchParams();
//   const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

//   const [clinicId, setClinicId] = useState<string | null>(null);
//   const [clinicName, setClinicName] = useState<string>("");
//   const [patientId, setPatientId] = useState<string | null>(null);
//   const [patient, setPatient] = useState<Patient | null>(null);

//   const [form, setForm] = useState<FormState>(initialState);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

// //   useEffect(() => {
// //     const cid = localStorage.getItem("clinic_id");
// //     const cname = localStorage.getItem("clinic_name") ?? "";
// //     const pid = sp.get("patient_id");

// //     if (!cid) {
// //       router.push("/login");
// //       return;
// //     }
// //     if (!pid) {
// //       router.push("/patients");
// //       return;
// //     }

// //     setClinicId(cid);
// //     setClinicName(cname);
// //     setPatientId(pid);

// //     const fetchPatient = async () => {
// //       try {
// //         setError(null);
// //         const base = process.env.NEXT_PUBLIC_API_BASE_URL;
// //         if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");

// //         const res = await fetch(`${base}/patients?clinic_id=${cid}`, {
// //           method: "GET",
// //           headers: { "Content-Type": "application/json" },
// //         });
// //         if (!res.ok) {
// //           const txt = await res.text().catch(() => "");
// //           throw new Error(txt || `患者一覧の取得に失敗しました (HTTP ${res.status})`);
// //         }

// //         const data = await res.json();
// //         const items: Patient[] = Array.isArray(data.items) ? data.items : [];
// //         const found = items.find((p) => String(p.id) === String(pid)) ?? null;
// //         setPatient(found);
// //       } catch (e: any) {
// //         setError(e?.message ?? "不明なエラーが発生しました");
// //       }
// //     };

// //     fetchPatient();
// //   }, [router, sp]);

//     useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     const cname = localStorage.getItem("clinic_name") ?? "";
//     const pid = sp.get("patient_id");

//     if (!token) {
//         router.push("/login");
//         return;
//     }
//     if (!pid) {
//         router.push("/patients");
//         return;
//     }

//     setClinicName(cname);
//     setPatientId(pid);

//     const fetchPatient = async () => {
//         try {
//         setError(null);
//         const base = process.env.NEXT_PUBLIC_API_BASE_URL;
//         if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");

//         const res = await fetch(`${base}/patients/${encodeURIComponent(pid)}`, {
//             method: "GET",
//             headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//             },
//             cache: "no-store",
//         });

//         if (!res.ok) {
//             const txt = await res.text().catch(() => "");
//             if (res.status === 401 || res.status === 403) {
//             localStorage.removeItem("access_token");
//             router.push("/login");
//             return;
//             }
//             throw new Error(txt || `患者情報の取得に失敗しました (HTTP ${res.status})`);
//         }

//         const p = (await res.json()) as Patient;
//         setPatient(p);
//         } catch (e: any) {
//         setError(e?.message ?? "不明なエラーが発生しました");
//         }
//     };

//     fetchPatient();
//     }, [router, sp]);

//   const update = <K extends keyof FormState>(k: K, v: string) => {
//     setForm((prev) => ({ ...prev, [k]: v }));
//   };

//   const validate = () => {
//     const labels: Record<keyof FormState, string> = {
//       height_cm: "身長（cm）",
//       weight_kg: "体重（kg）",
//       grip_best_kg: "握力（kg）",
//       standing_jump_cm: "立ち幅跳び（cm）",
//       dash_15m_sec: "15m走（秒）",
//       continuous_jump_cm: "連続立ち幅跳び（cm）",
//       squat_30s_cnt: "30秒スクワット（回）",
//       side_step_20s_cnt: "反復横跳び（回）",
//       ball_throw_m: "ボール投げ（m）",
//     };

//     const required: (keyof FormState)[] = [
//       "grip_best_kg",
//       "standing_jump_cm",
//       "dash_15m_sec",
//       "continuous_jump_cm",
//       "squat_30s_cnt",
//       "side_step_20s_cnt",
//       "ball_throw_m",
//     ];

//     const missing = required.filter((k) => String(form[k]).trim() === "").map((k) => labels[k]);
//     if (missing.length) {
//       setError(`未入力があります：${missing.join("、")}`);
//       return false;
//     }

//     // 数値チェック
//     const floatKeys: (keyof FormState)[] = [
//       "height_cm",
//       "weight_kg",
//       "grip_best_kg",
//       "standing_jump_cm",
//       "dash_15m_sec",
//       "continuous_jump_cm",
//       "ball_throw_m",
//     ];
//     for (const k of floatKeys) {
//       const s = form[k].trim();
//       if (!s) continue; // optional
//       const v = toFloat(s);
//       if (!Number.isFinite(v)) {
//         setError(`${labels[k]} は数値で入力してください`);
//         return false;
//       }
//       if (v < 0) {
//         setError(`${labels[k]} は0以上で入力してください`);
//         return false;
//       }
//     }

//     const intKeys: (keyof FormState)[] = ["squat_30s_cnt", "side_step_20s_cnt"];
//     for (const k of intKeys) {
//       const v = toInt(form[k].trim());
//       if (!Number.isFinite(v)) {
//         setError(`${labels[k]} は整数で入力してください`);
//         return false;
//       }
//       if (v < 0) {
//         setError(`${labels[k]} は0以上で入力してください`);
//         return false;
//       }
//     }

//     if (toFloat(form.dash_15m_sec.trim()) <= 0) {
//       setError("15m走（秒）は 0 より大きい値で入力してください");
//       return false;
//     }

//     if (!patient) {
//       setError("患者情報を取得できていません（少し待ってから再実行してください）");
//       return false;
//     }

//     return true;
//   };

//   const submit = async () => {
//     if (!clinicId || !patientId) return;
//     if (!apiBase) {
//       setError("NEXT_PUBLIC_API_BASE_URL が未設定です（.env.local を確認）");
//       return;
//     }
//     if (!validate()) return;
//     if (!patient) return;

//     setSaving(true);
//     setError(null);

//     try {
//       // 必須値（validate済みの前提）
//       const gripBest = toFloat(form.grip_best_kg.trim());
//       const standingJump = toFloat(form.standing_jump_cm.trim());
//       const dash15 = toFloat(form.dash_15m_sec.trim());
//       const continuousJump = toFloat(form.continuous_jump_cm.trim());
//       const squat30 = toInt(form.squat_30s_cnt.trim());
//       const sideStep20 = toInt(form.side_step_20s_cnt.trim());
//       const ballThrow = toFloat(form.ball_throw_m.trim());

//       // ★ API(scoring_service.py) に合わせる（age/sexは送らない：APIがpatientsから算出）
//     //   const payload: Record<string, any> = {
//     //     clinic_id: Number(clinicId),
//     //     patient_id: Number(patientId),

//     //     // optional
//     //     ...(form.height_cm.trim() ? { height_cm: toFloat(form.height_cm.trim()) } : {}),
//     //     ...(form.weight_kg.trim() ? { weight_kg: toFloat(form.weight_kg.trim()) } : {}),

//     //     // 必須（API互換）
//     //     grip_right: gripBest,
//     //     grip_left: gripBest, // UIは「強い方1回」なので同値でOK（API側がmaxを取る）
//     //     standing_jump: standingJump,
//     //     dash_15m_sec: dash15,
//     //     continuous_standing_jump: continuousJump,
//     //     squat_30s: squat30,
//     //     side_step: sideStep20,
//     //     ball_throw: ballThrow,
//     //   };

//     //   console.log("[measure] POST /diagnose payload =", payload);

//     //   const res = await fetch(`${apiBase}/diagnose`, {
//     //     method: "POST",
//     //     headers: { "Content-Type": "application/json" },
//     //     body: JSON.stringify(payload),
//     //   });

//     const token = localStorage.getItem("access_token");
//     if (!token) { router.push("/login"); return; }

//     // payload から clinic_id を消す
//     const payload: Record<string, any> = {
//     patient_id: Number(patientId),
//     ...(form.height_cm.trim() ? { height_cm: toFloat(form.height_cm.trim()) } : {}),
//     ...(form.weight_kg.trim() ? { weight_kg: toFloat(form.weight_kg.trim()) } : {}),
//     grip_right: gripBest,
//     grip_left: gripBest,
//     standing_jump: standingJump,
//     dash_15m_sec: dash15,
//     continuous_standing_jump: continuousJump,
//     squat_30s: squat30,
//     side_step: sideStep20,
//     ball_throw: ballThrow,
//     };

//     const res = await fetch(`${apiBase}/diagnose`, {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//     });

//       // 400でも本文を吐く
//       const txt = await res.text().catch(() => "");
//       console.log("[measure] /diagnose status =", res.status);
//       console.log("[measure] /diagnose raw body =", txt);

//       if (!res.ok) {
//         let msg = txt;
//         try {
//           const j = JSON.parse(txt);
//           msg = j?.detail ?? txt;
//         } catch {}
//         throw new Error(msg || `診断に失敗しました (HTTP ${res.status})`);
//       }

//       const data = txt ? JSON.parse(txt) : null;

//       // resultページで確実に表示できるように、最低限の表示用情報を補強
//       const enriched = {
//         ...(data ?? {}),
//         meta: {
//           ...(data?.meta ?? {}),
//           measured_at: (data?.meta?.measured_at ?? new Date().toISOString().slice(0, 10)),
//         },
//         user: {
//           ...(data?.user ?? {}),
//           height_cm: payload.height_cm ?? data?.user?.height_cm ?? null,
//           weight_kg: payload.weight_kg ?? data?.user?.weight_kg ?? null,
//           sex: data?.summary?.sex ?? data?.user?.sex ?? null,
//         },
//       };

//       sessionStorage.setItem("diagnose_result", JSON.stringify(enriched));
//       router.push("/result");
//     } catch (e: any) {
//       setError(e?.message ?? "不明なエラーが発生しました");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
//       <div className="mx-auto w-full max-w-4xl">
//         {/* ヘッダー */}
//         <div className="mb-6 flex items-center justify-between text-white/85">
//           <button className="rounded-full px-3 py-2 text-sm hover:bg-white/10" onClick={() => router.push("/patients")}>
//             ← 患者一覧に戻る
//           </button>

//           <div className="text-right">
//             <div className="text-xs text-white/60">Athletiq Clinic Console</div>
//             <div className="text-sm font-semibold text-white/80">
//               {clinicName} {patientId ? <span className="text-white/60">/ patient_id: {patientId}</span> : null}
//             </div>
//           </div>
//         </div>

//         {patient ? (
//           <div className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-white/90 ring-1 ring-white/15">
//             <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
//               <div className="font-extrabold">
//                 {patient.last_name} {patient.first_name}
//                 <span className="ml-2 text-sm font-semibold text-white/70">（{formatSex(patient.sex)}）</span>
//               </div>
//               <div className="text-sm text-white/80">
//                 生年月日：{patient.birth_date}
//                 <span className="mx-2 text-white/30">|</span>
//                 年齢：{calcAgeYMD(patient.birth_date).label}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="mt-3 text-sm text-white/70">患者情報を読み込み中…</div>
//         )}

//         <div className="mt-4 rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           {/* 基本情報 */}
//             {/* 基本情報 */}
//             <section className="border-b px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">基本情報</h2>

//             {error ? (
//                 <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//                 {error}
//                 </div>
//             ) : null}

//             {/* 受検者情報（API連携：patients） */}
//             <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
//                 <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">受検者名</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                     {patient ? `${patient.last_name} ${patient.first_name}` : "—"}
//                 </div>
//                 </div>

//                 <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
//                 <div className="text-xs font-bold text-slate-600">年齢</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                     {patient ? calcAgeYMD(patient.birth_date).label : "—"}
//                 </div>
//                 </div>

//                 <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
//                 <div className="text-xs font-bold text-slate-600">性別</div>
//                 <div className="mt-1 text-base font-extrabold text-slate-900">
//                     {patient ? formatSex(patient.sex) : "—"}
//                 </div>
//                 </div>
//             </div>

//             {/* 身長・体重（任意入力） */}
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                 <Field label="身長（cm）" note="任意">
//                 <input
//                     className="field-input"
//                     inputMode="decimal"
//                     placeholder="例：135.5"
//                     value={form.height_cm}
//                     onChange={(e) => update("height_cm", sanitizeFloatInput(e.target.value))}
//                 />
//                 </Field>

//                 <Field label="体重（kg）" note="任意">
//                 <input
//                     className="field-input"
//                     inputMode="decimal"
//                     placeholder="例：32.4"
//                     value={form.weight_kg}
//                     onChange={(e) => update("weight_kg", sanitizeFloatInput(e.target.value))}
//                 />
//                 </Field>
//             </div>
//             </section>

//           {/* 測定項目 */}
//           <section className="border-b px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">測定項目</h2>

//             <div className="space-y-4">
//               <InputFloat label="握力" note="左右どちらか高い方1回（kg）" placeholder="例：22.0" value={form.grip_best_kg} onChange={(v) => update("grip_best_kg", v)} />
//               <InputFloat label="立ち幅跳び" note="両足同時踏切（cm）" placeholder="例：155" value={form.standing_jump_cm} onChange={(v) => update("standing_jump_cm", v)} />
//               <InputFloat label="15m走" note="立ちスタート（秒）" placeholder="例：3.10" value={form.dash_15m_sec} onChange={(v) => update("dash_15m_sec", v)} />
//               <InputFloat label="連続立ち幅跳び" note="連続2回の合計距離（cm）" placeholder="例：440" value={form.continuous_jump_cm} onChange={(v) => update("continuous_jump_cm", v)} />
//               <InputInt label="30秒スクワット" note="30秒間の回数（回）" placeholder="例：27" value={form.squat_30s_cnt} onChange={(v) => update("squat_30s_cnt", v)} />
//               <InputInt label="反復横跳び" note="20秒間（回）" placeholder="例：37" value={form.side_step_20s_cnt} onChange={(v) => update("side_step_20s_cnt", v)} />
//               <InputFloat label="ボール投げ" note="利き手・助走なし（m）" placeholder="例：13.0" value={form.ball_throw_m} onChange={(v) => update("ball_throw_m", v)} />
//             </div>
//           </section>

//           {/* 実行 */}
//           <section className="px-8 py-8">
//             <button
//               disabled={saving}
//               onClick={submit}
//               className={cn(
//                 "w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-4 text-lg font-extrabold text-white shadow hover:opacity-90",
//                 saving && "opacity-60"
//               )}
//             >
//               診断を開始する
//             </button>
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

// function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <div className="flex items-center justify-between">
//         <label className="text-sm font-extrabold text-slate-800">{label}</label>
//         {note ? <span className="text-xs text-slate-500">{note}</span> : null}
//       </div>
//       <div className="mt-1">{children}</div>
//     </div>
//   );
// }

// function InputFloat({
//   label,
//   note,
//   placeholder,
//   value,
//   onChange,
// }: {
//   label: string;
//   note: string;
//   placeholder?: string;
//   value: string;
//   onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <div className="flex items-center justify-between">
//         <label className="font-semibold text-slate-800">{label}</label>
//         <span className="text-xs text-slate-500">{note}</span>
//       </div>
//       <input
//         inputMode="decimal"
//         className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(sanitizeFloatInput(e.target.value))}
//       />
//     </div>
//   );
// }

// function InputInt({
//   label,
//   note,
//   placeholder,
//   value,
//   onChange,
// }: {
//   label: string;
//   note: string;
//   placeholder?: string;
//   value: string;
//   onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <div className="flex items-center justify-between">
//         <label className="font-semibold text-slate-800">{label}</label>
//         <span className="text-xs text-slate-500">{note}</span>
//       </div>
//       <input
//         inputMode="numeric"
//         className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(sanitizeIntInput(e.target.value))}
//       />
//     </div>
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
  height_cm: string; // float (optional)
  weight_kg: string; // float (optional)

  grip_best_kg: string; // float（左右どちらか高い方）
  standing_jump_cm: string; // float
  dash_15m_sec: string; // float
  continuous_jump_cm: string; // float

  squat_30s_cnt: string; // int
  side_step_20s_cnt: string; // int
  ball_throw_m: string; // float
};

const initialState: FormState = {
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
  // 半角数字 + 小数点のみ
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
          throw new Error(txt || `患者情報の取得に失敗しました (HTTP ${res.status})`);
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

    // 数値チェック（float）
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
      if (!s) continue; // optional
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

    // 数値チェック（int）
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
      setError("患者情報を取得できていません（少し待ってから再実行してください）");
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
      // 必須値（validate済み）
      const gripBest = toFloat(form.grip_best_kg.trim());
      const standingJump = toFloat(form.standing_jump_cm.trim());
      const dash15 = toFloat(form.dash_15m_sec.trim());
      const continuousJump = toFloat(form.continuous_jump_cm.trim());
      const squat30 = toInt(form.squat_30s_cnt.trim());
      const sideStep20 = toInt(form.side_step_20s_cnt.trim());
      const ballThrow = toFloat(form.ball_throw_m.trim());

      // ✅ clinic_id を送らない（JWT由来に統一）
      const payload: Record<string, any> = {
        patient_id: Number(patientId),

        ...(form.height_cm.trim() ? { height_cm: toFloat(form.height_cm.trim()) } : {}),
        ...(form.weight_kg.trim() ? { weight_kg: toFloat(form.weight_kg.trim()) } : {}),

        // API互換
        grip_right: gripBest,
        grip_left: gripBest, // UIは「強い方1回」なので同値でOK
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

      // resultページで確実に表示できるように補強
      const enriched = {
        ...(data ?? {}),
        meta: {
          ...(data?.meta ?? {}),
          measured_at: data?.meta?.measured_at ?? new Date().toISOString().slice(0, 10),
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
            ← 患者一覧に戻る
          </button>

          <div className="text-right">
            <div className="text-xs text-white/60">Athletiq Clinic Console</div>
            <div className="text-sm font-semibold text-white/80">
              {clinicName}{" "}
              {patientId ? <span className="text-white/60">/ patient_id: {patientId}</span> : null}
            </div>
          </div>
        </div>

        {/* 患者カード */}
        {loadingPatient ? (
          <div className="mt-3 text-sm text-white/70">患者情報を読み込み中…</div>
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
          <div className="mt-3 text-sm text-white/70">患者情報を取得できませんでした</div>
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
                note="連続2回の合計距離（cm）"
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