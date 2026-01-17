"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function safe(v: any) {
  return String(v ?? "");
}

export default function PatientEditPage() {
  const router = useRouter();
  const params = useParams<{ patient_id: string }>();
  const patientId = Number(params.patient_id);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [clinicName, setClinicName] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [birthDate, setBirthDate] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const cname = localStorage.getItem("clinic_name") ?? "";
    setClinicName(cname);

    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    const run = async () => {
      setErr(null);
      setOkMsg(null);

      if (!API_BASE) {
        setErr("NEXT_PUBLIC_API_BASE_URL が未設定です（web/.env.local を確認してください）");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      if (!patientId || Number.isNaN(patientId)) {
        setErr("patient_id が不正です");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/patients/${patientId}`, {
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
            router.replace("/login");
            return;
          }
          throw new Error(txt || `取得に失敗しました (HTTP ${res.status})`);
        }

        const p = JSON.parse(txt) as Patient;

        setLastName(safe(p.last_name));
        setFirstName(safe(p.first_name));
        setSex(p.sex);
        setBirthDate(safe(p.birth_date));
        setSchoolName(safe(p.school_name));
        setGuardianName(safe(p.guardian_name));
        setGuardianPhone(safe(p.guardian_phone));
        setNotes(safe(p.notes));
      } catch (e: any) {
        setErr(String(e?.message ?? "不明なエラー"));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [API_BASE, patientId, router]);

  const canSave = useMemo(() => {
    return !!lastName.trim() && !!firstName.trim() && (sex === "male" || sex === "female");
  }, [lastName, firstName, sex]);

  async function save() {
    setErr(null);
    setOkMsg(null);

    if (!API_BASE) {
      setErr("NEXT_PUBLIC_API_BASE_URL が未設定です");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!canSave) {
      setErr("姓・名・性別を入力してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          last_name: lastName.trim(),
          first_name: firstName.trim(),
          sex,
          school_name: schoolName.trim() ? schoolName.trim() : null,
          guardian_name: guardianName.trim() ? guardianName.trim() : null,
          guardian_phone: guardianPhone.trim() ? guardianPhone.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        }),
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }
        throw new Error(txt || `更新に失敗しました (HTTP ${res.status})`);
      }

      setOkMsg("更新しました");
    } catch (e: any) {
      setErr(String(e?.message ?? "不明なエラー"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between text-white/85">
          <div className="min-w-0">
            <div className="text-xs text-white/60">Athletiq Clinic Console</div>
            <h1 className="mt-1 truncate text-2xl font-extrabold">
              受検者情報の更新{" "}
              <span className="text-sm font-semibold text-white/60">{clinicName ? `（${clinicName}）` : ""}</span>
            </h1>
          </div>

          <button
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            onClick={() => router.push("/patients")}
          >
            ← 受検者一覧へ
          </button>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b px-8 py-6">
            <div className="text-lg font-extrabold text-[#173b7a]">受検者</div>
            <div className="mt-1 text-sm text-slate-500">生年月日は変更できません（必要なら再登録の運用にしてください）</div>

            {err ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {err}
              </div>
            ) : null}

            {okMsg ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {okMsg}
              </div>
            ) : null}
          </div>

          <div className="px-8 py-8">
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">姓</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">名</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">性別</div>
                  <select
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as Sex)}
                  >
                    <option value="male">男子</option>
                    <option value="female">女子</option>
                  </select>
                </label>

                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">生年月日（変更不可）</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500"
                    value={birthDate}
                    readOnly
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-sm font-semibold text-slate-700">学校名</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="例）サンプル小学校"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">保護者氏名</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-semibold text-slate-700">保護者電話</div>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="例）09012345678"
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-sm font-semibold text-slate-700">メモ</div>
                  <textarea
                    className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-[#173b7a] focus:outline-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="注意事項など"
                  />
                </label>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button
                    className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                    onClick={() => router.push("/patients")}
                  >
                    戻る
                  </button>
                  <button
                    className={cn(
                      "rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] px-6 py-3 text-sm font-extrabold text-white shadow hover:opacity-95",
                      (!canSave || saving) && "opacity-60"
                    )}
                    disabled={!canSave || saving}
                    onClick={save}
                  >
                    {saving ? "更新中..." : "更新する"}
                  </button>
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