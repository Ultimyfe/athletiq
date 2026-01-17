"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Sex = "male" | "female";

type Patient = {
  id: number;
  clinic_id: number;
  last_name: string;
  first_name: string;
  birth_date: string;
  sex: Sex;
  school_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function sexLabel(sex: Sex) {
  return sex === "male" ? "男子" : "女子";
}

function safeText(v: any, fallback = "-") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

export default function PatientsPage() {
  const router = useRouter();

  const [clinicName, setClinicName] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const cname = localStorage.getItem("clinic_name") ?? "";

    if (!token) {
      router.push("/login");
      return;
    }
    setClinicName(cname);

    const fetchPatients = async () => {
      setLoading(true);
      setError(null);

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");

        const res = await fetch(`${base}/patients`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("access_token");
            router.push("/login");
            return;
          }
          throw new Error(txt || `受検者一覧の取得に失敗しました (HTTP ${res.status})`);
        }

        const data = (await res.json()) as any;

        if (!data || !Array.isArray(data.items)) {
          throw new Error("受検者一覧のレスポンス形式が想定と違います（items がありません）");
        }

        setPatients(data.items);
      } catch (e: any) {
        setError(e?.message ?? "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [router]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((p) => {
      const name = `${p.last_name}${p.first_name}`.toLowerCase();
      const school = String(p.school_name ?? "").toLowerCase();
      const birth = String(p.birth_date ?? "").toLowerCase();
      return name.includes(query) || school.includes(query) || birth.includes(query);
    });
  }, [patients, q]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("clinic_id"); // 表示用の残骸掃除（任意）
    localStorage.removeItem("clinic_name"); // 表示用
    router.push("/login");
  };

  const goCreatePatient = () => {
    router.push("/patients/new");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between text-white/85">
          <div className="min-w-0">
            <div className="text-xs text-white/60">Athletiq Clinic Console</div>
            <h1 className="mt-1 truncate text-2xl font-extrabold">
              受検者一覧{" "}
              <span className="text-sm font-semibold text-white/60">
                {clinicName ? `（${clinicName}）` : ""}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/15 active:scale-[0.99]"
              onClick={() => router.push("/clinic/settings")}
              aria-label="治療院情報変更"
            >
              <span className="text-white/80">⚙</span>
              治療院情報変更
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 active:scale-[0.99]"
              aria-label="ログアウト"
            >
              ログアウト
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-[#173b7a]">受検者管理</div>
                <div className="mt-1 text-sm text-slate-500">
                  氏名・学校で検索し、「測定する」から測定入力に進みます。
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="氏名 / 学校 / 生年月日で検索"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none md:w-72"
                  />
                  {q ? (
                    <button
                      onClick={() => setQ("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                      aria-label="clear"
                    >
                      ×
                    </button>
                  ) : null}
                </div>

                <button
                  onClick={goCreatePatient}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-5 text-sm font-extrabold text-white shadow hover:opacity-95"
                >
                  ＋ 受検者を新規登録
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="px-6 py-6">
            {loading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="text-lg font-extrabold text-slate-800">受検者がいません</div>
                <div className="mt-2 text-sm text-slate-600">
                  「受検者を新規登録」から1人目を追加してください。
                </div>
                <button
                  onClick={goCreatePatient}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#173b7a] px-6 text-sm font-extrabold text-white shadow hover:opacity-95"
                >
                  ＋ 受検者を新規登録
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">受検者一覧（{filtered.length}名）</div>
                    <div className="text-xs text-slate-200">
                      ※ clinic_id はJWTで判定（URL/画面からは渡しません）
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">氏名</th>
                        <th className="px-5 py-3">性別</th>
                        <th className="px-5 py-3">生年月日</th>
                        <th className="px-5 py-3">学校</th>
                        <th className="px-5 py-3 text-right">操作</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-4">
                            <div className="font-extrabold text-slate-900">
                              {safeText(p.last_name, "")} {safeText(p.first_name, "")}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">ID: {p.id}</div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800 ring-1 ring-slate-200">
                              {sexLabel(p.sex)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold tabular-nums text-slate-900">{safeText(p.birth_date)}</div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800">{safeText(p.school_name)}</div>
                          </td>

                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              className="rounded-lg bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-4 py-2 text-sm font-extrabold text-white shadow hover:opacity-95"
                              onClick={() => router.push(`/measure?patient_id=${p.id}`)}
                            >
                              測定する
                            </button>

                            <button
                              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-300"
                              onClick={() => router.push(`/patients/records?patient_id=${p.id}`)}
                            >
                              記録を見る
                            </button>

                            <button
                              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-300"
                              onClick={() => router.push(`/patients/${p.id}/edit`)}
                            >
                              受検者編集
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                    ※ 検索はフロント側フィルタです（API検索は必要になったら追加）
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6" />
        </div>
      </div>
    </main>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="w-1/3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}