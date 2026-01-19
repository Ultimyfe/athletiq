import { getApiBaseUrl, requireAuthHeaders } from "./api";

export type DiagnosePayload = {
  age: number;
  sex: "male" | "female";
  grip_right: number;
  grip_left: number;
  standing_jump: number;
  dash_15m_sec: number;
  continuous_standing_jump: number;
  squat_30s: number;
  side_step: number;
  ball_throw: number;
};

export type DiagnoseResponse = {
  summary: {
    age: number;
    sex: string;
    overall: { t: number; grade_10: number };
    motor_age: number;
    type: string;
  };
  tests: Array<{
    key: string;
    label: string;
    value: number;
    unit: string;
    t: number;
    grade_10: number;
  }>;
  abilities: Array<{
    key: string;
    label: string;
    t: number;
    grade_10: number;
  }>;
};

export async function diagnose(payload: DiagnosePayload): Promise<DiagnoseResponse> {
  const url = `${getApiBaseUrl()}/diagnose`;

  // トークン必須。ない場合は呼び出し元でログイン遷移してください。
  const headers = requireAuthHeaders();

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`diagnose failed: ${res.status} ${res.statusText} ${text}`);
  }

  return (await res.json()) as DiagnoseResponse;
}
// // web/src/lib/diagnose.ts

// export type DiagnosePayload = {
//   age: number;
//   sex: "male" | "female";
//   grip_right: number;
//   grip_left: number;
//   standing_jump: number;
//   dash_15m_sec: number;
//   continuous_standing_jump: number;
//   squat_30s: number;
//   side_step: number;
//   ball_throw: number;
// };

// export type DiagnoseResponse = {
//   summary: {
//     age: number;
//     sex: string;
//     overall: { t: number; grade_10: number };
//     motor_age: number;
//     type: string;
//   };
//   tests: Array<{
//     key: string;
//     label: string;
//     value: number;
//     unit: string;
//     t: number;
//     grade_10: number;
//   }>;
//   abilities: Array<{
//     key: string;
//     label: string;
//     t: number;
//     grade_10: number;
//   }>;
// };

// function getApiBaseUrl(): string {
//   const base = process.env.NEXT_PUBLIC_API_BASE_URL;
//   if (!base) {
//     throw new Error("NEXT_PUBLIC_API_BASE_URL is not set (.env.local)");
//   }
//   return base.replace(/\/+$/, "");
// }

// export async function diagnose(payload: DiagnosePayload): Promise<DiagnoseResponse> {
//   const url = `${getApiBaseUrl()}/diagnose`;

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       // Cloud Run が今 "no-allow-unauthenticated" のため、ブラウザから直接叩くと 401 になります。
//       // → Web側は後で「APIを公開する or Web経由でIDトークン付与」に寄せます（次ステップで整理します）。
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`diagnose failed: ${res.status} ${res.statusText} ${text}`);
//   }

//   return (await res.json()) as DiagnoseResponse;
// }