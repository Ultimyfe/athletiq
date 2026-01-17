// // web/src/app/page.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { MOCK_RESULT } from "@/lib/mockResult";

// type FormState = {
//   name: string;
//   age: string;
//   sex: "male" | "female" | "";
//   height: string;
//   weight: string;

//   grip: string;
//   standing_jump: string;
//   dash_15m_sec: string;
//   continuous_standing_jump: string;
//   squat_30s: string;
//   side_step: string;
//   ball_throw: string;
// };

// const initialState: FormState = {
//   name: "",
//   age: "",
//   sex: "",
//   height: "",
//   weight: "",
//   grip: "",
//   standing_jump: "",
//   dash_15m_sec: "",
//   continuous_standing_jump: "",
//   squat_30s: "",
//   side_step: "",
//   ball_throw: "",
// };

// export default function Home() {
//   const [form, setForm] = useState<FormState>(initialState);
//   const router = useRouter();

//   function update<K extends keyof FormState>(key: K, value: string) {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   }

//   function validate() {
//     const labels: Record<keyof FormState, string> = {
//       name: "受検者名",
//       age: "年齢",
//       sex: "性別",
//       height: "身長",
//       weight: "体重",
//       grip: "握力",
//       standing_jump: "立ち幅跳び",
//       dash_15m_sec: "15m走",
//       continuous_standing_jump: "連続立ち幅跳び",
//       squat_30s: "30秒スクワット",
//       side_step: "反復横跳び",
//       ball_throw: "ボール投げ",
//     };

//     const missing = Object.entries(form)
//       .filter(([, v]) => String(v).trim() === "")
//       .map(([k]) => labels[k as keyof FormState]);

//     if (missing.length) {
//       alert(`未入力の項目があります：\n${missing.join("、")}`);
//       return false;
//     }
//     return true;
//   }

//   function handleSubmit() {
//     if (!validate()) return;

//     // ✅ 完成に直結：結果ページが読む sessionStorage を必ず作る
//     const result = {
//       ...MOCK_RESULT,
//       user: {
//         ...MOCK_RESULT.user,
//         display_name: form.name,
//         sex: form.sex || MOCK_RESULT.user.sex,
//         height_cm: Number(form.height),
//         weight_kg: Number(form.weight),
//         school_grade_label: `${form.age}歳`,
//       },
//       // ※ まだロジック未実装なので、tests/abilities は MOCK のまま表示確認だけ通す
//       // 将来ここを API の結果で置き換えるだけで移行完了
//     };

//     sessionStorage.setItem("diagnose_result", JSON.stringify(result));

//     router.push("/result");
//   }

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
//       <div className="mx-auto w-full max-w-4xl">
//         <div className="mb-6 text-center text-white">
//           <h1 className="text-2xl font-extrabold">運動能力診断</h1>
//           <p className="mt-1 text-sm text-white/70">Athletic Performance Assessment</p>
//         </div>

//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           <section className="border-b px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">基本情報</h2>

//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <input className="field-input" placeholder="受検者名" value={form.name} onChange={(e) => update("name", e.target.value)} />
//               <input className="field-input" type="number" placeholder="年齢（歳）" value={form.age} onChange={(e) => update("age", e.target.value)} />

//               <select className="field-input" value={form.sex} onChange={(e) => update("sex", e.target.value)}>
//                 <option value="">性別</option>
//                 <option value="male">男子</option>
//                 <option value="female">女子</option>
//               </select>

//               <input className="field-input" type="number" placeholder="身長（cm）" value={form.height} onChange={(e) => update("height", e.target.value)} />
//               <input className="field-input" type="number" placeholder="体重（kg）" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
//             </div>
//           </section>

//           <section className="border-b px-8 py-6">
//             <h2 className="mb-4 text-lg font-extrabold text-[#173b7a]">測定項目</h2>

//             <div className="space-y-4">
//               <Input label="握力" note="良い方1回（kg）" value={form.grip} onChange={(v) => update("grip", v)} />
//               <Input label="立ち幅跳び" note="両足同時踏切（cm）" value={form.standing_jump} onChange={(v) => update("standing_jump", v)} />
//               <Input label="15m走" note="立ちスタート（秒）" value={form.dash_15m_sec} onChange={(v) => update("dash_15m_sec", v)} />
//               <Input label="連続立ち幅跳び" note="連続2回の合計距離（cm）" value={form.continuous_standing_jump} onChange={(v) => update("continuous_standing_jump", v)} />
//               <Input label="30秒スクワット" note="30秒間の回数（回）" value={form.squat_30s} onChange={(v) => update("squat_30s", v)} />
//               <Input label="反復横跳び" note="20秒間（回）" value={form.side_step} onChange={(v) => update("side_step", v)} />
//               <Input label="ボール投げ" note="利き手・助走なし（m）" value={form.ball_throw} onChange={(v) => update("ball_throw", v)} />
//             </div>
//           </section>

//           <section className="px-8 py-8">
//             <button
//               onClick={handleSubmit}
//               className="w-full rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] py-4 text-lg font-extrabold text-white shadow hover:opacity-90"
//             >
//               診断を開始する
//             </button>
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

// function Input({
//   label,
//   note,
//   value,
//   onChange,
// }: {
//   label: string;
//   note: string;
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
//         type="number"
//         className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       />
//     </div>
//   );
// }

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const cid = localStorage.getItem("clinic_id");
    if (cid) router.replace("/patients");
    else router.replace("/login");
  }, [router]);

  // 一瞬だけ表示（遷移待ち）
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl text-white/70">
        読み込み中…
      </div>
    </main>
  );
}