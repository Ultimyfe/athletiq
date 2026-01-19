// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";

// type ClinicMeResponse = {
//   id: number;
//   clinic_name: string;
//   postal_code: string;
//   address: string;
//   owner_name: string;
//   email: string;
//   created_at?: string | null;
//   updated_at?: string | null;
// };

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// export default function ClinicSettingsPage() {
//   const router = useRouter();

//   const API_BASE = useMemo(
//     () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
//     []
//   );

//   const [clinicId, setClinicId] = useState<number | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [savingProfile, setSavingProfile] = useState(false);
//   const [savingPassword, setSavingPassword] = useState(false);

//   const [error, setError] = useState<string | null>(null);
//   const [okMsg, setOkMsg] = useState<string | null>(null);

//   // profile fields
//   const [clinicName, setClinicName] = useState("");
//   const [postalCode, setPostalCode] = useState("");
//   const [address, setAddress] = useState("");
//   const [ownerName, setOwnerName] = useState("");
//   const [email, setEmail] = useState("");

//   // password fields
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");

//   useEffect(() => {
//     // ログイン必須（最短運用：localStorage の clinic_id）
//     const cid = localStorage.getItem("clinic_id");
//     if (!cid) {
//       router.replace("/login");
//       return;
//     }
//     const n = Number(cid);
//     if (!Number.isFinite(n)) {
//       localStorage.removeItem("clinic_id");
//       router.replace("/login");
//       return;
//     }
//     setClinicId(n);
//   }, [router]);

//   useEffect(() => {
//     if (!clinicId) return;

//     (async () => {
//       setLoading(true);
//       setError(null);
//       setOkMsg(null);

//       try {
//         const res = await fetch(`${API_BASE}/clinics/me?clinic_id=${clinicId}`, {
//           cache: "no-store",
//         });

//         if (!res.ok) {
//           const txt = await res.text().catch(() => "");
//           throw new Error(txt || `failed: ${res.status}`);
//         }

//         const json = (await res.json()) as ClinicMeResponse;

//         setClinicName(json.clinic_name ?? "");
//         setPostalCode(json.postal_code ?? "");
//         setAddress(json.address ?? "");
//         setOwnerName(json.owner_name ?? "");
//         setEmail(json.email ?? "");
//       } catch (e: any) {
//         setError(String(e?.message ?? e));
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [clinicId, API_BASE]);

//   const clinicNameStored =
//     typeof window !== "undefined" ? localStorage.getItem("clinic_name") : null;

//   const goBack = () => router.push("/patients");

//   const normalizePostal = (s: string) => s.replace(/[^\d]/g, "").slice(0, 7);

//   const saveProfile = async () => {
//     if (!clinicId) return;

//     setSavingProfile(true);
//     setError(null);
//     setOkMsg(null);

//     try {
//       if (!clinicName.trim()) throw new Error("院名を入力してください");
//       if (!ownerName.trim()) throw new Error("責任者氏名を入力してください");
//       if (!email.trim()) throw new Error("メールアドレスを入力してください");

//       const body = {
//         clinic_id: clinicId,
//         clinic_name: clinicName.trim(),
//         postal_code: normalizePostal(postalCode),
//         address: address.trim(),
//         owner_name: ownerName.trim(),
//         email: email.trim(),
//       };

//       // const res = await fetch(`${API_BASE}/clinics/me`, {
//       //   method: "PUT",
//       //   headers: { "Content-Type": "application/json" },
//       //   cache: "no-store",
//       //   body: JSON.stringify(body),
//       // });
//       const token = localStorage.getItem("access_token");

//       const res = await fetch(`${API_BASE}/clinics/me`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         cache: "no-store",
//         body: JSON.stringify(body),
//       });

//       const txt = await res.text().catch(() => "");
//       if (!res.ok) {
//         // FastAPI: {"detail": "..."} 対応
//         try {
//           const j = JSON.parse(txt);
//           throw new Error(j?.detail ? String(j.detail) : txt || `failed: ${res.status}`);
//         } catch {
//           throw new Error(txt || `failed: ${res.status}`);
//         }
//       }

//       const j = JSON.parse(txt) as { ok: boolean; clinic_id: number; clinic_name: string };

//       // 画面上部などで使ってる想定なので同期
//       localStorage.setItem("clinic_name", String(j.clinic_name ?? ""));
//       setOkMsg("院情報を更新しました");
//     } catch (e: any) {
//       setError(String(e?.message ?? e));
//     } finally {
//       setSavingProfile(false);
//     }
//   };

//   const savePassword = async () => {
//     if (!clinicId) return;

//     setSavingPassword(true);
//     setError(null);
//     setOkMsg(null);

//     try {
//       if (!currentPassword.trim()) throw new Error("現在のパスワードを入力してください");
//       if (!newPassword.trim()) throw new Error("新しいパスワードを入力してください");
//       if (newPassword.length < 8) throw new Error("新しいパスワードは8文字以上にしてください");
//       if (newPassword === "00000000") throw new Error("弱いパスワードは使用できません");

//       const body = {
//         clinic_id: clinicId,
//         current_password: currentPassword,
//         new_password: newPassword,
//       };

//       const res = await fetch(`${API_BASE}/clinics/me/password`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         cache: "no-store",
//         body: JSON.stringify(body),
//       });

//       const txt = await res.text().catch(() => "");
//       if (!res.ok) {
//         try {
//           const j = JSON.parse(txt);
//           throw new Error(j?.detail ? String(j.detail) : txt || `failed: ${res.status}`);
//         } catch {
//           throw new Error(txt || `failed: ${res.status}`);
//         }
//       }

//       setCurrentPassword("");
//       setNewPassword("");
//       setOkMsg("パスワードを変更しました（次回ログインから新しいパスワードが有効です）");
//     } catch (e: any) {
//       setError(String(e?.message ?? e));
//     } finally {
//       setSavingPassword(false);
//     }
//   };

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
//         <div className="mx-auto w-full max-w-3xl text-white/80">読み込み中…</div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-3xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={goBack}
//           >
//             ← 患者一覧へ
//           </button>

//           <div className="text-right">
//             <div className="text-xs text-white/60">ログイン中</div>
//             <div className="text-sm font-bold text-white">
//               {clinicNameStored || clinicName || "治療院"}
//             </div>
//           </div>
//         </div>

//         {/* 本体 */}
//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <h1 className="text-xl font-extrabold text-[#173b7a]">院情報の設定</h1>
//             <p className="mt-1 text-sm text-slate-500">
//               院の基本情報とパスワードを変更できます
//             </p>

//             {error && (
//               <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//                 {error}
//               </div>
//             )}

//             {okMsg && (
//               <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
//                 {okMsg}
//               </div>
//             )}
//           </div>

//           {/* プロフィール */}
//           <section className="border-b px-8 py-6">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">基本情報</h2>
//             <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <label className="text-sm font-semibold text-slate-700">院名</label>
//                 <input
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={clinicName}
//                   onChange={(e) => setClinicName(e.target.value)}
//                   placeholder="例：〇〇整骨院"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-slate-700">責任者氏名</label>
//                 <input
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={ownerName}
//                   onChange={(e) => setOwnerName(e.target.value)}
//                   placeholder="例：山田 太郎"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-slate-700">郵便番号</label>
//                 <input
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={postalCode}
//                   onChange={(e) => setPostalCode(normalizePostal(e.target.value))}
//                   placeholder="例：1234567"
//                   inputMode="numeric"
//                 />
//                 <div className="mt-1 text-xs text-slate-400">※ハイフン不要（7桁）</div>
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-slate-700">メールアドレス</label>
//                 <input
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="example@clinic.com"
//                   autoComplete="email"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="text-sm font-semibold text-slate-700">住所</label>
//                 <input
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={address}
//                   onChange={(e) => setAddress(e.target.value)}
//                   placeholder="例：兵庫県芦屋市〇〇"
//                 />
//               </div>
//             </div>

//             <div className="mt-6 flex items-center justify-end gap-3">
//               <button
//                 onClick={saveProfile}
//                 disabled={savingProfile}
//                 className={cn(
//                   "rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-6 py-3 text-sm font-extrabold text-white shadow hover:opacity-90 disabled:opacity-60"
//                 )}
//               >
//                 {savingProfile ? "保存中..." : "基本情報を保存"}
//               </button>
//             </div>

//             <div className="mt-4 text-xs text-slate-400">
//               ※メールアドレス変更後は、次回ログインで新しいメールを使用してください
//             </div>
//           </section>

//           {/* パスワード変更 */}
//           <section className="px-8 py-8">
//             <h2 className="text-lg font-extrabold text-[#173b7a]">パスワード変更</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Google の警告（漏洩済みパスワード検知）に対応するため、強めのパスワードに変更してください
//             </p>

//             <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <label className="text-sm font-semibold text-slate-700">現在のパスワード</label>
//                 <input
//                   type="password"
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={currentPassword}
//                   onChange={(e) => setCurrentPassword(e.target.value)}
//                   placeholder="••••••••"
//                   autoComplete="current-password"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-slate-700">新しいパスワード</label>
//                 <input
//                   type="password"
//                   className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   placeholder="8文字以上（英数字推奨）"
//                   autoComplete="new-password"
//                 />
//                 <div className="mt-1 text-xs text-slate-400">
//                   ※ 8文字以上 / 00000000 のような単純パスワードは不可
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex items-center justify-end gap-3">
//               <button
//                 onClick={savePassword}
//                 disabled={savingPassword}
//                 className={cn(
//                   "rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-6 py-3 text-sm font-extrabold text-white shadow hover:opacity-90 disabled:opacity-60"
//                 )}
//               >
//                 {savingPassword ? "変更中..." : "パスワードを変更"}
//               </button>
//             </div>

//             <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-600">
//               <div className="font-bold text-slate-700">補足</div>
//               <ul className="mt-2 list-disc space-y-1 pl-5">
//                 <li>パスワード変更後、保存済みのパスワード（ブラウザ）も更新してください</li>
//                 <li>安全のため、本番運用では token 認証（Bearer）へ移行するのがおすすめです</li>
//               </ul>
//             </div>
//           </section>
//         </div>

//         <div className="mt-5 text-center text-xs text-white/50">
//           API: {API_BASE}
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClinicMeResponse = {
  id: number;
  clinic_name: string;
  postal_code: string;
  address: string;
  owner_name: string;
  email: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function ClinicSettingsPage() {
  const router = useRouter();

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
    []
  );

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // profile fields
  const [clinicName, setClinicName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");

  // password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const clinicNameStored =
    typeof window !== "undefined" ? localStorage.getItem("clinic_name") : null;

  const goBack = () => router.push("/patients");

  const normalizePostal = (s: string) => s.replace(/[^\d]/g, "").slice(0, 7);

  // 認証トークン取得
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // 401/403 を受けたらログアウト扱い
  const kickToLogin = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("clinic_id");
      localStorage.removeItem("clinic_name");
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  // FastAPIのエラー({detail:"..."})をいい感じに表示する
  const readApiError = async (res: Response) => {
    const txt = await res.text().catch(() => "");
    if (!txt) return `failed: ${res.status}`;
    try {
      const j = JSON.parse(txt);
      return j?.detail ? String(j.detail) : txt;
    } catch {
      return txt;
    }
  };

  // 共通：Authorization + Content-Type を作る（TSエラーが出ない形）
  const buildHeaders = (opts?: { json?: boolean }) => {
    const h = new Headers();
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
    if (opts?.json) h.set("Content-Type", "application/json");
    return h; // ← Headers は HeadersInit として渡せます
  };

  // まず token がないならログインへ
  useEffect(() => {
    const token = getToken();
    if (!token) {
      kickToLogin();
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初期ロード：/clinics/me を「Bearer付き」で取得（clinic_idクエリは付けない）
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setOkMsg(null);

      try {
        const res = await fetch(`${API_BASE}/clinics/me`, {
          method: "GET",
          cache: "no-store",
          headers: buildHeaders(),
        });

        if (res.status === 401 || res.status === 403) {
          kickToLogin();
          return;
        }

        if (!res.ok) {
          throw new Error(await readApiError(res));
        }

        const json = (await res.json()) as ClinicMeResponse;

        setClinicName(json.clinic_name ?? "");
        setPostalCode(json.postal_code ?? "");
        setAddress(json.address ?? "");
        setOwnerName(json.owner_name ?? "");
        setEmail(json.email ?? "");

        // 表示用に同期
        localStorage.setItem("clinic_name", String(json.clinic_name ?? ""));
        localStorage.setItem("clinic_id", String(json.id ?? ""));
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setOkMsg(null);

    try {
      if (!clinicName.trim()) throw new Error("院名を入力してください");
      if (!ownerName.trim()) throw new Error("責任者氏名を入力してください");
      if (!email.trim()) throw new Error("メールアドレスを入力してください");

      // ★ clinic_id を body に入れる設計にしても動く可能性はありますが、
      //    本来 /clinics/me はJWTから特定できるので不要です。
      const body = {
        clinic_name: clinicName.trim(),
        postal_code: normalizePostal(postalCode),
        address: address.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
      };

      const res = await fetch(`${API_BASE}/clinics/me`, {
        method: "PUT",
        cache: "no-store",
        headers: buildHeaders({ json: true }),
        body: JSON.stringify(body),
      });

      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error(await readApiError(res));
      }

      // 返却形式が多少揺れても clinic_name は同期しておく
      const txt = await res.text().catch(() => "");
      try {
        const j = JSON.parse(txt);
        const updatedName = String(
          j?.clinic_name ?? j?.clinic?.clinic_name ?? clinicName.trim()
        );
        localStorage.setItem("clinic_name", updatedName);
      } catch {
        localStorage.setItem("clinic_name", clinicName.trim());
      }

      setOkMsg("院情報を更新しました");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    setError(null);
    setOkMsg(null);

    try {
      if (!currentPassword.trim())
        throw new Error("現在のパスワードを入力してください");
      if (!newPassword.trim())
        throw new Error("新しいパスワードを入力してください");
      if (newPassword.length < 8)
        throw new Error("新しいパスワードは8文字以上にしてください");
      if (newPassword === "00000000")
        throw new Error("弱いパスワードは使用できません");

      const body = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      // ★ ここも Bearer 必須（付けないと Not authenticated）
      const res = await fetch(`${API_BASE}/clinics/me/password`, {
        method: "PUT",
        cache: "no-store",
        headers: buildHeaders({ json: true }),
        body: JSON.stringify(body),
      });

      if (res.status === 401 || res.status === 403) {
        kickToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error(await readApiError(res));
      }

      setCurrentPassword("");
      setNewPassword("");
      setOkMsg("パスワードを変更しました（次回ログインから新しいパスワードが有効です）");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
        <div className="mx-auto w-full max-w-3xl text-white/80">読み込み中…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={goBack}
          >
            ← 患者一覧へ
          </button>

          <div className="text-right">
            <div className="text-xs text-white/60">ログイン中</div>
            <div className="text-sm font-bold text-white">
              {clinicNameStored || clinicName || "治療院"}
            </div>
          </div>
        </div>

        {/* 本体 */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-xl font-extrabold text-[#173b7a]">院情報の設定</h1>
            <p className="mt-1 text-sm text-slate-500">
              院の基本情報とパスワードを変更できます
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {okMsg && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {okMsg}
              </div>
            )}
          </div>

          {/* プロフィール */}
          <section className="border-b px-8 py-6">
            <h2 className="text-lg font-extrabold text-[#173b7a]">基本情報</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">院名</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="例：〇〇整骨院"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">責任者氏名</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="例：山田 太郎"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">郵便番号</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={postalCode}
                  onChange={(e) => setPostalCode(normalizePostal(e.target.value))}
                  placeholder="例：1234567"
                  inputMode="numeric"
                />
                <div className="mt-1 text-xs text-slate-400">※ハイフン不要（7桁）</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">メールアドレス</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@clinic.com"
                  autoComplete="email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">住所</label>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="例：兵庫県芦屋市〇〇"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className={cn(
                  "rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-6 py-3 text-sm font-extrabold text-white shadow hover:opacity-90 disabled:opacity-60"
                )}
              >
                {savingProfile ? "保存中..." : "基本情報を保存"}
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              ※メールアドレス変更後は、次回ログインで新しいメールを使用してください
            </div>
          </section>

          {/* パスワード変更 */}
          <section className="px-8 py-8">
            <h2 className="text-lg font-extrabold text-[#173b7a]">パスワード変更</h2>
            <p className="mt-1 text-sm text-slate-500">
              Google の警告（漏洩済みパスワード検知）に対応するため、強めのパスワードに変更してください
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">現在のパスワード</label>
                <input
                  type="password"
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">新しいパスワード</label>
                <input
                  type="password"
                  className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#173b7a] focus:outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8文字以上（英数字推奨）"
                  autoComplete="new-password"
                />
                <div className="mt-1 text-xs text-slate-400">
                  ※ 8文字以上 / 00000000 のような単純パスワードは不可
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={savePassword}
                disabled={savingPassword}
                className={cn(
                  "rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-6 py-3 text-sm font-extrabold text-white shadow hover:opacity-90 disabled:opacity-60"
                )}
              >
                {savingPassword ? "変更中..." : "パスワードを変更"}
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-600">
              <div className="font-bold text-slate-700">補足</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>パスワード変更後、保存済みのパスワード（ブラウザ）も更新してください</li>
                <li>安全のため、本番運用では httpOnly cookie などの方式も検討してください</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-5 text-center text-xs text-white/50">API: {API_BASE}</div>
      </div>
    </main>
  );
}