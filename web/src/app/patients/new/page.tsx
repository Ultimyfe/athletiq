"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Sex = "male" | "female";

type FormState = {
  last_name: string;
  first_name: string;
  birth_date: string; // YYYY-MM-DD
  sex: Sex | "";
  school_name: string;
  guardian_name: string;
  guardian_phone: string; // digits only
  notes: string;
};

const initialState: FormState = {
  last_name: "",
  first_name: "",
  birth_date: "",
  sex: "",
  school_name: "",
  guardian_name: "",
  guardian_phone: "",
  notes: "",
};

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

/** 全角数字→半角、数字以外は除去 */
function normalizeDigitsOnly(input: string) {
  const half = input.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
  return half.replace(/[^0-9]/g, "");
}

export default function PatientNewPage() {
  const router = useRouter();

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>("");

  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

useEffect(() => {
  const token = localStorage.getItem("access_token");
  const cid = localStorage.getItem("clinic_id");
  const cname = localStorage.getItem("clinic_name") ?? "";

  if (!token) {
    router.push("/login");
    return;
  }
  
  if (!cid) {
    router.push("/login");
    return;
  }
  
  setClinicId(cid);
  setClinicName(cname);
}, [router]);

  const update = <K extends keyof FormState>(k: K, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const validate = () => {
    const missing: string[] = [];
    if (!form.last_name.trim()) missing.push("姓");
    if (!form.first_name.trim()) missing.push("名");
    if (!form.birth_date.trim()) missing.push("生年月日");
    if (!form.sex) missing.push("性別");

    if (missing.length) {
      setError(`未入力があります：${missing.join("、")}`);
      return false;
    }

    // date inputでも念のため軽チェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date.trim())) {
      setError("生年月日は YYYY-MM-DD 形式で入力してください（例：2016-05-10）");
      return false;
    }

    // 電話：入っているなら数字のみ＆桁数（日本の携帯/固定のざっくり想定）
    const phone = form.guardian_phone.trim();
    if (phone) {
      if (!/^\d+$/.test(phone)) {
        setError("保護者連絡先は数字のみで入力してください（ハイフン不要）");
        return false;
      }
      if (phone.length < 10 || phone.length > 11) {
        setError("保護者連絡先は10〜11桁の数字で入力してください（ハイフン不要）");
        return false;
      }
    }

    return true;
  };

  const submit = async (next: "list" | "measure") => {
    if (!clinicId) return;
    if (!validate()) return;

    if (!apiBase) {
      setError("NEXT_PUBLIC_API_BASE_URL が未設定です（.env.local を確認）");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        clinic_id: Number(clinicId),
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        birth_date: form.birth_date.trim(), // API側で CAST(:birth_date AS date)
        sex: form.sex as Sex,
        school_name: form.school_name.trim() || null,
        guardian_name: form.guardian_name.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null, // digits only
        notes: form.notes.trim() || null,
      };

      // const res = await fetch(`${apiBase}/patients`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      const token = localStorage.getItem("access_token");

      const res = await fetch(`${apiBase}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `受検者登録に失敗しました (HTTP ${res.status})`);
      }

      const data = await res.json();
      const patientId = data?.patient_id;
      if (!patientId) throw new Error("patient_id が返ってきませんでした");

      if (next === "measure") {
        router.push(`/measure?patient_id=${patientId}`);
      } else {
        router.push("/patients");
      }
    } catch (e: any) {
      setError(e?.message ?? "不明なエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        {/* 上部 */}
        <div className="mb-6 flex items-center justify-between text-white/85">
          <button
            className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => router.push("/patients")}
          >
            ←受検者一覧に戻る
          </button>

          <div className="text-right">
            <div className="text-xs text-white/60">Athletiq Clinic Console</div>
            <div className="text-sm font-semibold text-white/80">
              {clinicName ? clinicName : ""}
            </div>
          </div>
        </div>

        {/* 本体カード */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="border-b px-8 py-6">
            <h1 className="text-xl font-extrabold text-[#173b7a]">受検者の新規登録</h1>
            <p className="mt-1 text-sm text-slate-500">
              必須：姓・名・生年月日・性別（保存後に測定へ進めます）
            </p>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="姓 *">
                <input
                  className="field-input"
                  placeholder="例：田中"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                />
              </Field>

              <Field label="名 *">
                <input
                  className="field-input"
                  placeholder="例：花子"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                />
              </Field>

              <Field label="生年月日 *" note="YYYY-MM-DD">
                <input
                  type="date"
                  className="field-input"
                  value={form.birth_date}
                  onChange={(e) => update("birth_date", e.target.value)}
                />
              </Field>

              <Field label="性別 *">
                <select
                  className="field-input"
                  value={form.sex}
                  onChange={(e) => update("sex", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="male">男子</option>
                  <option value="female">女子</option>
                </select>
              </Field>

              <Field label="学校名">
                <input
                  className="field-input"
                  placeholder="例：〇〇市立△△小学校"
                  value={form.school_name}
                  onChange={(e) => update("school_name", e.target.value)}
                />
              </Field>

              <Field label="保護者名">
                <input
                  className="field-input"
                  placeholder="例：田中一郎"
                  value={form.guardian_name}
                  onChange={(e) => update("guardian_name", e.target.value)}
                />
              </Field>

              <Field label="保護者連絡先" note="数字のみ（ハイフン不要）">
                <input
                  className="field-input"
                  placeholder="例：09099998888"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  value={form.guardian_phone}
                  onChange={(e) => update("guardian_phone", normalizeDigitsOnly(e.target.value))}
                />
              </Field>

              <Field label="メモ">
                <input
                  className="field-input"
                  placeholder="例：日付/イベント名"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                disabled={saving}
                onClick={() => submit("list")}
                className={cn(
                  "h-12 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50",
                  saving && "opacity-60"
                )}
              >
                保存して一覧へ
              </button>

              <button
                disabled={saving}
                onClick={() => submit("measure")}
                className={cn(
                  "h-12 rounded-xl bg-gradient-to-r from-[#173b7a] to-[#2a61c9] text-sm font-extrabold text-white shadow hover:opacity-95",
                  saving && "opacity-60"
                )}
              >
                保存して測定へ →
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500">
              ※ clinic_id は localStorage の値を内部で使用します
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
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