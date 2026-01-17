// web/src/lib/mockResult.ts
import { recommendSportsTop6, pickFocusTrainings, type AbilityKey, type AgeGroup } from "./recoMaster";

type Sex = "male" | "female";

type Ability = {
  key: AbilityKey;
  label: string;
  t: number;
  grade_10: number;
};

type TestScore = {
  key: string;
  label: string;
  value: number;
  unit: string;
  t: number;
  grade_10: number;
};

function ageToGroup(age: number): AgeGroup {
  if (age <= 9) return "U9";
  if (age <= 12) return "U12";
  return "U15";
}

function abilityLabel(key: AbilityKey) {
  switch (key) {
    case "strength": return "筋力";
    case "power": return "瞬発力";
    case "speed": return "スピード";
    case "agility": return "敏捷性";
    case "repeat": return "反復パワー";
    case "throw": return "投力";
  }
}

function toAbilityScoreMap(abilities: Ability[]) {
  return {
    strength: abilities.find(a => a.key === "strength")!,
    power: abilities.find(a => a.key === "power")!,
    speed: abilities.find(a => a.key === "speed")!,
    agility: abilities.find(a => a.key === "agility")!,
    repeat: abilities.find(a => a.key === "repeat")!,
    throw: abilities.find(a => a.key === "throw")!,
  };
}

function pickLow2Abilities(abilities: Ability[]): AbilityKey[] {
  return [...abilities]
    .sort((a, b) => a.t - b.t)
    .slice(0, 2)
    .map(a => a.key);
}

// ===================== 仮データ（APIレスポンス想定の完成JSON） =====================
const measured_at = "2026-01-15";

const user = {
  display_name: "服部 太郎",
  age: 10,
  sex: "male" as Sex,
  school_grade_label: "小学4年",
  height_cm: 140,
  weight_kg: 35,
};

const tests: TestScore[] = [
  { key: "grip", label: "握力(平均)", value: 19.0, unit: "kg", t: 57.4, grade_10: 9 },
  { key: "standing_jump", label: "立ち幅跳び", value: 150.0, unit: "cm", t: 55.3, grade_10: 8 },
  { key: "dash_15m_sec", label: "15m走", value: 3.2, unit: "秒", t: 65.0, grade_10: 10 },
  { key: "continuous_standing_jump", label: "連続立ち幅跳び(合計)", value: 420.0, unit: "cm", t: 35.0, grade_10: 2 },
  { key: "squat_30s", label: "30秒スクワット", value: 25.0, unit: "回", t: 47.5, grade_10: 6 },
  { key: "side_step", label: "反復横跳び", value: 35.0, unit: "回", t: 48.0, grade_10: 6 },
  { key: "ball_throw", label: "ボール投げ", value: 12.0, unit: "m", t: 50.0, grade_10: 7 },
];

const abilities: Ability[] = [
  { key: "strength", label: "筋力", t: 53.5, grade_10: 8 },
  { key: "power", label: "瞬発力", t: 45.2, grade_10: 5 },
  { key: "speed", label: "スピード", t: 65.0, grade_10: 10 },
  { key: "agility", label: "敏捷性", t: 48.0, grade_10: 6 },
  { key: "throw", label: "投力", t: 50.0, grade_10: 7 },
  { key: "repeat", label: "反復パワー", t: 40.0, grade_10: 3 },
];

const overall = { t: 50.3, grade_10: 7 };
const ageGroup = ageToGroup(user.age);
const abilityMap = toAbilityScoreMap(abilities);
const low2 = pickLow2Abilities(abilities);

const sports_top6 = recommendSportsTop6(abilityMap);
const trainings_focus = pickFocusTrainings(ageGroup, low2, 2).map((t) => ({
  rank: t.rank,
  title: t.title,
  target_ability: t.target[0] as AbilityKey,
  target_ability_label: abilityLabel(t.target[0] as AbilityKey),
  reps: t.reps,
  howto: t.howto,
  effect: "下位能力の底上げ", // 仮（後で種目別に効果文を作り分け可）
}));

export const MOCK_RESULT = {
  meta: { measured_at },

  user,

  summary: {
    overall,
    motor_age: {
      value: 10,
      message: "あなたの運動器年齢は、実年齢と同じくらいです。",
    },
    type: {
      key: "growth:speed",
      title: "スピード成長タイプ",
      description: "走る力が強み。反復パワーや連続ジャンプ系を伸ばすとさらに伸びます。",
    },
    class_band: {
      recommended: "B",
      bands: [
        { key: "A", label: "Aクラス" },
        { key: "B", label: "Bクラス" },
        { key: "C", label: "Cクラス" },
      ],
    },
  },

  tests,
  abilities,

  detail: {
    cta: {
      title: "詳細診断で「得意・苦手」と「伸ばし方」がわかる！",
      subtitle: "適性スポーツ・重点トレ・1ヶ月目標をまとめてチェック",
    },

    // ★ここが自動生成
    sports_top6,

    // ★ここが自動生成
    trainings_focus,

    guardians: {
      stage_title: "いまは“運動の土台づくり”の時期です",
      stage_description: "得意を伸ばしつつ、苦手を少しずつ改善すると全体が伸びやすいです。",
      points_title: "ポイント",
      points_text: "週2〜3回、短時間でもOK。継続が最重要です。",
      caution_title: "注意",
      caution_text: "痛みが出たら休み、無理をさせないでください。",
      support_title: "ご家庭でのサポート",
      support_text: "声かけ・フォーム確認・安全確保をお願いします。",
      qr_left_label: "運動のコツ",
      qr_right_label: "トレ一覧",
      qr_note: "※QRは後で差し替えます",
    },

    targets_1month: {
      title: "1ヶ月の目標（例）",
      items: [
        { label: "連続立ち幅", now_label: "いま", target_label: "+20cm" },
        { label: "反復横跳び", now_label: "いま", target_label: "+3回" },
        { label: "30秒スクワット", now_label: "いま", target_label: "+3回" },
      ],
    },
  },
} as const;