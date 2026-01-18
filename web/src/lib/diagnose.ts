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

  // Authorization を必須にする
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