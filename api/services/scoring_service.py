# api/services/scoring_service.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session


# =========================
# Exceptions
# =========================
class CalcError(Exception):
    pass


# =========================
# Meta / Labels
# =========================
TEST_KEYS = [
    "grip",
    "standing_jump",
    "dash_15m_sec",
    "continuous_standing_jump",
    "squat_30s",
    "side_step",
    "ball_throw",
]

TEST_META = {
    "grip": {"label": "握力", "unit": "kg"},
    "standing_jump": {"label": "立ち幅跳び", "unit": "cm"},
    "dash_15m_sec": {"label": "15m走", "unit": "秒"},
    "continuous_standing_jump": {"label": "連続立ち幅跳び（合計）", "unit": "cm"},
    "squat_30s": {"label": "30秒スクワット", "unit": "回"},
    "side_step": {"label": "反復横跳び", "unit": "回"},
    "ball_throw": {"label": "ボール投げ", "unit": "m"},
}

ABILITIES = ["strength", "power", "speed", "agility", "throw", "repeat"]

ABILITY_META = {
    "strength": {"label": "筋力"},
    "power": {"label": "瞬発力"},
    "speed": {"label": "スピード"},
    "agility": {"label": "敏捷性"},
    "throw": {"label": "投力"},
    "repeat": {"label": "反復パワー"},
}

# 「テスト → 能力」への寄与（超ざっくりの復元）
# dash は “低いほど良い” なのでスコア算出で反転します
TEST_TO_ABILITY_W = {
    "grip": {"strength": 1.0},
    "standing_jump": {"power": 0.9, "strength": 0.3},
    "dash_15m_sec": {"speed": 1.0, "agility": 0.2},
    "continuous_standing_jump": {"repeat": 0.9, "power": 0.3},
    "squat_30s": {"strength": 0.5, "repeat": 0.7},
    "side_step": {"agility": 1.0, "speed": 0.2},
    "ball_throw": {"throw": 1.0, "power": 0.3, "strength": 0.2},
}


# =========================
# Masters (DB不要)
# =========================
SPORT_MASTER: List[dict] = [
    {"sport": "サッカー", "emoji": "⚽️", "w": {"speed": 1.2, "agility": 1.2, "repeat": 1.0, "power": 0.6, "strength": 0.4, "throw": 0.1}},
    {"sport": "野球", "emoji": "⚾️", "w": {"throw": 1.3, "power": 1.0, "speed": 0.7, "agility": 0.7, "strength": 0.5, "repeat": 0.3}},
    {"sport": "バスケットボール", "emoji": "🏀", "w": {"power": 1.2, "agility": 1.0, "speed": 0.9, "repeat": 0.8, "strength": 0.6, "throw": 0.2}},
    {"sport": "バレーボール", "emoji": "🏐", "w": {"power": 1.3, "agility": 0.9, "speed": 0.7, "repeat": 0.7, "strength": 0.5, "throw": 0.2}},
    {"sport": "陸上（短距離）", "emoji": "🏃‍♂️", "w": {"speed": 1.5, "power": 1.1, "agility": 0.5, "repeat": 0.6, "strength": 0.3, "throw": 0.0}},
    {"sport": "陸上（中距離）", "emoji": "🏃", "w": {"repeat": 1.5, "speed": 1.0, "agility": 0.4, "power": 0.5, "strength": 0.3, "throw": 0.0}},
    {"sport": "体操", "emoji": "🤸", "w": {"agility": 1.4, "power": 1.0, "strength": 0.8, "repeat": 0.6, "speed": 0.4, "throw": 0.0}},
    {"sport": "水泳", "emoji": "🏊", "w": {"repeat": 1.3, "power": 0.8, "strength": 0.7, "speed": 0.7, "agility": 0.3, "throw": 0.0}},
    {"sport": "テニス", "emoji": "🎾", "w": {"agility": 1.2, "speed": 1.0, "power": 0.8, "repeat": 0.7, "strength": 0.4, "throw": 0.1}},
    {"sport": "卓球", "emoji": "🏓", "w": {"agility": 1.4, "speed": 1.0, "repeat": 0.8, "power": 0.4, "strength": 0.2, "throw": 0.0}},
    {"sport": "バドミントン", "emoji": "🏸", "w": {"agility": 1.3, "speed": 1.1, "repeat": 0.9, "power": 0.6, "strength": 0.3, "throw": 0.0}},
    {"sport": "柔道", "emoji": "🥋", "w": {"strength": 1.4, "power": 1.1, "agility": 0.6, "repeat": 0.8, "speed": 0.4, "throw": 0.1}},
    {"sport": "空手", "emoji": "🥋", "w": {"speed": 1.1, "agility": 1.0, "power": 1.0, "repeat": 0.8, "strength": 0.5, "throw": 0.0}},
    {"sport": "ラグビー", "emoji": "🏉", "w": {"strength": 1.4, "power": 1.2, "repeat": 0.8, "speed": 0.6, "agility": 0.6, "throw": 0.2}},
    {"sport": "ハンドボール", "emoji": "🤾", "w": {"throw": 1.3, "power": 1.0, "agility": 0.9, "speed": 0.7, "repeat": 0.7, "strength": 0.4}},
    {"sport": "ダンス", "emoji": "💃", "w": {"agility": 1.4, "repeat": 1.0, "speed": 0.6, "power": 0.6, "strength": 0.3, "throw": 0.0}},
    {"sport": "ボルダリング", "emoji": "🧗", "w": {"strength": 1.4, "agility": 0.8, "power": 0.8, "repeat": 0.7, "speed": 0.2, "throw": 0.0}},
]

# 60種目（復元：能力タグだけは使う）
TRAINING_MASTER: List[dict] = [
    # speed
    {"id": 1, "title": "もも上げ（20m）", "ability": "speed", "desc": "腕振りと姿勢を意識してリズム良く。", "freq": "週2回"},
    {"id": 2, "title": "スタートダッシュ（10m×5）", "ability": "speed", "desc": "最初の3歩を強く。休憩は長め。", "freq": "週2回"},
    {"id": 3, "title": "坂ダッシュ（短い坂）", "ability": "speed", "desc": "前傾を保って地面を押す。", "freq": "週1回"},
    {"id": 4, "title": "ミニハードル走", "ability": "speed", "desc": "接地を短く、テンポ優先。", "freq": "週2回"},
    {"id": 5, "title": "ラダードリル（基本）", "ability": "speed", "desc": "足を速く、視線は前。", "freq": "週2回"},
    {"id": 6, "title": "直線30m流し", "ability": "speed", "desc": "全力ではなくフォームを整える。", "freq": "週2回"},
    {"id": 7, "title": "リズムジャンプ（小刻み）", "ability": "speed", "desc": "反発をもらって軽く跳ぶ。", "freq": "週2回"},
    {"id": 8, "title": "スキップ（30m）", "ability": "speed", "desc": "膝とつま先の向きを揃える。", "freq": "週2回"},
    {"id": 9, "title": "バウンディング（軽め）", "ability": "speed", "desc": "遠くへより“強く押す”。", "freq": "週1回"},
    {"id": 10, "title": "フォーム走（動画チェック）", "ability": "speed", "desc": "腕振り・接地位置を確認。", "freq": "週1回"},

    # agility
    {"id": 11, "title": "サイドステップ（20秒×3）", "ability": "agility", "desc": "腰を落として小さく速く。", "freq": "週2回"},
    {"id": 12, "title": "切り返し（5-5m×6）", "ability": "agility", "desc": "減速→体の向き→加速の順。", "freq": "週2回"},
    {"id": 13, "title": "コーンジグザグ走", "ability": "agility", "desc": "頭を振らずに体幹で方向転換。", "freq": "週2回"},
    {"id": 14, "title": "リアクションダッシュ", "ability": "agility", "desc": "合図で左右にスタート。", "freq": "週1回"},
    {"id": 15, "title": "ラダー（インアウト）", "ability": "agility", "desc": "足音を小さく速く。", "freq": "週2回"},
    {"id": 16, "title": "片足バランス→タッチ", "ability": "agility", "desc": "片足で前後左右にタッチ。", "freq": "週2回"},
    {"id": 17, "title": "シャトルラン（短）", "ability": "agility", "desc": "ターンの“最後の一歩”を意識。", "freq": "週1回"},
    {"id": 18, "title": "ミラーゲーム（対面）", "ability": "agility", "desc": "相手の動きを真似る遊び練。", "freq": "週1回"},
    {"id": 19, "title": "小ジャンプ横移動", "ability": "agility", "desc": "膝を内側に入れない。", "freq": "週2回"},
    {"id": 20, "title": "クイックターン（その場）", "ability": "agility", "desc": "軸足を決めて素早く回る。", "freq": "週2回"},

    # power
    {"id": 21, "title": "スクワットジャンプ", "ability": "power", "desc": "着地は静かに。回数より質。", "freq": "週2回"},
    {"id": 22, "title": "立ち幅跳び（フォーム）", "ability": "power", "desc": "腕→膝→股関節の順で伸ばす。", "freq": "週2回"},
    {"id": 23, "title": "ボックスジャンプ（低め）", "ability": "power", "desc": "怖くない高さでOK。", "freq": "週1回"},
    {"id": 24, "title": "ケンケン（左右）", "ability": "power", "desc": "前へ進むより反発を意識。", "freq": "週2回"},
    {"id": 25, "title": "バウンスジャンプ（連続）", "ability": "power", "desc": "膝を固めず足首で弾む。", "freq": "週2回"},
    {"id": 26, "title": "メディシンボール投げ（前）", "ability": "power", "desc": "体幹を使って押し出す。", "freq": "週1回"},
    {"id": 27, "title": "ジャンプ＆着地練習", "ability": "power", "desc": "着地姿勢（膝・つま先）を整える。", "freq": "週2回"},
    {"id": 28, "title": "スプリットジャンプ", "ability": "power", "desc": "左右交互、フォーム優先。", "freq": "週1回"},
    {"id": 29, "title": "連続ジャンプ（10回）", "ability": "power", "desc": "反発を揃える。", "freq": "週2回"},
    {"id": 30, "title": "段差ジャンプ（低）", "ability": "power", "desc": "足元の安全優先。", "freq": "週1回"},

    # strength
    {"id": 31, "title": "自重スクワット", "ability": "strength", "desc": "膝とつま先を同じ向き。", "freq": "週3回"},
    {"id": 32, "title": "ランジ（左右）", "ability": "strength", "desc": "上体を立ててゆっくり。", "freq": "週2回"},
    {"id": 33, "title": "プッシュアップ（膝つき可）", "ability": "strength", "desc": "体を一直線に。", "freq": "週2回"},
    {"id": 34, "title": "懸垂ぶら下がり", "ability": "strength", "desc": "握る→肩を下げる。", "freq": "週2回"},
    {"id": 35, "title": "ヒップリフト", "ability": "strength", "desc": "お尻で持ち上げる。腰反らない。", "freq": "週2回"},
    {"id": 36, "title": "プランク（20〜40秒）", "ability": "strength", "desc": "お腹に力、腰を落とさない。", "freq": "週3回"},
    {"id": 37, "title": "カーフレイズ", "ability": "strength", "desc": "ゆっくり上げ下げ。", "freq": "週3回"},
    {"id": 38, "title": "壁イス（30秒）", "ability": "strength", "desc": "太ももに効かせる。", "freq": "週2回"},
    {"id": 39, "title": "タオル握り（10秒×5）", "ability": "strength", "desc": "握力の土台作り。", "freq": "週3回"},
    {"id": 40, "title": "背筋（軽め）", "ability": "strength", "desc": "反動なしでゆっくり。", "freq": "週2回"},

    # throw
    {"id": 41, "title": "壁当て（フォーム）", "ability": "throw", "desc": "肘の位置と体重移動を意識。", "freq": "週2回"},
    {"id": 42, "title": "タオルスロー", "ability": "throw", "desc": "肩肘を痛めない範囲で。", "freq": "週2回"},
    {"id": 43, "title": "ステップ投げ（助走1歩）", "ability": "throw", "desc": "前足着地→体幹回旋→腕。", "freq": "週2回"},
    {"id": 44, "title": "上体ひねり（左右）", "ability": "throw", "desc": "投げの“体幹”作り。", "freq": "週2回"},
    {"id": 45, "title": "ゴムチューブ引き", "ability": "throw", "desc": "肩甲骨を動かす。", "freq": "週2回"},
    {"id": 46, "title": "胸の前から押し投げ", "ability": "throw", "desc": "手だけで投げない。", "freq": "週2回"},
    {"id": 47, "title": "肩まわりストレッチ", "ability": "throw", "desc": "可動域を広げてフォーム改善。", "freq": "週3回"},
    {"id": 48, "title": "片手キャッチ（軽いボール）", "ability": "throw", "desc": "投げる前に“扱い”を上げる。", "freq": "週2回"},
    {"id": 49, "title": "的当て（距離調整）", "ability": "throw", "desc": "狙って投げる習慣。", "freq": "週1回"},
    {"id": 50, "title": "股関節→体幹連動ドリル", "ability": "throw", "desc": "下半身から上へ伝える。", "freq": "週1回"},

    # repeat
    {"id": 51, "title": "スクワット（30秒×3）", "ability": "repeat", "desc": "一定ペースで。", "freq": "週2回"},
    {"id": 52, "title": "ジャンプ連続（20秒）", "ability": "repeat", "desc": "疲れてもフォームを崩さない。", "freq": "週2回"},
    {"id": 53, "title": "階段のぼり（30秒）", "ability": "repeat", "desc": "安全第一。息を整える。", "freq": "週2回"},
    {"id": 54, "title": "サーキット（3種×2周）", "ability": "repeat", "desc": "短時間で全身。", "freq": "週2回"},
    {"id": 55, "title": "縄跳び（1分×3）", "ability": "repeat", "desc": "軽く弾む。", "freq": "週2回"},
    {"id": 56, "title": "シャトル（10m×10本）", "ability": "repeat", "desc": "全力より継続。", "freq": "週1回"},
    {"id": 57, "title": "連続立ち幅跳び（フォーム）", "ability": "repeat", "desc": "“同じ跳び”を揃える。", "freq": "週2回"},
    {"id": 58, "title": "テンポラン（軽）", "ability": "repeat", "desc": "話せる程度の強度で。", "freq": "週1回"},
    {"id": 59, "title": "反復横跳び（20秒×3）", "ability": "repeat", "desc": "足幅を一定に。", "freq": "週2回"},
    {"id": 60, "title": "全身リズム運動（5分）", "ability": "repeat", "desc": "継続できる形でOK。", "freq": "週3回"},
]


# =========================
# Helpers
# =========================
def _today() -> date:
    return date.today()


def calc_age_years_months(birth_date: date, today: Optional[date] = None) -> Tuple[int, int]:
    if today is None:
        today = _today()
    years = today.year - birth_date.year
    months = today.month - birth_date.month
    if today.day < birth_date.day:
        months -= 1
    if months < 0:
        years -= 1
        months += 12
    if years < 0:
        return (0, 0)
    return (years, months)


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def decile_from_t(t: float) -> int:
    # T=50を中心にざっくり10段階
    # 1:<=30, 2:<=35, 3:<=40, ... 10:>=70
    cuts = [30, 35, 40, 45, 50, 55, 60, 65, 70]
    for i, c in enumerate(cuts, start=1):
        if t <= c:
            return i
    return 10


def label_from_decile(d: int) -> str:
    if d >= 8:
        return "強み"
    if d <= 3:
        return "伸びしろ"
    return "平均付近"


def bar_pct_from_decile(d: int) -> int:
    return int(clamp(d, 1, 10) * 10)


def norm_mean_sd(test_key: str, sex: str, age_years: int) -> Tuple[float, float]:
    """
    本来は年齢×性別×種目の平均/SDだが、マスタ喪失のため
    年齢による線形近似で “それっぽい” 平均/SD を復元。
    """
    age = clamp(float(age_years), 6.0, 12.0)

    # sex factor: male slightly higher in power/strength/throw (kids)
    s = 1.0 if sex == "male" else 0.97

    if test_key == "grip":
        mean = (7.0 + (age - 6.0) * 1.4) * s
        sd = 2.2
        return mean, sd
    if test_key == "standing_jump":
        mean = (110 + (age - 6.0) * 7.5) * s
        sd = 18.0
        return mean, sd
    if test_key == "dash_15m_sec":
        # lower better, mean decreases with age
        mean = (3.7 - (age - 6.0) * 0.12) / s
        sd = 0.28
        return mean, sd
    if test_key == "continuous_standing_jump":
        mean = (260 + (age - 6.0) * 20.0) * s
        sd = 45.0
        return mean, sd
    if test_key == "squat_30s":
        mean = (14 + (age - 6.0) * 1.8) * s
        sd = 4.5
        return mean, sd
    if test_key == "side_step":
        mean = (22 + (age - 6.0) * 2.4) * s
        sd = 5.0
        return mean, sd
    if test_key == "ball_throw":
        mean = (6.0 + (age - 6.0) * 1.2) * s
        sd = 2.0
        return mean, sd

    return 0.0, 1.0


def t_score(test_key: str, value: float, sex: str, age_years: int) -> float:
    mean, sd = norm_mean_sd(test_key, sex, age_years)
    if sd <= 0:
        return 50.0
    z = (value - mean) / sd

    # dash は “低いほど良い” なので z を反転
    if test_key == "dash_15m_sec":
        z = -z

    t = 50.0 + 10.0 * z
    return float(clamp(t, 20.0, 80.0))


def ability_scores_from_tests(test_t: Dict[str, float]) -> Dict[str, float]:
    acc = {a: 0.0 for a in ABILITIES}
    wsum = {a: 0.0 for a in ABILITIES}
    for tk, t in test_t.items():
        for a, w in TEST_TO_ABILITY_W.get(tk, {}).items():
            acc[a] += t * w
            wsum[a] += w
    out = {}
    for a in ABILITIES:
        out[a] = acc[a] / wsum[a] if wsum[a] > 0 else 50.0
        out[a] = float(clamp(out[a], 20.0, 80.0))
    return out


def pick_type(ability_t: Dict[str, float]) -> Dict[str, str]:
    # 上位2つでタイプ分け（簡易）
    top = sorted(ability_t.items(), key=lambda x: x[1], reverse=True)
    a1, a2 = top[0][0], top[1][0]

    if a1 == "speed":
        return {"key": "speed", "label": "スピード 伸びしろタイプ", "desc": "スピードが伸びやすい状態です。フォームと基礎練習で伸びが出やすいです。"}
    if a1 == "agility":
        return {"key": "agility", "label": "敏捷性 キレタイプ", "desc": "切り返しや反応の良さを活かしやすいタイプです。"}
    if a1 == "power":
        return {"key": "power", "label": "瞬発力 バネタイプ", "desc": "ジャンプや一発の出力が武器になりやすいタイプです。"}
    if a1 == "throw":
        return {"key": "throw", "label": "投力 コントロールタイプ", "desc": "投げる動作の伸びが出やすいタイプです。"}
    if a1 == "strength":
        return {"key": "strength", "label": "筋力 土台タイプ", "desc": "体の土台が伸びやすいタイプです。"}
    return {"key": "repeat", "label": "反復パワー 継続タイプ", "desc": "動きを繰り返す力が伸びやすいタイプです。"}


def pick_class(avg_t: float) -> Dict[str, str]:
    # ざっくり3段階
    if avg_t >= 58:
        return {"key": "expert", "label": "上位（ハイレベル）"}
    if avg_t >= 45:
        return {"key": "standard", "label": "標準（スタンダード）"}
    return {"key": "beginner", "label": "基礎（伸びしろ大）"}


def motor_age_from_avg_t(age_years: int, avg_t: float) -> Tuple[float, str]:
    """
    運動器年齢（超簡易復元）
    avg_t 50=同年代、60なら+1年、40なら-1年 のように寄せる
    """
    diff_year = (avg_t - 50.0) / 10.0  # T10点で1年
    val = clamp(age_years + diff_year, 6.0, 15.0)
    label = f"{int(round(val))}"
    return float(round(val, 1)), label


def sport_recommendations(ability_t: Dict[str, float], topn: int = 6) -> List[dict]:
    ranked = []
    # 上位3能力を理由に出す
    top3 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1], reverse=True)[:3]]

    for s in SPORT_MASTER:
        score = 0.0
        for a, w in s["w"].items():
            score += ability_t.get(a, 50.0) * float(w)
        ranked.append(
            {
                "sport": s["sport"],
                "emoji": s["emoji"],
                "score": round(score, 1),
                "reason": f"強み（{ABILITY_META[top3[0]]['label']}・{ABILITY_META[top3[1]]['label']}）を活かしやすい",
            }
        )
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked[:topn]


def training_focus(ability_t: Dict[str, float], per_ability: int = 6) -> List[dict]:
    bottom2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1])[:2]]
    out: List[dict] = []
    for a in bottom2:
        items = [t for t in TRAINING_MASTER if t["ability"] == a][:per_ability]
        for it in items:
            out.append(
                {
                    "id": it["id"],
                    "title": it["title"],
                    "ability_key": a,
                    "ability_label": ABILITY_META[a]["label"],
                    "desc": it["desc"],
                    "frequency": it["freq"],
                }
            )
    return out


def guardian_message(avg_t: float, top2: List[str], bottom2: List[str]) -> str:
    top_txt = "・".join([ABILITY_META[a]["label"] for a in top2])
    bot_txt = "・".join([ABILITY_META[a]["label"] for a in bottom2])

    if avg_t >= 55:
        return f"同年代と比べて高めです。得意（{top_txt}）を伸ばしつつ、苦手（{bot_txt}）は週1〜2回の練習で底上げしましょう。"
    if avg_t >= 45:
        return f"同年代と同程度です。得意（{top_txt}）を維持しながら、苦手（{bot_txt}）を少しずつ伸ばすのがおすすめです。"
    return f"これから伸びる時期です。まずは苦手（{bot_txt}）を週2回ほど練習して土台を作り、得意（{top_txt}）を活かせる運動を増やしましょう。"


def month_goal(bottom2: List[str]) -> str:
    a = ABILITY_META[bottom2[0]]["label"]
    b = ABILITY_META[bottom2[1]]["label"]
    return f"最初の1ヶ月は「{a}」「{b}」の底上げに集中（週2回×10分〜）。フォームと基礎を揃えることが最優先です。"


def fetch_patient(db: Session, clinic_id: int, patient_id: int) -> Optional[dict]:
    row = db.execute(
        text(
            """
            SELECT id, clinic_id, last_name, first_name, birth_date, sex, school_name
            FROM patients
            WHERE id = :pid AND clinic_id = :cid
            """
        ),
        {"pid": patient_id, "cid": clinic_id},
    ).mappings().first()
    return dict(row) if row else None


def _require_number(payload: dict, key: str) -> float:
    v = payload.get(key, None)
    try:
        f = float(v)
    except Exception:
        raise CalcError(f"{key} が不正です")
    if f < 0:
        raise CalcError(f"{key} は0以上で入力してください")
    return f


# =========================
# Main API
# =========================
def diagnose(db: Session, clinic_id: int, payload: dict) -> dict:
    """
    payload 例:
      patient_id,
      grip_right, grip_left, standing_jump, dash_15m_sec, continuous_standing_jump,
      squat_30s, side_step, ball_throw,
      (optional) height_cm, weight_kg
    """
    if not isinstance(payload, dict):
        raise CalcError("payload が不正です（JSON）")

    patient_id = payload.get("patient_id")
    if patient_id is None:
        raise CalcError("patient_id が必要です")

    try:
        clinic_id_i = int(clinic_id)       # ← JWT由来
        patient_id_i = int(patient_id)
    except Exception:
        raise CalcError("patient_id は整数で指定してください")

    p = fetch_patient(db, clinic_id_i, patient_id_i)
    if not p:
        raise CalcError("患者が見つかりません（patient_id を確認）")

    # age/sex from DB
    bd = p["birth_date"]
    if isinstance(bd, str):
        bd = datetime.strptime(bd[:10], "%Y-%m-%d").date()
    sex = p["sex"]
    if sex not in ("male", "female"):
        sex = "male"

    age_y, age_m = calc_age_years_months(bd)

    # measures
    grip_best = max(_require_number(payload, "grip_right"), _require_number(payload, "grip_left"))
    standing_jump = _require_number(payload, "standing_jump")
    dash_15 = _require_number(payload, "dash_15m_sec")
    if dash_15 <= 0:
        raise CalcError("dash_15m_sec は 0 より大きい値で入力してください")
    cont_jump = _require_number(payload, "continuous_standing_jump")
    squat_30 = _require_number(payload, "squat_30s")
    side_step = _require_number(payload, "side_step")
    ball_throw = _require_number(payload, "ball_throw")

    # optional
    height_cm = payload.get("height_cm", None)
    weight_kg = payload.get("weight_kg", None)
    try:
        height_cm = float(height_cm) if height_cm is not None and str(height_cm).strip() != "" else None
    except Exception:
        height_cm = None
    try:
        weight_kg = float(weight_kg) if weight_kg is not None and str(weight_kg).strip() != "" else None
    except Exception:
        weight_kg = None

    test_values = {
        "grip": grip_best,
        "standing_jump": standing_jump,
        "dash_15m_sec": dash_15,
        "continuous_standing_jump": cont_jump,
        "squat_30s": squat_30,
        "side_step": side_step,
        "ball_throw": ball_throw,
    }

    # T scores per test
    test_t = {k: t_score(k, v, sex, age_y) for k, v in test_values.items()}

    # ability T
    ability_t = ability_scores_from_tests(test_t)

    # top/bottom
    top2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1], reverse=True)[:2]]
    bottom2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1])[:2]]

    avg_t = sum(ability_t.values()) / len(ability_t)

    cls = pick_class(avg_t)
    tp = pick_type(ability_t)
    motor_age_val, motor_age_label = motor_age_from_avg_t(age_y, avg_t)

    # response shapes (UI想定)
    tests_out = []
    for tk in TEST_KEYS:
        v = test_values[tk]
        t = test_t[tk]
        d = decile_from_t(t)
        tests_out.append(
            {
                "key": tk,
                "label": TEST_META[tk]["label"],
                "unit": TEST_META[tk]["unit"],
                "value": round(float(v), 1) if tk not in ("squat_30s", "side_step") else int(round(v)),
                "t": round(t, 1),
                "decile": d,
                "bar_pct": bar_pct_from_decile(d),
                "rank_label": label_from_decile(d),
            }
        )

    abilities_out = []
    for a in ABILITIES:
        t = ability_t[a]
        d = decile_from_t(t)
        abilities_out.append(
            {
                "key": a,
                "label": ABILITY_META[a]["label"],
                "t": round(t, 1),
                "decile": d,
                "bar_pct": bar_pct_from_decile(d),
            }
        )

    sports_top6 = sport_recommendations(ability_t, topn=6)
    trainings_focus = training_focus(ability_t, per_ability=6)

    measured_at = date.today().isoformat()

    return {
        "meta": {"measured_at": measured_at},
        "user": {
            "name": f"{p['last_name']} {p['first_name']}",
            "sex": sex,
            "age": age_y,
            "age_months": age_y * 12 + age_m,
            "height_cm": height_cm,
            "weight_kg": weight_kg,
            "school_name": p.get("school_name"),
            "patient_id": patient_id_i,
            "clinic_id": clinic_id_i,
        },
        "summary": {
            "sex": sex,
            "age": age_y,
            "age_months": age_y * 12 + age_m,
            "class": cls,
            "type": tp,
            "motor_age": {"value": motor_age_val, "label": motor_age_label},
        },
        "abilities": abilities_out,
        "tests": tests_out,
        "sports_top6": sports_top6,
        "trainings_focus": trainings_focus,
        "guardian_message": guardian_message(avg_t, top2, bottom2),
        "month_goal": month_goal(bottom2),
    }