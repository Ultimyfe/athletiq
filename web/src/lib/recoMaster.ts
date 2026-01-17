// web/src/lib/recoMaster.ts
export type AbilityKey = "strength" | "power" | "speed" | "agility" | "repeat" | "throw";
export type AgeGroup = "U9" | "U12" | "U15";

type AbilityScore = { t: number; grade_10: number };
export type AbilityScoreMap = Record<AbilityKey, AbilityScore>;

type SportCategory =
  | "athletics_sprint"
  | "athletics_endurance"
  | "athletics_field"
  | "team_ball"
  | "racket"
  | "combat"
  | "gymnastics"
  | "swim"
  | "dance"
  | "other";

type SportMaster = {
  key: string;
  sport: string;
  icon_emoji?: string;
  category: SportCategory;
  w: Partial<Record<AbilityKey, number>>;
  note?: string;
};

export type SportReco = {
  rank: number;
  sport: string;
  score: number; // 表示用 0-100
  icon_emoji?: string;
  category: SportCategory;
  key: string;

  // ★AIっぽさ（理由）
  why?: string;
  reasons?: string[];
};

type TrainingMaster = {
  id: string;
  title: string;
  target: AbilityKey[];
  ageGroups: AgeGroup[];
  reps: string;
  howto: string;
};

type FocusTraining = TrainingMaster & { rank: number };

// ===== util =====
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// 偏差値T=50±10前提で z に変換（ざっくり）
function tToZ(t: number) {
  return (t - 50) / 10;
}

function abilityZ(map: AbilityScoreMap): Record<AbilityKey, number> {
  return {
    strength: tToZ(map.strength.t),
    power: tToZ(map.power.t),
    speed: tToZ(map.speed.t),
    agility: tToZ(map.agility.t),
    repeat: tToZ(map.repeat.t),
    throw: tToZ(map.throw.t),
  };
}

function dot(w: Partial<Record<AbilityKey, number>>, z: Record<AbilityKey, number>) {
  let s = 0;
  (Object.keys(w) as AbilityKey[]).forEach((k) => {
    s += (w[k] ?? 0) * z[k];
  });
  return s;
}

function abilityLabel(k: AbilityKey) {
  switch (k) {
    case "strength": return "筋力";
    case "power": return "瞬発力";
    case "speed": return "スピード";
    case "agility": return "敏捷性";
    case "repeat": return "反復パワー";
    case "throw": return "投力";
  }
}

function topAbilities(z: Record<AbilityKey, number>, n: number) {
  return (Object.keys(z) as AbilityKey[])
    .map((k) => ({ k, v: z[k] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((x) => x.k);
}

function lowAbilities(z: Record<AbilityKey, number>, n: number) {
  return (Object.keys(z) as AbilityKey[])
    .map((k) => ({ k, v: z[k] }))
    .sort((a, b) => a.v - b.v)
    .slice(0, n)
    .map((x) => x.k);
}

/**
 * バランス型（③）：
 * - abilityFit: 能力×重み（本筋）
 * - funBonus: 続けやすさ/楽しさの軽い下駄（大きすぎない）
 * - riskPenalty: 苦手が大きい能力を強く要求する競技は控える
 * - diversity: 同カテゴリ最大2
 * - athletics補正: 短距離が入ったら持久も混ぜる（違和感対策）
 */
function funBonusByCategory(cat: SportCategory) {
  switch (cat) {
    case "team_ball": return 0.06;
    case "racket": return 0.05;
    case "swim": return 0.05;
    case "gymnastics": return 0.04;
    case "dance": return 0.04;
    case "other": return 0.04;
    case "athletics_sprint": return 0.03;
    case "athletics_endurance": return 0.03;
    case "athletics_field": return 0.03;
    case "combat": return -0.02; // ケガ/痛みの懸念を軽く反映（将来設定で可変にしてもOK）
  }
}

function demandPenalty(w: Partial<Record<AbilityKey, number>>, z: Record<AbilityKey, number>) {
  // 「その競技が必要とする能力」が大きくマイナスのときに軽く罰点
  // 例：repeatがかなり低いのに長距離を強く薦めない
  let p = 0;
  (Object.keys(w) as AbilityKey[]).forEach((k) => {
    const wk = w[k] ?? 0;
    if (wk <= 0) return;
    const zk = z[k];

    // -0.8より下は「苦手寄り」扱い（0.8はだいたい偏差値42相当）
    const lack = Math.max(0, -0.8 - zk);
    p += wk * lack;
  });

  // 罰点係数（大きすぎると推薦が不自然になるので控えめ）
  return p * 0.25;
}

function buildWhy(
  sport: SportMaster,
  z: Record<AbilityKey, number>
): { why: string; reasons: string[] } {
  const contrib = (Object.keys(sport.w) as AbilityKey[])
    .map((k) => ({
      k,
      // “重み×強み”として寄与を計算（マイナスは理由にしない）
      v: (sport.w[k] ?? 0) * z[k],
    }))
    .filter((x) => x.v > 0.02)
    .sort((a, b) => b.v - a.v);

  const top = contrib.slice(0, 2).map((x) => x.k);
  const topText = top.map((k) => abilityLabel(k)).join("×");

  const reasons: string[] = [];
  if (top[0]) reasons.push(`${abilityLabel(top[0])}が活きる`);
  if (top[1]) reasons.push(`${abilityLabel(top[1])}も相性が良い`);

  // 競技カテゴリで一言（説明っぽさ）
  const catHint =
    sport.category === "athletics_endurance"
      ? "長く動き続ける力が評価されやすい"
      : sport.category === "athletics_sprint"
      ? "一瞬の加速が強みになりやすい"
      : sport.category === "athletics_field"
      ? "跳ぶ/投げる動きが強みに直結しやすい"
      : sport.category === "team_ball"
      ? "状況判断と動き直しが多い"
      : sport.category === "racket"
      ? "切り返しと反応が多い"
      : sport.category === "swim"
      ? "全身連動と反復が伸びやすい"
      : sport.category === "gymnastics"
      ? "基礎運動能力が伸びやすい"
      : sport.category === "dance"
      ? "リズムと体のコントロールが伸びる"
      : "遊びの中で続けやすい";

  if (catHint) reasons.push(catHint);

  const why = topText ? `${topText}を活かせる` : "総合的に相性が良い";
  return { why, reasons };
}

// ===== スポーツマスタ（増量版） =====
const SPORT_MASTER: SportMaster[] = [
  // 陸上：短距離
  { key: "track_100_200", sport: "陸上（短距離）", icon_emoji: "🏃‍♂️", category: "athletics_sprint", w: { speed: 0.55, power: 0.25, agility: 0.10, repeat: 0.10 } },
  { key: "track_hurdle", sport: "陸上（ハードル）", icon_emoji: "🏃‍♀️", category: "athletics_sprint", w: { speed: 0.40, agility: 0.30, power: 0.20, repeat: 0.10 } },
  { key: "track_relay", sport: "陸上（リレー）", icon_emoji: "🏃‍♂️", category: "athletics_sprint", w: { speed: 0.45, agility: 0.20, power: 0.20, repeat: 0.15 } },

  // 陸上：中長距離
  { key: "track_middle", sport: "陸上（中距離）", icon_emoji: "🏃", category: "athletics_endurance", w: { repeat: 0.55, speed: 0.20, strength: 0.15, agility: 0.10 } },
  { key: "track_long", sport: "陸上（長距離）", icon_emoji: "🏃", category: "athletics_endurance", w: { repeat: 0.65, strength: 0.20, speed: 0.10, agility: 0.05 } },

  // 陸上：跳・投
  { key: "track_long_jump", sport: "走幅跳", icon_emoji: "🦘", category: "athletics_field", w: { power: 0.45, speed: 0.25, strength: 0.20, agility: 0.10 } },
  { key: "track_high_jump", sport: "走高跳", icon_emoji: "🦘", category: "athletics_field", w: { power: 0.40, agility: 0.20, strength: 0.20, speed: 0.20 } },
  { key: "track_throw", sport: "投てき（やり投げ等）", icon_emoji: "🎯", category: "athletics_field", w: { throw: 0.50, strength: 0.30, power: 0.20 } },

  // チーム球技
  { key: "soccer", sport: "サッカー", icon_emoji: "⚽", category: "team_ball", w: { agility: 0.30, repeat: 0.30, speed: 0.20, power: 0.10, strength: 0.10 } },
  { key: "basketball", sport: "バスケットボール", icon_emoji: "🏀", category: "team_ball", w: { agility: 0.30, power: 0.25, speed: 0.20, repeat: 0.15, strength: 0.10 } },
  { key: "baseball", sport: "野球", icon_emoji: "⚾", category: "team_ball", w: { throw: 0.35, power: 0.25, agility: 0.15, speed: 0.15, strength: 0.10 } },
  { key: "softball", sport: "ソフトボール", icon_emoji: "🥎", category: "team_ball", w: { throw: 0.30, power: 0.25, agility: 0.20, speed: 0.15, strength: 0.10 } },
  { key: "rugby", sport: "ラグビー", icon_emoji: "🏉", category: "team_ball", w: { strength: 0.35, power: 0.25, repeat: 0.20, speed: 0.10, agility: 0.10 } },
  { key: "handball", sport: "ハンドボール", icon_emoji: "🤾", category: "team_ball", w: { throw: 0.30, agility: 0.25, power: 0.20, repeat: 0.15, speed: 0.10 } },
  { key: "volleyball", sport: "バレーボール", icon_emoji: "🏐", category: "team_ball", w: { power: 0.35, agility: 0.25, strength: 0.20, speed: 0.10, repeat: 0.10 } },
  { key: "dodgeball", sport: "ドッジボール", icon_emoji: "🎯", category: "team_ball", w: { throw: 0.35, agility: 0.25, speed: 0.20, power: 0.10, repeat: 0.10 } },

  // ラケット
  { key: "tennis", sport: "テニス", icon_emoji: "🎾", category: "racket", w: { agility: 0.35, speed: 0.20, power: 0.20, repeat: 0.15, strength: 0.10 } },
  { key: "table_tennis", sport: "卓球", icon_emoji: "🏓", category: "racket", w: { agility: 0.45, speed: 0.25, power: 0.10, repeat: 0.15, strength: 0.05 } },
  { key: "badminton", sport: "バドミントン", icon_emoji: "🏸", category: "racket", w: { agility: 0.40, power: 0.20, speed: 0.20, repeat: 0.15, strength: 0.05 } },

  // 格闘
  { key: "judo", sport: "柔道", icon_emoji: "🥋", category: "combat", w: { strength: 0.40, power: 0.25, agility: 0.20, repeat: 0.15 } },
  { key: "karate", sport: "空手", icon_emoji: "🥋", category: "combat", w: { power: 0.35, speed: 0.20, agility: 0.25, repeat: 0.20 } },

  // 体操/基礎
  { key: "gymnastics", sport: "体操", icon_emoji: "🤸", category: "gymnastics", w: { strength: 0.30, power: 0.25, agility: 0.25, repeat: 0.20 } },
  { key: "parkour", sport: "パルクール（基礎運動）", icon_emoji: "🧗", category: "gymnastics", w: { agility: 0.35, power: 0.25, strength: 0.20, speed: 0.10, repeat: 0.10 } },

  // 水泳
  { key: "swim_sprint", sport: "水泳（短距離）", icon_emoji: "🏊", category: "swim", w: { power: 0.35, strength: 0.25, speed: 0.20, repeat: 0.20 } },
  { key: "swim_middle", sport: "水泳（中長距離）", icon_emoji: "🏊", category: "swim", w: { repeat: 0.50, strength: 0.20, power: 0.15, speed: 0.15 } },

  // ダンス
  { key: "dance", sport: "ダンス", icon_emoji: "💃", category: "dance", w: { agility: 0.35, repeat: 0.25, speed: 0.15, power: 0.10, strength: 0.15 } },

  // その他
  { key: "skate", sport: "スケート（基礎）", icon_emoji: "⛸️", category: "other", w: { agility: 0.30, strength: 0.25, power: 0.20, repeat: 0.15, speed: 0.10 } },
];

// ===== スポーツ推薦（TOP6） =====
export function recommendSportsTop6(abilityMap: AbilityScoreMap): SportReco[] {
  const z = abilityZ(abilityMap);
  const top2 = topAbilities(z, 2);
  const low2 = lowAbilities(z, 2);

  const scored = SPORT_MASTER
    .map((s) => {
      // ①能力適合（本筋）
      const abilityFit = dot(s.w, z);

      // ②続けやすさ（軽い下駄）
      const fun = funBonusByCategory(s.category);

      // ③苦手能力が強要求のとき控える（軽い罰点）
      const penalty = demandPenalty(s.w, z);

      // ④“成長の余地”も少し評価（低い能力を少し要求する競技は、伸び代として加点）
      // ただしやり過ぎると不自然なのでかなり控えめ
      let growth = 0;
      (Object.keys(s.w) as AbilityKey[]).forEach((k) => {
        const wk = s.w[k] ?? 0;
        if (wk <= 0) return;
        if (low2.includes(k)) growth += wk * 0.03;
      });

      const raw = abilityFit + fun + growth - penalty;

      // 理由生成（AIっぽさ）
      const { why, reasons } = buildWhy(s, z);

      // 表示用 0-100 に整形（rawはだいたい -1.5〜+1.5 程度を想定）
      const score100 = clamp(55 + raw * 18, 0, 100);

      return { ...s, raw, score100, why, reasons, top2, low2 };
    })
    .sort((a, b) => b.raw - a.raw);

  // 多様性：同カテゴリ最大2
  const picked: typeof scored = [];
  const catCount = new Map<SportCategory, number>();

  for (const s of scored) {
    const c = catCount.get(s.category) ?? 0;
    if (c >= 2) continue;
    picked.push(s);
    catCount.set(s.category, c + 1);
    if (picked.length >= 6) break;
  }

  // 足りない場合は埋める
  if (picked.length < 6) {
    for (const s of scored) {
      if (picked.find((p) => p.key === s.key)) continue;
      picked.push(s);
      if (picked.length >= 6) break;
    }
  }

  // 陸上の違和感補正：短距離が入ったら持久も混ぜる（上位12位から）
  const hasSprint = picked.some((p) => p.category === "athletics_sprint");
  const hasEndurance = picked.some((p) => p.category === "athletics_endurance");

  if (hasSprint && !hasEndurance) {
    const enduranceCandidate = scored.slice(0, 12).find((s) => s.category === "athletics_endurance");
    if (enduranceCandidate) {
      picked[picked.length - 1] = enduranceCandidate;
    }
  }

  // 仕上げ：rank + 表示コメント（トップ能力も一言足すとAIっぽい）
  return picked.map((p, i) => {
    const extra =
      p.why && p.reasons
        ? `（強み：${top2.map(abilityLabel).join("・")}）`
        : "";

    return {
      rank: i + 1,
      key: p.key,
      sport: p.sport,
      score: Number(p.score100.toFixed(1)),
      icon_emoji: p.icon_emoji,
      category: p.category,
      why: p.why ? `${p.why}${extra}` : undefined,
      reasons: p.reasons,
    };
  });
}

// ===== トレーニングDB（60種目） =====
const TRAINING_MASTER: TrainingMaster[] = [
  // strength 10
  { id: "st_01", title: "壁スクワット", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "10回×2", howto: "壁に背中をつけてゆっくり座る→立つ。膝はつま先より前に出しすぎない。" },
  { id: "st_02", title: "ハーフスクワット", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "12回×2", howto: "腰を落としすぎずに、テンポよくしゃがむ→立つ。" },
  { id: "st_03", title: "つま先立ち（カーフ）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "15回×2", howto: "かかとを上げ下げ。ふらつくなら壁に手をつく。" },
  { id: "st_04", title: "タオル引っぱり", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "10秒×4", howto: "タオルを両手で持って引っぱり合い（親子でもOK）。肩をすくめない。" },
  { id: "st_05", title: "イス腕立て（斜め）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "8回×2", howto: "イスに手をつき、体をまっすぐのまま胸を近づける→戻す。" },
  { id: "st_06", title: "プランク（基本）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "ひじをついて体を一直線。腰が落ちたり反りすぎない。" },
  { id: "st_07", title: "片脚立ちキープ", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "左右20秒×2", howto: "片脚で立ってバランス。慣れたら目線を固定。" },
  { id: "st_08", title: "ブリッジ（お尻上げ）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "12回×2", howto: "仰向けで膝を立て、お尻を上げる→下ろす。腰ではなくお尻を意識。" },
  { id: "st_09", title: "クマ歩き（ゆっくり）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "10m×2", howto: "四つん這いで膝を少し浮かせて前進。背中を丸めすぎない。" },
  { id: "st_10", title: "階段のぼり（ゆっくり）", target: ["strength"], ageGroups: ["U9","U12","U15"], reps: "1分×2", howto: "安全な段差でゆっくり上り下り。手すりがある場所で。" },

  // power 10
  { id: "pw_01", title: "その場ジャンプ", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "10回×2", howto: "ひざと腕を使って高くジャンプ。着地は静かに。" },
  { id: "pw_02", title: "スキップジャンプ", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "20回", howto: "スキップを大きく。腕振りをしっかり。" },
  { id: "pw_03", title: "立ち幅ジャンプ練習", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "5回×2", howto: "腕を振って遠くへ。着地は両足で安定。" },
  { id: "pw_04", title: "カエルジャンプ", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "10回", howto: "しゃがんで前へピョン。腰を反らさない。" },
  { id: "pw_05", title: "ジャンプ→止まる", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "8回", howto: "ジャンプ後に2秒ピタッと止まる（着地の強さも鍛える）。" },
  { id: "pw_06", title: "サイドジャンプ", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "左右10回", howto: "左右に素早く跳ぶ。体が流れないように。" },
  { id: "pw_07", title: "段差ジャンプ（低）", target: ["power"], ageGroups: ["U12","U15"], reps: "6回×2", howto: "低い段に飛び乗る。安全最優先、無理しない。" },
  { id: "pw_08", title: "バウンディング（小さく）", target: ["power"], ageGroups: ["U12","U15"], reps: "10歩×2", howto: "大きく前へ弾む。着地は前足で受けすぎない。" },
  { id: "pw_09", title: "もも上げジャンプ", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "10回", howto: "片脚ずつもも上げ→ジャンプ。姿勢をまっすぐ。" },
  { id: "pw_10", title: "連続ジャンプ（小さく）", target: ["power"], ageGroups: ["U9","U12","U15"], reps: "15回", howto: "小さく連続で跳ぶ。リズムよく。" },

  // speed 10
  { id: "sp_01", title: "もも上げ（その場）", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "腕振りもつけてテンポよく。上体を倒しすぎない。" },
  { id: "sp_02", title: "腕振り練習", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "肘を後ろに引く意識。肩に力を入れない。" },
  { id: "sp_03", title: "スタート反応（合図でダッシュ）", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "5本", howto: "合図で3〜5mダッシュ。反応を速くする。" },
  { id: "sp_04", title: "3mダッシュ", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "6本", howto: "短く全力。休憩は長めに。" },
  { id: "sp_05", title: "5mダッシュ", target: ["speed"], ageGroups: ["U12","U15"], reps: "6本", howto: "フォームを崩さず全力。" },
  { id: "sp_06", title: "坂道ダッシュ（ゆるい坂）", target: ["speed"], ageGroups: ["U12","U15"], reps: "4本", howto: "安全な坂で短く。無理はしない。" },
  { id: "sp_07", title: "Aスキップ（小さく）", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "10m×2", howto: "もも上げと腕振りを合わせる。リズム優先。" },
  { id: "sp_08", title: "速歩き→ダッシュ", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "5本", howto: "速歩きから合図でダッシュへ切り替え。" },
  { id: "sp_09", title: "つま先タッチ（高速）", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "その場で足を素早く動かす。上体は安定。" },
  { id: "sp_10", title: "ラインまたぎ（高速）", target: ["speed"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "床の線を左右に素早くまたぐ。小さく速く。" },

  // agility 10
  { id: "ag_01", title: "反復横跳び（練習）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "左右に素早く。体が流れないように。" },
  { id: "ag_02", title: "ジグザグ走（コーンなし）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "10m×3", howto: "目印をジグザグに置いて走る。曲がる時に小さく刻む。" },
  { id: "ag_03", title: "サイドステップ（大きく）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "腰を落として横移動。足を交差しない。" },
  { id: "ag_04", title: "前→横→後（ステップ）", target: ["agility"], ageGroups: ["U12","U15"], reps: "20秒×2", howto: "前・横・後ろへ素早く動く。目線は前。" },
  { id: "ag_05", title: "ターン練習（180度）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "左右5回×2", howto: "合図でクルッと回って走る。軸足を意識。" },
  { id: "ag_06", title: "ケンケン（左右）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "左右10回", howto: "片脚でリズムよく。着地を安定させる。" },
  { id: "ag_07", title: "ラダー風（マス目）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "床のマス目をイメージして細かく足を動かす。" },
  { id: "ag_08", title: "タッチ&ゴー", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "6本", howto: "2m先の線をタッチして戻る。切り返し重視。" },
  { id: "ag_09", title: "横ジャンプ→止まる", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "左右8回", howto: "横に跳んでピタッと止める。体幹も意識。" },
  { id: "ag_10", title: "動物歩き（カニ歩き）", target: ["agility"], ageGroups: ["U9","U12","U15"], reps: "10m×2", howto: "お尻を浮かせて横移動。楽しみながら。" },

  // repeat 10
  { id: "rp_01", title: "軽いジョグ（その場）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "1分", howto: "その場で軽く走る。呼吸が乱れない強さで。" },
  { id: "rp_02", title: "ジャンピングジャック", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "手足を開閉。テンポよく。" },
  { id: "rp_03", title: "スキップ（連続）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "楽しく連続。腕振りをつける。" },
  { id: "rp_04", title: "マウンテンクライマー（軽め）", target: ["repeat"], ageGroups: ["U12","U15"], reps: "20秒×2", howto: "腕立て姿勢で脚を交互に引く。腰が落ちないように。" },
  { id: "rp_05", title: "階段のぼり（テンポ）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "1分×2", howto: "安全にテンポよく上り下り。" },
  { id: "rp_06", title: "連続立ち幅（練習）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "10回", howto: "連続で跳び続ける。着地を柔らかく。" },
  { id: "rp_07", title: "スクワット（テンポ）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "20秒×2", howto: "速すぎず一定テンポで。" },
  { id: "rp_08", title: "その場サイドステップ（長め）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "30秒×2", howto: "横移動を長めに続ける。" },
  { id: "rp_09", title: "縄跳び（できる人）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "30秒×2", howto: "できる範囲で。つまずくなら無理しない。" },
  { id: "rp_10", title: "軽い鬼ごっこ（ダッシュ少なめ）", target: ["repeat"], ageGroups: ["U9","U12","U15"], reps: "3分", howto: "遊びの中で動く量を確保。安全に。" },

  // throw 10
  { id: "th_01", title: "タオル投げ", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "10回×2", howto: "丸めたタオルを遠くへ。投げ終わりまで体を回す。" },
  { id: "th_02", title: "壁当て（軽いボール）", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "20回", howto: "軽いボールで壁当て。フォームを丁寧に。" },
  { id: "th_03", title: "上投げフォーム練習", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "10回×2", howto: "腕だけでなく、足→腰→肩→腕の順で使う。" },
  { id: "th_04", title: "胸パス（ボール）", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "15回×2", howto: "胸から押し出す。肘を張りすぎない。" },
  { id: "th_05", title: "頭上投げ（軽め）", target: ["throw"], ageGroups: ["U12","U15"], reps: "8回×2", howto: "頭上から前へ。腰を反らしすぎない。" },
  { id: "th_06", title: "サイド投げ", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "10回×2", howto: "横から投げる練習。体の回転を使う。" },
  { id: "th_07", title: "片脚バランス投げ（軽め）", target: ["throw"], ageGroups: ["U12","U15"], reps: "左右8回", howto: "片脚でバランスを取りながら投げる。難しければ両脚でOK。" },
  { id: "th_08", title: "肩まわし（準備運動）", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "20回", howto: "肩を大きく回す。痛みが出ない範囲で。" },
  { id: "th_09", title: "体ひねり（体幹回旋）", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "左右10回×2", howto: "足を固定して上体を左右にひねる。" },
  { id: "th_10", title: "タオルスイング", target: ["throw"], ageGroups: ["U9","U12","U15"], reps: "左右10回", howto: "タオルを持って大きく振る。肩をすくめない。" },
];

// ===== 重点トレ抽出（下位能力×年齢） =====
export function pickFocusTrainings(
  ageGroup: AgeGroup,
  low2: AbilityKey[],
  perAbility: number
): FocusTraining[] {
  const picked: TrainingMaster[] = [];

  for (const k of low2) {
    const candidates = TRAINING_MASTER.filter(
      (t) => t.ageGroups.includes(ageGroup) && t.target.includes(k)
    );

    let countForK = 0;
    for (const c of candidates) {
      if (countForK >= perAbility) break;
      if (picked.find((p) => p.id === c.id)) continue;

      picked.push(c);
      countForK += 1;
    }
  }

  // 念のため：不足したら年齢一致の中から埋める（UIが寂しくならない）
  const need = low2.length * perAbility;
  if (picked.length < need) {
    const fillers = TRAINING_MASTER.filter((t) => t.ageGroups.includes(ageGroup));
    for (const f of fillers) {
      if (picked.length >= need) break;
      if (picked.find((p) => p.id === f.id)) continue;
      picked.push(f);
    }
  }

  return picked.map((t, i) => ({ ...t, rank: i + 1 }));
}