// "use client";

// import { useSearchParams, useRouter } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";

// type RecordItem = {
//   id: number;
//   measured_at: string;
//   summary?: {
//     motor_age?: { value?: number | null } | null;
//     type?: { label?: string | null; key?: string | null } | null;
//     class?: { label?: string | null; key?: string | null } | null;
//   } | null;
// };

// type RecordsListResponse = {
//   items: RecordItem[];
// };

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// function fmtDate(s?: string) {
//   if (!s) return "";
//   return String(s).slice(0, 10);
// }

// export default function RecordsClient() {
//   const sp = useSearchParams();
//   const router = useRouter();
//   const patientId = sp.get("patient_id");

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const [items, setItems] = useState<RecordItem[]>([]);

//   const apiBase = useMemo(() => {
//     const base = process.env.NEXT_PUBLIC_API_BASE_URL;
//     if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
//     return base.replace(/\/+$/, "");
//   }, []);

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (!token) {
//       router.push("/login");
//       return;
//     }
//     if (!patientId) {
//       router.push("/patients");
//       return;
//     }

//     (async () => {
//       try {
//         setLoading(true);
//         setErr(null);

//         const res = await fetch(`${apiBase}/records?patient_id=${encodeURIComponent(patientId)}`, {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           cache: "no-store",
//         });

//         if (!res.ok) {
//           const text = await res.text().catch(() => "");
//           if (res.status === 401 || res.status === 403) {
//             localStorage.removeItem("access_token");
//             router.push("/login");
//             return;
//           }
//           throw new Error(`records api error: ${res.status} ${text}`);
//         }

//         const json = (await res.json()) as Partial<RecordsListResponse>;
//         setItems(Array.isArray(json?.items) ? (json!.items as RecordItem[]) : []);
//       } catch (e: any) {
//         setItems([]);
//         setErr(String(e?.message ?? e));
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [patientId, router, apiBase]);

//   const title = useMemo(() => `記録一覧`, []);

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         {/* 上部ナビ */}
//         <div className="mb-6 flex items-center justify-between text-white/80">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={() => router.push("/patients")}
//           >
//             ← 受検者一覧へ
//           </button>

//           <button
//             className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
//             onClick={() => router.push(`/measure?patient_id=${encodeURIComponent(patientId ?? "")}`)}
//           >
//             ＋ 新しく測定する
//           </button>
//         </div>

//         {/* 本体 */}
//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <h1 className="text-xl font-bold text-[#173b7a]">{title}</h1>
//             <div className="mt-1 text-xs text-slate-500">patient_id: {patientId}</div>
//           </div>

//           <section className="px-8 py-6">
//             {loading ? (
//               <div className="text-sm text-slate-600">読み込み中…</div>
//             ) : err ? (
//               <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
//                 <div className="text-sm font-bold text-amber-900">記録を取得できませんでした</div>
//                 <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80">{err}</div>
//               </div>
//             ) : items.length === 0 ? (
//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
//                 <div className="text-sm font-bold text-slate-800">まだ記録がありません</div>
//                 <div className="mt-2 text-xs text-slate-600">
//                   「新しく測定する」から測定を行うと、ここに履歴が並びます。
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {items.map((r) => (
//                   <div key={r.id} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="flex items-start justify-between gap-4">
//                       <div>
//                         <div className="text-xs font-bold text-slate-500">測定日</div>
//                         <div className="mt-1 text-lg font-extrabold text-slate-900">
//                           {fmtDate(r.measured_at)}
//                         </div>

//                         <div className="mt-2 flex flex-wrap gap-2 text-xs">
//                           {r.summary?.class?.label ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               {r.summary.class.label}
//                             </span>
//                           ) : null}
//                           {r.summary?.type?.label ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               {r.summary.type.label}
//                             </span>
//                           ) : null}
//                           {r.summary?.motor_age?.value != null ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               運動器年齢：{r.summary.motor_age.value}歳
//                             </span>
//                           ) : null}
//                         </div>
//                       </div>

//                       <div className="flex gap-2">
//                         <button
//                           className={cn(
//                             "rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
//                           )}

//                           onClick={async () => {
//                             try {
//                               const token = localStorage.getItem("access_token");
//                               if (!token) {
//                                 router.push("/login");
//                                 return;
//                               }

//                               const url = `${apiBase}/records/${r.id}?patient_id=${encodeURIComponent(
//                                 patientId ?? ""
//                               )}`;

//                               const res = await fetch(url, {
//                                 cache: "no-store",
//                                 headers: { Authorization: `Bearer ${token}` },
//                               });

//                               if (!res.ok) {
//                                 const text = await res.text().catch(() => "");
//                                 if (res.status === 401 || res.status === 403) {
//                                   localStorage.removeItem("access_token");
//                                   router.push("/login");
//                                   return;
//                                 }
//                                 throw new Error(`record detail api error: ${res.status} ${text}`);
//                               }

//                               const json = await res.json();

//                               // ✅ resultページが読むキーに合わせる（既存運用踏襲）
//                               // json.result が返ってくる前提（あなたのAPIの形）
//                               sessionStorage.setItem(
//                                 "diagnose_result",
//                                 JSON.stringify(json.result ?? json)
//                               );

//                               // ✅ 戻り先を付与（result側が使うなら）
//                               router.push(
//                                 `/result?back=records&patient_id=${encodeURIComponent(patientId ?? "")}`
//                               );
//                             } catch (e: any) {
//                               alert(String(e?.message ?? e));
//                             }
//                           }}
//                         >
//                           結果を見る
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>

//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 「結果を見る」は /records/{`{id}`} を叩いて result を sessionStorage に入れて /result に遷移します
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// "use client";

// import { useSearchParams, useRouter } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";

// type RecordItem = {
//   id: number;
//   measured_at: string;
//   summary?: {
//     motor_age?: { value?: number | null } | null;
//     type?: { label?: string | null; key?: string | null } | null;
//     class?: { label?: string | null; key?: string | null } | null;
//   } | null;
// };

// type RecordsListResponse = {
//   items: RecordItem[];
// };

// function cn(...xs: (string | false | null | undefined)[]) {
//   return xs.filter(Boolean).join(" ");
// }

// function fmtDate(s?: string) {
//   if (!s) return "";
//   return String(s).slice(0, 10);
// }

// export default function RecordsClient() {
//   const sp = useSearchParams();
//   const router = useRouter();
//   const patientId = sp.get("patient_id");

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const [items, setItems] = useState<RecordItem[]>([]);

//   const apiBase = useMemo(() => {
//     const base = process.env.NEXT_PUBLIC_API_BASE_URL;
//     if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
//     return base.replace(/\/+$/, "");
//   }, []);

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (!token) {
//       router.push("/login");
//       return;
//     }
//     if (!patientId) {
//       router.push("/patients");
//       return;
//     }

//     (async () => {
//       try {
//         setLoading(true);
//         setErr(null);

//         const res = await fetch(`${apiBase}/records?patient_id=${encodeURIComponent(patientId)}`, {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           cache: "no-store",
//         });

//         if (!res.ok) {
//           const text = await res.text().catch(() => "");
//           if (res.status === 401 || res.status === 403) {
//             localStorage.removeItem("access_token");
//             router.push("/login");
//             return;
//           }
//           throw new Error(`records api error: ${res.status} ${text}`);
//         }

//         const json = (await res.json()) as Partial<RecordsListResponse>;
//         setItems(Array.isArray(json?.items) ? (json!.items as RecordItem[]) : []);
//       } catch (e: any) {
//         setItems([]);
//         setErr(String(e?.message ?? e));
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [patientId, router, apiBase]);

//   const title = useMemo(() => `記録一覧`, []);

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
//       <div className="mx-auto w-full max-w-5xl">
//         <div className="mb-6 flex items-center justify-between text-white/80">
//           <button
//             className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
//             onClick={() => router.push("/patients")}
//           >
//             ← 受検者一覧へ
//           </button>

//           <button
//             className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
//             onClick={() => router.push(`/measure?patient_id=${encodeURIComponent(patientId ?? "")}`)}
//           >
//             ＋ 新しく測定する
//           </button>
//         </div>

//         <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
//           <div className="border-b-4 border-[#173b7a] px-8 py-6">
//             <h1 className="text-xl font-bold text-[#173b7a]">{title}</h1>
//             <div className="mt-1 text-xs text-slate-500">patient_id: {patientId}</div>
//           </div>

//           <section className="px-8 py-6">
//             {loading ? (
//               <div className="text-sm text-slate-600">読み込み中…</div>
//             ) : err ? (
//               <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
//                 <div className="text-sm font-bold text-amber-900">記録を取得できませんでした</div>
//                 <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80">{err}</div>
//               </div>
//             ) : items.length === 0 ? (
//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
//                 <div className="text-sm font-bold text-slate-800">まだ記録がありません</div>
//                 <div className="mt-2 text-xs text-slate-600">
//                   「新しく測定する」から測定を行うと、ここに履歴が並びます。
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {items.map((r) => (
//                   <div key={r.id} className="rounded-xl border border-slate-200 px-5 py-4">
//                     <div className="flex items-start justify-between gap-4">
//                       <div>
//                         <div className="text-xs font-bold text-slate-500">測定日</div>
//                         <div className="mt-1 text-lg font-extrabold text-slate-900">
//                           {fmtDate(r.measured_at)}
//                         </div>

//                         <div className="mt-2 flex flex-wrap gap-2 text-xs">
//                           {r.summary?.class?.label ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               {r.summary.class.label}
//                             </span>
//                           ) : null}
//                           {r.summary?.type?.label ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               {r.summary.type.label}
//                             </span>
//                           ) : null}
//                           {r.summary?.motor_age?.value != null ? (
//                             <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
//                               運動器年齢：{r.summary.motor_age.value}歳
//                             </span>
//                           ) : null}
//                         </div>
//                       </div>

//                       <div className="flex gap-2">
//                         <button
//                           className={cn(
//                             "rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
//                           )}
//                           onClick={async () => {
//                             try {
//                               const token = localStorage.getItem("access_token");
//                               if (!token) {
//                                 router.push("/login");
//                                 return;
//                               }

//                               const url = `${apiBase}/records/${r.id}?patient_id=${encodeURIComponent(
//                                 patientId ?? ""
//                               )}`;

//                               const res = await fetch(url, {
//                                 cache: "no-store",
//                                 headers: { Authorization: `Bearer ${token}` },
//                               });

//                               if (!res.ok) {
//                                 const text = await res.text().catch(() => "");
//                                 if (res.status === 401 || res.status === 403) {
//                                   localStorage.removeItem("access_token");
//                                   router.push("/login");
//                                   return;
//                                 }
//                                 throw new Error(`record detail api error: ${res.status} ${text}`);
//                               }

//                               const json = await res.json();

//                               // ✅ デバッグログ（開発中のみ）
//                               console.log("=== [DEBUG] API Response ===");
//                               console.log("Full response:", json);
//                               console.log("result.meta:", json.result?.meta);
//                               console.log("event_name:", json.result?.meta?.event_name);
//                               console.log("payload.event_name:", json.payload?.event_name);
//                               console.log("========================");

//                               sessionStorage.setItem(
//                                 "diagnose_result",
//                                 JSON.stringify(json.result ?? json)
//                               );

//                               router.push(
//                                 `/result?back=records&patient_id=${encodeURIComponent(patientId ?? "")}`
//                               );
//                             } catch (e: any) {
//                               console.error("[ERROR]", e);
//                               alert(String(e?.message ?? e));
//                             }
//                           }}
//                         >
//                           結果を見る
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>

//           <div className="border-t px-8 py-6 text-xs text-slate-500">
//             ※ 「結果を見る」は /records/{`{id}`} を叩いて result を sessionStorage に入れて /result に遷移します
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }


"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RecordItem = {
  id: number;
  measured_at: string;
  summary?: {
    motor_age?: { value?: number | null } | null;
    type?: { label?: string | null; key?: string | null } | null;
    class?: { label?: string | null; key?: string | null } | null;
  } | null;
};

type RecordsListResponse = {
  items: RecordItem[];
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(s?: string) {
  if (!s) return "";
  return String(s).slice(0, 10);
}

export default function RecordsClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const patientId = sp.get("patient_id");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RecordItem[]>([]);

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

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("access_token");
            router.push("/login");
            return;
          }
          throw new Error(`records api error: ${res.status} ${text}`);
        }

        const json = (await res.json()) as Partial<RecordsListResponse>;
        setItems(Array.isArray(json?.items) ? (json!.items as RecordItem[]) : []);
      } catch (e: any) {
        setItems([]);
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router, apiBase]);

  const title = useMemo(() => `記録一覧`, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* 上部ナビ */}
        <div className="mb-6 flex items-center justify-between text-white/80">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/patients")}
          >
            ← 受検者一覧へ
          </button>

          <div className="flex gap-2">
            {/* ✅ 追加: サマリページへのリンク */}
            <button
              className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              onClick={() => router.push(`/patients/summary?patient_id=${encodeURIComponent(patientId ?? "")}`)}
            >
              📊 サマリを見る
            </button>

            <button
              className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              onClick={() => router.push(`/measure?patient_id=${encodeURIComponent(patientId ?? "")}`)}
            >
              ＋ 新しく測定する
            </button>
          </div>
        </div>

        {/* 本体 */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b-4 border-[#173b7a] px-8 py-6">
            <h1 className="text-xl font-bold text-[#173b7a]">{title}</h1>
            <div className="mt-1 text-xs text-slate-500">patient_id: {patientId}</div>
          </div>

          <section className="px-8 py-6">
            {loading ? (
              <div className="text-sm text-slate-600">読み込み中…</div>
            ) : err ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="text-sm font-bold text-amber-900">記録を取得できませんでした</div>
                <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80">{err}</div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="text-sm font-bold text-slate-800">まだ記録がありません</div>
                <div className="mt-2 text-xs text-slate-600">
                  「新しく測定する」から測定を行うと、ここに履歴が並びます。
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500">測定日</div>
                        <div className="mt-1 text-lg font-extrabold text-slate-900">
                          {fmtDate(r.measured_at)}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {r.summary?.class?.label ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                              {r.summary.class.label}
                            </span>
                          ) : null}
                          {r.summary?.type?.label ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                              {r.summary.type.label}
                            </span>
                          ) : null}
                          {r.summary?.motor_age?.value != null ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                              運動器年齢：{r.summary.motor_age.value}歳
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className={cn(
                            "rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
                          )}
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("access_token");
                              if (!token) {
                                router.push("/login");
                                return;
                              }

                              const url = `${apiBase}/records/${r.id}?patient_id=${encodeURIComponent(
                                patientId ?? ""
                              )}`;

                              const res = await fetch(url, {
                                cache: "no-store",
                                headers: { Authorization: `Bearer ${token}` },
                              });

                              if (!res.ok) {
                                const text = await res.text().catch(() => "");
                                if (res.status === 401 || res.status === 403) {
                                  localStorage.removeItem("access_token");
                                  router.push("/login");
                                  return;
                                }
                                throw new Error(`record detail api error: ${res.status} ${text}`);
                              }

                              const json = await res.json();

                              sessionStorage.setItem(
                                "diagnose_result",
                                JSON.stringify(json.result ?? json)
                              );

                              router.push(
                                `/result?back=records&patient_id=${encodeURIComponent(patientId ?? "")}`
                              );
                            } catch (e: any) {
                              alert(String(e?.message ?? e));
                            }
                          }}
                        >
                          結果を見る
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="border-t px-8 py-6 text-xs text-slate-500">
            ※ 「結果を見る」は /records/{`{id}`} を叩いて result を sessionStorage に入れて /result に遷移します
          </div>
        </div>
      </div>
    </main>
  );
}