"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

type SignupPayload = {
  clinic_name: string;
  postal_code: string;
  address: string;
  owner_name: string;
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  token_type?: string;
  clinic_id?: number;
  clinic_name?: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignupPayload>({
    clinic_name: "",
    postal_code: "",
    address: "",
    owner_name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const base = useMemo(() => {
    const b = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    return b.replace(/\/+$/, "");
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.clinic_name.trim() &&
      form.postal_code.trim() &&
      form.address.trim() &&
      form.owner_name.trim() &&
      form.email.trim() &&
      form.password.trim() &&
      form.password.length >= 8
    );
  }, [form]);

  const setField = (k: keyof SignupPayload, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setErr(null);
      setOkMsg(null);

      if (!canSubmit) {
        throw new Error("入力必須項目をご確認ください（パスワードは8文字以上）。");
      }

      const payload: SignupPayload = {
        ...form,
        postal_code: form.postal_code.replace(/\s/g, ""),
        email: form.email.trim(),
      };

      // 1) signup
      const res = await fetch(`${base}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.detail ? String(j.detail) : text;
        } catch {}
        throw new Error(`signup api error: ${res.status} ${msg}`);
      }

      // 2) signup直後に自動ログインして token を取得
      const loginRes = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      if (!loginRes.ok) {
        const text = await loginRes.text().catch(() => "");
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.detail ? String(j.detail) : text;
        } catch {}
        throw new Error(`login after signup failed: ${loginRes.status} ${msg}`);
      }

      const loginJson = (await loginRes.json()) as Partial<LoginResponse>;
      const token = String(loginJson?.access_token ?? "");

      if (!token) {
        throw new Error("ログイントークンが取得できませんでした（access_token が空です）。");
      }

      // 3) patients配下が参照するキー名で保存
      localStorage.setItem("access_token", token);

      // ※ patients/new 等で参照されるので、返ってくる場合は保存
      if (typeof loginJson.clinic_id === "number") {
        localStorage.setItem("clinic_id", String(loginJson.clinic_id));
      }
      if (typeof loginJson.clinic_name === "string") {
        localStorage.setItem("clinic_name", loginJson.clinic_name);
      }

      setOkMsg("登録が完了しました。受検者一覧へ移動します…");

      // 4) /patients へ
      setTimeout(() => {
        router.push("/patients");
      }, 400);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl">
        {/* ヘッダ */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/login")}
          >
            ← ログインへ
          </button>
          <div className="text-xs text-white/50">Athletiq</div>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-xl font-bold text-[#173b7a]">サインアップ（新規登録）</h1>
            <div className="mt-1 text-xs text-slate-500">治療院用アカウントを作成します</div>
          </div>

          <section className="px-8 py-6">
            {/* メッセージ */}
            {err ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
                <div className="text-sm font-bold text-rose-900">登録に失敗しました</div>
                <div className="mt-2 whitespace-pre-wrap text-xs text-rose-900/80">{err}</div>
              </div>
            ) : null}

            {okMsg ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="text-sm font-bold text-emerald-900">OK</div>
                <div className="mt-2 text-xs text-emerald-900/80">{okMsg}</div>
              </div>
            ) : null}

            {/* フォーム */}
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="院名"
                placeholder="例：〇〇整骨院"
                value={form.clinic_name}
                onChange={(v) => setField("clinic_name", v)}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="郵便番号"
                  placeholder="例：1234567"
                  value={form.postal_code}
                  onChange={(v) => setField("postal_code", v)}
                />
                <Field
                  label="責任者氏名"
                  placeholder="例：山田太郎"
                  value={form.owner_name}
                  onChange={(v) => setField("owner_name", v)}
                />
              </div>

              <Field
                label="住所"
                placeholder="例：東京都〇〇区〇〇 1-2-3"
                value={form.address}
                onChange={(v) => setField("address", v)}
              />

              <Field
                label="メールアドレス"
                placeholder="例：example@seikotsu.com"
                value={form.email}
                onChange={(v) => setField("email", v)}
              />

              <Field
                label="パスワード（8文字以上）"
                placeholder="********"
                value={form.password}
                onChange={(v) => setField("password", v)}
                type="password"
                note="※ パスワードは暗号化して保存されます"
              />

              <button
                className={cn(
                  "mt-2 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white",
                  canSubmit && !loading ? "bg-[#2a61c9] hover:bg-[#244fa4]" : "bg-slate-300 cursor-not-allowed"
                )}
                disabled={!canSubmit || loading}
                onClick={onSubmit}
              >
                {loading ? "登録中…" : "登録する"}
              </button>

              <div className="mt-2 text-center text-xs text-slate-500">
                すでにアカウントをお持ちですか？{" "}
                <button className="font-bold text-[#2a61c9] hover:underline" onClick={() => router.push("/login")}>
                  ログインへ
                </button>
              </div>
            </div>
          </section>

          <div className="border-t px-8 py-6 text-xs text-slate-500">
            ※ 登録API: <code>/auth/signup</code>（POST）
          </div>
        </div>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  note?: string;
  onChange: (v: string) => void;
}) {
  const { label, value, placeholder, type, note, onChange } = props;
  return (
    <div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <input
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2a61c9]"
        value={value}
        placeholder={placeholder}
        type={type ?? "text"}
        onChange={(e) => onChange(e.target.value)}
      />
      {note ? <div className="mt-1 text-[11px] text-slate-500">{note}</div> : null}
    </div>
  );
}

// "use client";

// import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// type SignupPayload = {
//   clinic_name: string;
//   postal_code: string;
//   address: string;
//   owner_name: string;
//   email: string;
//   password: string;
// };

// export default function SignupPage() {
//   const router = useRouter();

//   const [form, setForm] = useState<SignupPayload>({
//     clinic_name: "",
//     postal_code: "",
//     address: "",
//     owner_name: "",
//     email: "",
//     password: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);
//   const [okMsg, setOkMsg] = useState<string | null>(null);

//   const base = useMemo(
//     () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
//     []
//   );

//   const canSubmit = useMemo(() => {
//     return (
//       form.clinic_name.trim() &&
//       form.postal_code.trim() &&
//       form.address.trim() &&
//       form.owner_name.trim() &&
//       form.email.trim() &&
//       form.password.trim() &&
//       form.password.length >= 8
//     );
//   }, [form]);

//   const setField = (k: keyof SignupPayload, v: string) => {
//     setForm((p) => ({ ...p, [k]: v }));
//   };

//   const onSubmit = async () => {
//     try {
//       setLoading(true);
//       setErr(null);
//       setOkMsg(null);

//       // 1) 軽いフロントバリデーション（最低限）
//       if (!canSubmit) {
//         throw new Error("入力必須項目をご確認ください（パスワードは8文字以上）。");
//       }

//       // 郵便番号の軽い正規化（全角→半角などは必要なら追加）
//       const payload: SignupPayload = {
//         ...form,
//         postal_code: form.postal_code.replace(/\s/g, ""),
//         email: form.email.trim(),
//       };

//       const res = await fetch(`${base}/auth/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         cache: "no-store",
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         // FastAPIは {"detail": "..."} が多いので拾う
//         const text = await res.text().catch(() => "");
//         let msg = text;
//         try {
//           const j = JSON.parse(text);
//           msg = j?.detail ? String(j.detail) : text;
//         } catch {}
//         throw new Error(`signup api error: ${res.status} ${msg}`);
//       }

//       setOkMsg("登録が完了しました。トップ画面へ移動します…");

//       // 2) 少し見せてから /login へ
//       setTimeout(() => {
//         router.push("/patients");
//       }, 600);
//     } catch (e: any) {
//       setErr(String(e?.message ?? e));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-2xl">
//         {/* ヘッダ */}
//         <div className="mb-6 flex items-center justify-between text-white/80">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={() => router.push("/login")}
//           >
//             ← ログインへ
//           </button>
//           <div className="text-xs text-white/50">Athletiq</div>
//         </div>

//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <h1 className="text-xl font-bold text-[#173b7a]">サインアップ（新規登録）</h1>
//             <div className="mt-1 text-xs text-slate-500">
//               治療院用アカウントを作成します
//             </div>
//           </div>

//           <section className="px-8 py-6">
//             {/* メッセージ */}
//             {err ? (
//               <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
//                 <div className="text-sm font-bold text-rose-900">登録に失敗しました</div>
//                 <div className="mt-2 whitespace-pre-wrap text-xs text-rose-900/80">{err}</div>
//               </div>
//             ) : null}

//             {okMsg ? (
//               <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
//                 <div className="text-sm font-bold text-emerald-900">OK</div>
//                 <div className="mt-2 text-xs text-emerald-900/80">{okMsg}</div>
//               </div>
//             ) : null}

//             {/* フォーム */}
//             <div className="grid grid-cols-1 gap-4">
//               <Field
//                 label="院名"
//                 placeholder="例：〇〇整骨院"
//                 value={form.clinic_name}
//                 onChange={(v) => setField("clinic_name", v)}
//               />

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                 <Field
//                   label="郵便番号"
//                   placeholder="例：1234567"
//                   value={form.postal_code}
//                   onChange={(v) => setField("postal_code", v)}
//                 />
//                 <Field
//                   label="責任者氏名"
//                   placeholder="例：山田太郎"
//                   value={form.owner_name}
//                   onChange={(v) => setField("owner_name", v)}
//                 />
//               </div>

//               <Field
//                 label="住所"
//                 placeholder="例：東京都〇〇区〇〇 1-2-3"
//                 value={form.address}
//                 onChange={(v) => setField("address", v)}
//               />

//               <Field
//                 label="メールアドレス"
//                 placeholder="例：example@seikotsu.com"
//                 value={form.email}
//                 onChange={(v) => setField("email", v)}
//               />

//               <Field
//                 label="パスワード（8文字以上）"
//                 placeholder="********"
//                 value={form.password}
//                 onChange={(v) => setField("password", v)}
//                 type="password"
//                 note="※ パスワードは暗号化して保存されます"
//               />

//               <button
//                 className={cn(
//                   "mt-2 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white",
//                   canSubmit && !loading
//                     ? "bg-[#2a61c9] hover:bg-[#244fa4]"
//                     : "bg-slate-300 cursor-not-allowed"
//                 )}
//                 disabled={!canSubmit || loading}
//                 onClick={onSubmit}
//               >
//                 {loading ? "登録中…" : "登録する"}
//               </button>

//               <div className="mt-2 text-center text-xs text-slate-500">
//                 すでにアカウントをお持ちですか？{" "}
//                 <button
//                   className="font-bold text-[#2a61c9] hover:underline"
//                   onClick={() => router.push("/login")}
//                 >
//                   ログインへ
//                 </button>
//               </div>
//             </div>
//           </section>

//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 登録API: <code>/auth/signup</code>（POST）
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// function Field(props: {
//   label: string;
//   value: string;
//   placeholder?: string;
//   type?: string;
//   note?: string;
//   onChange: (v: string) => void;
// }) {
//   const { label, value, placeholder, type, note, onChange } = props;
//   return (
//     <div>
//       <div className="text-xs font-bold text-slate-600">{label}</div>
//       <input
//         className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2a61c9]"
//         value={value}
//         placeholder={placeholder}
//         type={type ?? "text"}
//         onChange={(e) => onChange(e.target.value)}
//       />
//       {note ? <div className="mt-1 text-[11px] text-slate-500">{note}</div> : null}
//     </div>
//   );
// }