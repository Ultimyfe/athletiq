# # api/services/scoring_service.py
# from __future__ import annotations

# from dataclasses import dataclass
# from datetime import date, datetime
# from typing import Any, Dict, List, Optional, Tuple

# from sqlalchemy import text
# from sqlalchemy.orm import Session


# # =========================
# # Exceptions
# # =========================
# class CalcError(Exception):
#     pass


# # =========================
# # Meta / Labels
# # =========================
# TEST_KEYS = [
#     "grip",
#     "standing_jump",
#     "dash_15m_sec",
#     "continuous_standing_jump",
#     "squat_30s",
#     "side_step",
#     "ball_throw",
# ]

# TEST_META = {
#     "grip": {"label": "握力", "unit": "kg"},
#     "standing_jump": {"label": "立ち幅跳び", "unit": "cm"},
#     "dash_15m_sec": {"label": "15m走", "unit": "秒"},
#     "continuous_standing_jump": {"label": "連続立ち幅跳び（合計）", "unit": "cm"},
#     "squat_30s": {"label": "30秒スクワット", "unit": "回"},
#     "side_step": {"label": "反復横跳び", "unit": "回"},
#     "ball_throw": {"label": "ボール投げ", "unit": "m"},
# }

# # ✅ 7能力に変更
# ABILITIES = ["strength", "power", "speed", "balance", "endurance", "agility", "throw"]

# # ✅ 7能力のラベル
# ABILITY_META = {
#     "strength": {"label": "筋力（握力）"},
#     "power": {"label": "瞬発力"},
#     "speed": {"label": "移動能力"},
#     "balance": {"label": "バランス"},
#     "endurance": {"label": "筋持久力"},
#     "agility": {"label": "敏捷性"},
#     "throw": {"label": "投力"},
# }

# # ✅ 「テスト → 能力」への寄与（7能力版・balance追加）
# TEST_TO_ABILITY_W = {
#     "grip": {"strength": 1.0},
#     "standing_jump": {"power": 0.9, "strength": 0.3, "balance": 0.2},
#     "dash_15m_sec": {"speed": 1.0, "agility": 0.2},
#     "continuous_standing_jump": {"endurance": 0.9, "power": 0.3, "balance": 0.3},
#     "squat_30s": {"strength": 0.5, "endurance": 0.7},
#     "side_step": {"agility": 1.0, "speed": 0.2, "balance": 0.4},
#     "ball_throw": {"throw": 1.0, "power": 0.3, "strength": 0.2},
# }


# # =========================
# # Masters (DB不要)
# # =========================
# SPORT_MASTER: List[dict] = [
#     {"sport": "サッカー", "emoji": "⚽️", "w": {"speed": 1.2, "agility": 1.2, "endurance": 1.0, "power": 0.6, "strength": 0.4, "throw": 0.1, "balance": 0.5}},
#     {"sport": "野球", "emoji": "⚾️", "w": {"throw": 1.3, "power": 1.0, "speed": 0.7, "agility": 0.7, "strength": 0.5, "endurance": 0.3, "balance": 0.5}},
#     {"sport": "バスケットボール", "emoji": "🏀", "w": {"power": 1.2, "agility": 1.0, "speed": 0.9, "endurance": 0.8, "strength": 0.6, "throw": 0.2, "balance": 0.6}},
#     {"sport": "バレーボール", "emoji": "🏐", "w": {"power": 1.3, "agility": 0.9, "speed": 0.7, "endurance": 0.7, "strength": 0.5, "throw": 0.2, "balance": 0.5}},
#     {"sport": "陸上（短距離）", "emoji": "🏃‍♂️", "w": {"speed": 1.5, "power": 1.1, "agility": 0.5, "endurance": 0.6, "strength": 0.3, "throw": 0.0, "balance": 0.4}},
#     {"sport": "陸上（中距離）", "emoji": "🏃", "w": {"endurance": 1.5, "speed": 1.0, "agility": 0.4, "power": 0.5, "strength": 0.3, "throw": 0.0, "balance": 0.5}},
#     {"sport": "体操", "emoji": "🤸", "w": {"balance": 1.4, "agility": 1.2, "power": 1.0, "strength": 0.8, "endurance": 0.6, "speed": 0.4, "throw": 0.0}},
#     {"sport": "水泳", "emoji": "🏊", "w": {"endurance": 1.3, "power": 0.8, "strength": 0.7, "speed": 0.7, "agility": 0.3, "throw": 0.0, "balance": 0.4}},
#     {"sport": "テニス", "emoji": "🎾", "w": {"agility": 1.2, "speed": 1.0, "power": 0.8, "endurance": 0.7, "strength": 0.4, "throw": 0.1, "balance": 0.6}},
#     {"sport": "卓球", "emoji": "🏓", "w": {"agility": 1.4, "speed": 1.0, "endurance": 0.8, "power": 0.4, "strength": 0.2, "throw": 0.0, "balance": 0.5}},
#     {"sport": "バドミントン", "emoji": "🏸", "w": {"agility": 1.3, "speed": 1.1, "endurance": 0.9, "power": 0.6, "strength": 0.3, "throw": 0.0, "balance": 0.5}},
#     {"sport": "柔道", "emoji": "🥋", "w": {"strength": 1.4, "power": 1.1, "balance": 0.9, "agility": 0.6, "endurance": 0.8, "speed": 0.4, "throw": 0.1}},
#     {"sport": "空手", "emoji": "🥋", "w": {"speed": 1.1, "agility": 1.0, "power": 1.0, "endurance": 0.8, "strength": 0.5, "throw": 0.0, "balance": 0.7}},
#     {"sport": "ラグビー", "emoji": "🏉", "w": {"strength": 1.4, "power": 1.2, "endurance": 0.8, "speed": 0.6, "agility": 0.6, "throw": 0.2, "balance": 0.5}},
#     {"sport": "ハンドボール", "emoji": "🤾", "w": {"throw": 1.3, "power": 1.0, "agility": 0.9, "speed": 0.7, "endurance": 0.7, "strength": 0.4, "balance": 0.5}},
#     {"sport": "ダンス", "emoji": "💃", "w": {"agility": 1.4, "balance": 1.2, "endurance": 1.0, "speed": 0.6, "power": 0.6, "strength": 0.3, "throw": 0.0}},
#     {"sport": "ボルダリング", "emoji": "🧗", "w": {"strength": 1.4, "balance": 1.1, "agility": 0.8, "power": 0.8, "endurance": 0.7, "speed": 0.2, "throw": 0.0}},
# ]

# # ✅ 70種目（7能力×10種目）
# TRAINING_MASTER: List[dict] = [
#     # strength（筋力・握力）ID 1-10
#     {"id": 1, "title": "タオル握りスクイーズ", "ability": "strength", "desc": "指・前腕を使って握る力を鍛え、物をつかむ基礎力を高める。", "freq": "週3回", "image": "/images/trainings/strength_01.JPEG"},
#     {"id": 2, "title": "雑巾しぼり", "ability": "strength", "desc": "左右差なく前腕と手指を使い、日常動作に直結する握力を養う。", "freq": "週3回", "image": "/images/trainings/strength_02.JPEG"},
#     {"id": 3, "title": "ぶら下がり", "ability": "strength", "desc": "体重を支えることで握力＋肩・体幹の支持力も同時に強化。", "freq": "週2回", "image": "/images/trainings/strength_03.JPEG"},
#     {"id": 4, "title": "クマ歩き", "ability": "strength", "desc": "手で体を支えるため、握力と上半身の連動力が高まる。", "freq": "週2回", "image": "/images/trainings/strength_04.JPEG"},
#     {"id": 5, "title": "カニ歩き", "ability": "strength", "desc": "手と足で体重を分散し、持続的な握力と体幹安定性を養う。", "freq": "週2回", "image": "/images/trainings/strength_05.JPEG"},
#     {"id": 6, "title": "プランク手支持", "ability": "strength", "desc": "手で床を押すことで手指・前腕の支持力を強化。", "freq": "週3回", "image": "/images/trainings/strength_06.JPEG"},
#     {"id": 7, "title": "ペットボトル持ち替え", "ability": "strength", "desc": "握る→離す動作で巧緻性と握力のコントロール力を鍛える。", "freq": "週2回", "image": "/images/trainings/strength_07.JPEG"},
#     {"id": 8, "title": "指立て伏せ（簡易）", "ability": "strength", "desc": "指に体重を分散させ、指先の力と安定性を高める。", "freq": "週2回", "image": "/images/trainings/strength_08.JPEG"},
#     {"id": 9, "title": "ボール潰し", "ability": "strength", "desc": "最大握力を直接刺激し、握る瞬間の力発揮を強化。", "freq": "週2回", "image": "/images/trainings/strength_09.JPEG"},
#     {"id": 10, "title": "ロープ引き（タオル）", "ability": "strength", "desc": "引く動作で握力＋背中・体幹の連動を鍛える。", "freq": "週2回", "image": "/images/trainings/strength_10.JPEG"},
#     # power（瞬発力）ID 11-20
#     {"id": 11, "title": "その場ジャンプ", "ability": "power", "desc": "一瞬で地面を押す力を高め、跳ぶ基礎能力を作る。", "freq": "週2回", "image": "/images/trainings/power_11.JPEG"},
#     {"id": 12, "title": "連続ジャンプ", "ability": "power", "desc": "反発を使った素早い力発揮を覚える。", "freq": "週2回", "image": "/images/trainings/power_12.JPEG"},
#     {"id": 13, "title": "スクワットジャンプ", "ability": "power", "desc": "下半身の筋力を一気に使う力を養う。", "freq": "週2回", "image": "/images/trainings/power_13.JPEG"},
#     {"id": 14, "title": "前後ジャンプ", "ability": "power", "desc": "前後方向への瞬間的な加速力を強化。", "freq": "週2回", "image": "/images/trainings/power_14.JPEG"},
#     {"id": 15, "title": "横ジャンプ", "ability": "power", "desc": "横方向の瞬発力と着地の安定性を高める。", "freq": "週2回", "image": "/images/trainings/power_15.JPEG"},
#     {"id": 16, "title": "反応ジャンプ", "ability": "power", "desc": "合図に反応して跳ぶことで神経系の瞬発性を刺激。", "freq": "週2回", "image": "/images/trainings/power_16.JPEG"},
#     {"id": 17, "title": "バウンディング", "ability": "power", "desc": "走る時の地面反力を効率よく使う能力を育てる。", "freq": "週1回", "image": "/images/trainings/power_17.JPEG"},
#     {"id": 18, "title": "スタートダッシュ3m", "ability": "power", "desc": "最初の一歩の爆発的な力を鍛える。", "freq": "週2回", "image": "/images/trainings/power_18.JPEG"},
#     {"id": 19, "title": "キャッチ→即ジャンプ", "ability": "power", "desc": "動作切り替え能力と瞬発力を同時に強化。", "freq": "週2回", "image": "/images/trainings/power_19.JPEG"},
#     {"id": 20, "title": "片足ジャンプ", "ability": "power", "desc": "片脚で力を出す能力とバランスを向上。", "freq": "週2回", "image": "/images/trainings/power_20.JPEG"},

#     # speed（移動能力）ID 21-30
#     {"id": 21, "title": "クマ歩き前進", "ability": "speed", "desc": "全身を連動させて前に進む基礎移動能力を高める。", "freq": "週2回", "image": "/images/trainings/speed_21.JPEG"},
#     {"id": 22, "title": "クマ歩き後退", "ability": "speed", "desc": "後ろへの移動で空間認知と身体操作力を向上。", "freq": "週2回", "image": "/images/trainings/speed_22.JPEG"},
#     {"id": 23, "title": "カニ歩き横移動", "ability": "speed", "desc": "横方向への移動能力と体幹安定性を強化。", "freq": "週2回", "image": "/images/trainings/speed_23.JPEG"},
#     {"id": 24, "title": "サイドステップ", "ability": "speed", "desc": "スポーツで必須の横移動をスムーズにする。", "freq": "週2回", "image": "/images/trainings/speed_24.JPEG"},
#     {"id": 25, "title": "スキップ", "ability": "speed", "desc": "リズムと上下移動を組み合わせた移動能力を養う。", "freq": "週2回", "image": "/images/trainings/speed_25.JPEG"},
#     {"id": 26, "title": "クロスステップ", "ability": "speed", "desc": "足を交差させる動きで複雑な移動に対応できる。", "freq": "週2回", "image": "/images/trainings/speed_26.JPEG"},
#     {"id": 27, "title": "ジグザグ走", "ability": "speed", "desc": "方向転換を含む移動能力を高める。", "freq": "週2回", "image": "/images/trainings/speed_27.JPEG"},
#     {"id": 28, "title": "バック走", "ability": "speed", "desc": "後方移動で視野と身体操作の幅を広げる。", "freq": "週2回", "image": "/images/trainings/speed_28.JPEG"},
#     {"id": 29, "title": "ハイハイ移動", "ability": "speed", "desc": "左右の協調性と体幹主導の移動を身につける。", "freq": "週2回", "image": "/images/trainings/speed_29.JPEG"},
#     {"id": 30, "title": "8の字走", "ability": "speed", "desc": "連続した方向変換に対応する能力を鍛える。", "freq": "週2回", "image": "/images/trainings/speed_30.JPEG"},

#     # balance（バランス）ID 31-40
#     {"id": 31, "title": "片足立ち", "ability": "balance", "desc": "重心をコントロールする基本能力を養う。", "freq": "週3回", "image": "/images/trainings/balance_31.JPEG"},
#     {"id": 32, "title": "目閉じ片足立ち", "ability": "balance", "desc": "視覚に頼らないバランス感覚を鍛える。", "freq": "週2回", "image": "/images/trainings/balance_32.JPEG"},
#     {"id": 33, "title": "片足スクワット", "ability": "balance", "desc": "動きながらバランスを保つ力を強化。", "freq": "週2回", "image": "/images/trainings/balance_33.JPEG"},
#     {"id": 34, "title": "つま先立ちキープ", "ability": "balance", "desc": "足首の安定性と姿勢保持力を高める。", "freq": "週3回", "image": "/images/trainings/balance_34.JPEG"},
#     {"id": 35, "title": "かかと立ちキープ", "ability": "balance", "desc": "前後の重心コントロールを向上。", "freq": "週3回", "image": "/images/trainings/balance_35.JPEG"},
#     {"id": 36, "title": "バランスボード", "ability": "balance", "desc": "不安定環境で姿勢調整力を養う。", "freq": "週2回", "image": "/images/trainings/balance_36.JPEG"},
#     {"id": 37, "title": "片足キャッチ", "ability": "balance", "desc": "バランス＋上肢操作を同時に鍛える。", "freq": "週2回", "image": "/images/trainings/balance_37.JPEG"},
#     {"id": 38, "title": "片足ジャンプ着地", "ability": "balance", "desc": "着地時の衝撃吸収と安定性を向上。", "freq": "週2回", "image": "/images/trainings/balance_38.JPEG"},
#     {"id": 39, "title": "T字バランス", "ability": "balance", "desc": "体幹と下肢を一直線で支える能力を養う。", "freq": "週2回", "image": "/images/trainings/balance_39.JPEG"},
#     {"id": 40, "title": "不安定姿勢で投げ", "ability": "balance", "desc": "崩れながらも姿勢を立て直す力を育てる。", "freq": "週1回", "image": "/images/trainings/balance_40.JPEG"},

#     # endurance（筋持久力）ID 41-50
#     {"id": 41, "title": "スクワット連続", "ability": "endurance", "desc": "下半身を使い続ける力を鍛える。", "freq": "週2回", "image": "/images/trainings/endurance_41.JPEG"},
#     {"id": 42, "title": "プランク", "ability": "endurance", "desc": "体幹を安定させたまま耐える力を強化。", "freq": "週3回", "image": "/images/trainings/endurance_42.JPEG"},
#     {"id": 43, "title": "壁スクワット", "ability": "endurance", "desc": "静的姿勢で筋肉を使い続ける能力を養う。", "freq": "週2回", "image": "/images/trainings/endurance_43.JPEG"},
#     {"id": 44, "title": "腕立て伏せ", "ability": "endurance", "desc": "上半身の持久力と体幹安定性を向上。", "freq": "週2回", "image": "/images/trainings/endurance_44.JPEG"},
#     {"id": 45, "title": "マウンテンクライマー", "ability": "endurance", "desc": "全身を使った持久的運動能力を高める。", "freq": "週2回", "image": "/images/trainings/endurance_45.JPEG"},
#     {"id": 46, "title": "連続ジャンプ30秒", "ability": "endurance", "desc": "疲れても動きを維持する力を養う。", "freq": "週2回", "image": "/images/trainings/endurance_46.JPEG"},
#     {"id": 47, "title": "その場もも上げ", "ability": "endurance", "desc": "走動作に必要な下肢持久力を強化。", "freq": "週2回", "image": "/images/trainings/endurance_47.JPEG"},
#     {"id": 48, "title": "クマ歩き往復", "ability": "endurance", "desc": "全身の筋持久力をバランスよく鍛える。", "freq": "週2回", "image": "/images/trainings/endurance_48.JPEG"},
#     {"id": 49, "title": "軽めバーピー", "ability": "endurance", "desc": "全身を使い続ける体力を向上。", "freq": "週2回", "image": "/images/trainings/endurance_49.JPEG"},
#     {"id": 50, "title": "なわとび", "ability": "endurance", "desc": "リズムを保ちながら持久的に動く力を育てる。", "freq": "週3回", "image": "/images/trainings/endurance_50.JPEG"},
#     # agility（敏捷性）ID 51-60
#     {"id": 51, "title": "ラダートレーニング", "ability": "agility", "desc": "素早い足さばきとリズム感を養う。", "freq": "週2回", "image": "/images/trainings/agility_51.JPEG"},
#     {"id": 52, "title": "サイドタッチ", "ability": "agility", "desc": "左右への素早い切り替えを強化。", "freq": "週2回", "image": "/images/trainings/agility_52.JPEG"},
#     {"id": 53, "title": "色タッチ反応", "ability": "agility", "desc": "判断→動作の速さを高める。", "freq": "週2回", "image": "/images/trainings/agility_53.JPEG"},
#     {"id": 54, "title": "合図ダッシュ", "ability": "agility", "desc": "スタート反応を速くする。", "freq": "週2回", "image": "/images/trainings/agility_54.JPEG"},
#     {"id": 55, "title": "フェイントステップ", "ability": "agility", "desc": "相手をかわす動作の基礎を作る。", "freq": "週2回", "image": "/images/trainings/agility_55.JPEG"},
#     {"id": 56, "title": "方向転換走", "ability": "agility", "desc": "急な切り返し能力を向上。", "freq": "週2回", "image": "/images/trainings/agility_56.JPEG"},
#     {"id": 57, "title": "反応キャッチ", "ability": "agility", "desc": "目と体の連動スピードを高める。", "freq": "週2回", "image": "/images/trainings/agility_57.JPEG"},
#     {"id": 58, "title": "ミラームーブ", "ability": "agility", "desc": "相手の動きを即座に真似る反応力を養う。", "freq": "週2回", "image": "/images/trainings/agility_58.JPEG"},
#     {"id": 59, "title": "じゃんけんダッシュ", "ability": "agility", "desc": "判断力＋瞬時の行動力を鍛える。", "freq": "週2回", "image": "/images/trainings/agility_59.JPEG"},
#     {"id": 60, "title": "ストップ＆ゴー走", "ability": "agility", "desc": "止まる→動く切り替え能力を強化。", "freq": "週2回", "image": "/images/trainings/agility_60.JPEG"},

#     # throw（投力）ID 61-70
#     {"id": 61, "title": "両手上投げ", "ability": "throw", "desc": "全身を使って力を伝える感覚を養う。", "freq": "週2回", "image": "/images/trainings/throw_61.JPEG"},
#     {"id": 62, "title": "片手オーバースロー", "ability": "throw", "desc": "肩・体幹・下半身の連動を学ぶ。", "freq": "週2回", "image": "/images/trainings/throw_62.JPEG"},
#     {"id": 63, "title": "下投げ", "ability": "throw", "desc": "腕だけでなく脚の使い方を覚える。", "freq": "週2回", "image": "/images/trainings/throw_63.JPEG"},
#     {"id": 64, "title": "壁当てキャッチ", "ability": "throw", "desc": "投げる→受ける連動動作を強化。", "freq": "週2回", "image": "/images/trainings/throw_64.JPEG"},
#     {"id": 65, "title": "的当て投げ", "ability": "throw", "desc": "狙って投げるコントロール力を向上。", "freq": "週2回", "image": "/images/trainings/throw_65.JPEG"},
#     {"id": 66, "title": "膝立ち投げ", "ability": "throw", "desc": "体幹主導で投げる感覚を身につける。", "freq": "週2回", "image": "/images/trainings/throw_66.JPEG"},
#     {"id": 67, "title": "体ひねり投げ", "ability": "throw", "desc": "回旋動作によるパワー伝達を学ぶ。", "freq": "週2回", "image": "/images/trainings/throw_67.JPEG"},
#     {"id": 68, "title": "片足立ち投げ", "ability": "throw", "desc": "バランスを保ちながら投げる能力を養う。", "freq": "週2回", "image": "/images/trainings/throw_68.JPEG"},
#     {"id": 69, "title": "連続キャッチ＆投げ", "ability": "throw", "desc": "リズムと投動作の安定性を高める。", "freq": "週2回", "image": "/images/trainings/throw_69.JPEG"},
#     {"id": 70, "title": "重さ違いボール投げ", "ability": "throw", "desc": "力の出し分けと適応能力を向上。", "freq": "週1回", "image": "/images/trainings/throw_70.JPEG"},
# ]


# # =========================
# # Helpers
# # =========================
# def _today() -> date:
#     return date.today()


# def calc_age_years_months(birth_date: date, today: Optional[date] = None) -> Tuple[int, int]:
#     if today is None:
#         today = _today()
#     years = today.year - birth_date.year
#     months = today.month - birth_date.month
#     if today.day < birth_date.day:
#         months -= 1
#     if months < 0:
#         years -= 1
#         months += 12
#     if years < 0:
#         return (0, 0)
#     return (years, months)


# def clamp(x: float, lo: float, hi: float) -> float:
#     return max(lo, min(hi, x))


# def decile_from_t(t: float) -> int:
#     cuts = [30, 35, 40, 45, 50, 55, 60, 65, 70]
#     for i, c in enumerate(cuts, start=1):
#         if t <= c:
#             return i
#     return 10


# def label_from_decile(d: int) -> str:
#     if d >= 8:
#         return "強み"
#     if d <= 3:
#         return "伸びしろ"
#     return "平均付近"


# def bar_pct_from_decile(d: int) -> int:
#     return int(clamp(d, 1, 10) * 10)


# def norm_mean_sd(test_key: str, sex: str, age_years: int) -> Tuple[float, float]:
#     age = clamp(float(age_years), 6.0, 12.0)
#     s = 1.0 if sex == "male" else 0.97

#     if test_key == "grip":
#         mean = (7.0 + (age - 6.0) * 1.4) * s
#         sd = 2.2
#         return mean, sd
#     if test_key == "standing_jump":
#         mean = (110 + (age - 6.0) * 7.5) * s
#         sd = 18.0
#         return mean, sd
#     if test_key == "dash_15m_sec":
#         mean = (3.7 - (age - 6.0) * 0.12) / s
#         sd = 0.28
#         return mean, sd
#     if test_key == "continuous_standing_jump":
#         mean = (260 + (age - 6.0) * 20.0) * s
#         sd = 45.0
#         return mean, sd
#     if test_key == "squat_30s":
#         mean = (14 + (age - 6.0) * 1.8) * s
#         sd = 4.5
#         return mean, sd
#     if test_key == "side_step":
#         mean = (22 + (age - 6.0) * 2.4) * s
#         sd = 5.0
#         return mean, sd
#     if test_key == "ball_throw":
#         mean = (6.0 + (age - 6.0) * 1.2) * s
#         sd = 2.0
#         return mean, sd

#     return 0.0, 1.0


# def t_score(test_key: str, value: float, sex: str, age_years: int) -> float:
#     mean, sd = norm_mean_sd(test_key, sex, age_years)
#     if sd <= 0:
#         return 50.0
#     z = (value - mean) / sd

#     if test_key == "dash_15m_sec":
#         z = -z

#     t = 50.0 + 10.0 * z
#     return float(clamp(t, 20.0, 80.0))


# def ability_scores_from_tests(test_t: Dict[str, float]) -> Dict[str, float]:
#     """✅ 7能力対応版"""
#     acc = {a: 0.0 for a in ABILITIES}
#     wsum = {a: 0.0 for a in ABILITIES}
#     for tk, t in test_t.items():
#         for a, w in TEST_TO_ABILITY_W.get(tk, {}).items():
#             acc[a] += t * w
#             wsum[a] += w
#     out = {}
#     for a in ABILITIES:
#         out[a] = acc[a] / wsum[a] if wsum[a] > 0 else 50.0
#         out[a] = float(clamp(out[a], 20.0, 80.0))
#     return out


# def pick_type(ability_t: Dict[str, float]) -> Dict[str, str]:
#     top = sorted(ability_t.items(), key=lambda x: x[1], reverse=True)
#     a1 = top[0][0]

#     if a1 == "speed":
#         return {"key": "speed", "label": "スピード 伸びしろタイプ", "desc": "スピードが伸びやすい状態です。フォームと基礎練習で伸びが出やすいです。"}
#     if a1 == "agility":
#         return {"key": "agility", "label": "敏捷性 キレタイプ", "desc": "切り返しや反応の良さを活かしやすいタイプです。"}
#     if a1 == "power":
#         return {"key": "power", "label": "瞬発力 バネタイプ", "desc": "ジャンプや一発の出力が武器になりやすいタイプです。"}
#     if a1 == "throw":
#         return {"key": "throw", "label": "投力 コントロールタイプ", "desc": "投げる動作の伸びが出やすいタイプです。"}
#     if a1 == "strength":
#         return {"key": "strength", "label": "筋力 土台タイプ", "desc": "体の土台が伸びやすいタイプです。"}
#     if a1 == "balance":
#         return {"key": "balance", "label": "バランス 安定タイプ", "desc": "姿勢制御能力が高く、技術習得がスムーズです。"}
#     return {"key": "endurance", "label": "筋持久力 継続タイプ", "desc": "動きを繰り返す力が伸びやすいタイプです。"}


# def pick_class(avg_t: float) -> Dict[str, str]:
#     if avg_t >= 58:
#         return {"key": "expert", "label": "上位（ハイレベル）"}
#     if avg_t >= 45:
#         return {"key": "standard", "label": "標準（スタンダード）"}
#     return {"key": "beginner", "label": "基礎（伸びしろ大）"}


# def motor_age_from_avg_t(age_years: int, avg_t: float) -> Tuple[float, str]:
#     diff_year = (avg_t - 50.0) / 10.0
#     val = clamp(age_years + diff_year, 6.0, 15.0)
#     label = f"{int(round(val))}"
#     return float(round(val, 1)), label


# def sport_recommendations(ability_t: Dict[str, float], topn: int = 6) -> List[dict]:
#     ranked = []
#     top3 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1], reverse=True)[:3]]

#     for s in SPORT_MASTER:
#         score = 0.0
#         for a, w in s["w"].items():
#             score += ability_t.get(a, 50.0) * float(w)
#         ranked.append(
#             {
#                 "sport": s["sport"],
#                 "emoji": s["emoji"],
#                 "score": round(score, 1),
#                 "reason": f"強み（{ABILITY_META[top3[0]]['label']}・{ABILITY_META[top3[1]]['label']}）を活かしやすい",
#             }
#         )
#     ranked.sort(key=lambda x: x["score"], reverse=True)
#     return ranked[:topn]


# def training_focus(ability_t: Dict[str, float], per_ability: int = 6) -> List[dict]:
#     """✅ 7能力対応・下位2能力から各6種目選定"""
#     bottom2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1])[:2]]
#     out: List[dict] = []
#     for a in bottom2:
#         items = [t for t in TRAINING_MASTER if t["ability"] == a][:per_ability]
#         for it in items:
#             out.append(
#                 {
#                     "id": it["id"],
#                     "title": it["title"],
#                     "ability_key": a,
#                     "ability_label": ABILITY_META[a]["label"],
#                     "desc": it["desc"],
#                     "frequency": it["freq"],
#                     "image": it.get("image"),
#                 }
#             )
#     return out


# def guardian_message(avg_t: float, top2: List[str], bottom2: List[str]) -> str:
#     top_txt = "・".join([ABILITY_META[a]["label"] for a in top2])
#     bot_txt = "・".join([ABILITY_META[a]["label"] for a in bottom2])

#     if avg_t >= 55:
#         return f"同年代と比べて高めです。得意（{top_txt}）を伸ばしつつ、苦手（{bot_txt}）は週1〜2回の練習で底上げしましょう。"
#     if avg_t >= 45:
#         return f"同年代と同程度です。得意（{top_txt}）を維持しながら、苦手（{bot_txt}）を少しずつ伸ばすのがおすすめです。"
#     return f"これから伸びる時期です。まずは苦手（{bot_txt}）を週2回ほど練���して土台を作り、得意（{top_txt}）を活かせる運動を増やしましょう。"


# def month_goal(bottom2: List[str]) -> str:
#     a = ABILITY_META[bottom2[0]]["label"]
#     b = ABILITY_META[bottom2[1]]["label"]
#     return f"最初の1ヶ月は「{a}」「{b}」の底上げに集中（週2回×10分〜）。フォームと基礎を揃えることが最優先です。"


# def fetch_patient(db: Session, clinic_id: int, patient_id: int) -> Optional[dict]:
#     row = db.execute(
#         text(
#             """
#             SELECT id, clinic_id, last_name, first_name, birth_date, sex, school_name
#             FROM patients
#             WHERE id = :pid AND clinic_id = :cid
#             """
#         ),
#         {"pid": patient_id, "cid": clinic_id},
#     ).mappings().first()
#     return dict(row) if row else None


# def _require_number(payload: dict, key: str) -> float:
#     v = payload.get(key, None)
#     try:
#         f = float(v)
#     except Exception:
#         raise CalcError(f"{key} が不正です")
#     if f < 0:
#         raise CalcError(f"{key} は0以上で入力してください")
#     return f


# # =========================
# # Main API
# # =========================
# def diagnose(db: Session, clinic_id: int, payload: dict) -> dict:
#     if not isinstance(payload, dict):
#         raise CalcError("payload が不正です（JSON）")

#     patient_id = payload.get("patient_id")
#     if patient_id is None:
#         raise CalcError("patient_id が必要です")

#     try:
#         clinic_id_i = int(clinic_id)
#         patient_id_i = int(patient_id)
#     except Exception:
#         raise CalcError("patient_id は整数で指定してください")

#     p = fetch_patient(db, clinic_id_i, patient_id_i)
#     if not p:
#         raise CalcError("患者が見つかりません（patient_id を確認）")

#     bd = p["birth_date"]
#     if isinstance(bd, str):
#         bd = datetime.strptime(bd[:10], "%Y-%m-%d").date()
#     sex = p["sex"]
#     if sex not in ("male", "female"):
#         sex = "male"

#     age_y, age_m = calc_age_years_months(bd)

#     grip_best = max(_require_number(payload, "grip_right"), _require_number(payload, "grip_left"))
#     standing_jump = _require_number(payload, "standing_jump")
#     dash_15 = _require_number(payload, "dash_15m_sec")
#     if dash_15 <= 0:
#         raise CalcError("dash_15m_sec は 0 より大きい値で入力してください")
#     cont_jump = _require_number(payload, "continuous_standing_jump")
#     squat_30 = _require_number(payload, "squat_30s")
#     side_step = _require_number(payload, "side_step")
#     ball_throw = _require_number(payload, "ball_throw")

#     height_cm = payload.get("height_cm", None)
#     weight_kg = payload.get("weight_kg", None)
#     try:
#         height_cm = float(height_cm) if height_cm is not None and str(height_cm).strip() != "" else None
#     except Exception:
#         height_cm = None
#     try:
#         weight_kg = float(weight_kg) if weight_kg is not None and str(weight_kg).strip() != "" else None
#     except Exception:
#         weight_kg = None

#     test_values = {
#         "grip": grip_best,
#         "standing_jump": standing_jump,
#         "dash_15m_sec": dash_15,
#         "continuous_standing_jump": cont_jump,
#         "squat_30s": squat_30,
#         "side_step": side_step,
#         "ball_throw": ball_throw,
#     }

#     test_t = {k: t_score(k, v, sex, age_y) for k, v in test_values.items()}

#     # ✅ 7能力のスコア計算
#     ability_t = ability_scores_from_tests(test_t)

#     top2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1], reverse=True)[:2]]
#     bottom2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1])[:2]]

#     avg_t = sum(ability_t.values()) / len(ability_t)

#     cls = pick_class(avg_t)
#     tp = pick_type(ability_t)
#     motor_age_val, motor_age_label = motor_age_from_avg_t(age_y, avg_t)

#     tests_out = []
#     for tk in TEST_KEYS:
#         v = test_values[tk]
#         t = test_t[tk]
#         d = decile_from_t(t)
#         tests_out.append(
#             {
#                 "key": tk,
#                 "label": TEST_META[tk]["label"],
#                 "unit": TEST_META[tk]["unit"],
#                 "value": round(float(v), 1) if tk not in ("squat_30s", "side_step") else int(round(v)),
#                 "t": round(t, 1),
#                 "decile": d,
#                 "bar_pct": bar_pct_from_decile(d),
#                 "rank_label": label_from_decile(d),
#             }
#         )

#     abilities_out = []
#     for a in ABILITIES:
#         t = ability_t[a]
#         d = decile_from_t(t)
#         abilities_out.append(
#             {
#                 "key": a,
#                 "label": ABILITY_META[a]["label"],
#                 "t": round(t, 1),
#                 "decile": d,
#                 "bar_pct": bar_pct_from_decile(d),
#             }
#         )

#     sports_top6 = sport_recommendations(ability_t, topn=6)
#     trainings_focus = training_focus(ability_t, per_ability=6)

#     measured_at = date.today().isoformat()

#     return {
#         "meta": {"measured_at": measured_at},
#         "user": {
#             "name": f"{p['last_name']} {p['first_name']}",
#             "sex": sex,
#             "age": age_y,
#             "age_months": age_y * 12 + age_m,
#             "height_cm": height_cm,
#             "weight_kg": weight_kg,
#             "school_name": p.get("school_name"),
#             "patient_id": patient_id_i,
#             "clinic_id": clinic_id_i,
#         },
#         "summary": {
#             "sex": sex,
#             "age": age_y,
#             "age_months": age_y * 12 + age_m,
#             "class": cls,
#             "type": tp,
#             "motor_age": {"value": motor_age_val, "label": motor_age_label},
#         },
#         "abilities": abilities_out,
#         "tests": tests_out,
#         "sports_top6": sports_top6,
#         "trainings_focus": trainings_focus,
#         "guardian_message": guardian_message(avg_t, top2, bottom2),
#         "month_goal": month_goal(bottom2),
#     }

# api/services/scoring_service.py
# 

# api/services/scoring_service.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

# ✅ 追加: 全国平均データのインポート
from api.data.national_averages import (
    get_national_mean_sd,
    get_national_average,
    get_sd_from_mean,
)


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
    "continuous_standing_jump": {"label": "連続立ち幅跳び(合計)", "unit": "cm"},
    "squat_30s": {"label": "30秒スクワット", "unit": "回"},
    "side_step": {"label": "反復横跳び", "unit": "回"},
    "ball_throw": {"label": "ボール投げ", "unit": "m"},
}

ABILITIES = ["strength", "power", "speed", "balance", "endurance", "agility", "throw"]

ABILITY_META = {
    "strength": {"label": "筋力(握力)"},
    "power": {"label": "瞬発力"},
    "speed": {"label": "移動能力"},
    "balance": {"label": "バランス"},
    "endurance": {"label": "筋持久力"},
    "agility": {"label": "敏捷性"},
    "throw": {"label": "投力"},
}

TEST_TO_ABILITY_W = {
    "grip": {"strength": 1.0},
    "standing_jump": {"power": 0.9, "strength": 0.3, "balance": 0.2},
    "dash_15m_sec": {"speed": 1.0, "agility": 0.2},
    "continuous_standing_jump": {"endurance": 0.9, "power": 0.3, "balance": 0.3},
    "squat_30s": {"strength": 0.5, "endurance": 0.7},
    "side_step": {"agility": 1.0, "speed": 0.2, "balance": 0.4},
    "ball_throw": {"throw": 1.0, "power": 0.3, "strength": 0.2},
}


# =========================
# Masters (DB不要)
# =========================
SPORT_MASTER: List[dict] = [
    {"sport": "サッカー", "emoji": "⚽️", "w": {"speed": 1.2, "agility": 1.2, "endurance": 1.0, "power": 0.6, "strength": 0.4, "throw": 0.1, "balance": 0.5}},
    {"sport": "野球", "emoji": "⚾️", "w": {"throw": 1.3, "power": 1.0, "speed": 0.7, "agility": 0.7, "strength": 0.5, "endurance": 0.3, "balance": 0.5}},
    {"sport": "バスケットボール", "emoji": "🏀", "w": {"power": 1.2, "agility": 1.0, "speed": 0.9, "endurance": 0.8, "strength": 0.6, "throw": 0.2, "balance": 0.6}},
    {"sport": "バレーボール", "emoji": "🏐", "w": {"power": 1.3, "agility": 0.9, "speed": 0.7, "endurance": 0.7, "strength": 0.5, "throw": 0.2, "balance": 0.5}},
    {"sport": "陸上(短距離)", "emoji": "🏃‍♂️", "w": {"speed": 1.5, "power": 1.1, "agility": 0.5, "endurance": 0.6, "strength": 0.3, "throw": 0.0, "balance": 0.4}},
    {"sport": "陸上(中距離)", "emoji": "🏃", "w": {"endurance": 1.5, "speed": 1.0, "agility": 0.4, "power": 0.5, "strength": 0.3, "throw": 0.0, "balance": 0.5}},
    {"sport": "体操", "emoji": "🤸", "w": {"balance": 1.4, "agility": 1.2, "power": 1.0, "strength": 0.8, "endurance": 0.6, "speed": 0.4, "throw": 0.0}},
    {"sport": "水泳", "emoji": "🏊", "w": {"endurance": 1.3, "power": 0.8, "strength": 0.7, "speed": 0.7, "agility": 0.3, "throw": 0.0, "balance": 0.4}},
    {"sport": "テニス", "emoji": "🎾", "w": {"agility": 1.2, "speed": 1.0, "power": 0.8, "endurance": 0.7, "strength": 0.4, "throw": 0.1, "balance": 0.6}},
    {"sport": "卓球", "emoji": "🏓", "w": {"agility": 1.4, "speed": 1.0, "endurance": 0.8, "power": 0.4, "strength": 0.2, "throw": 0.0, "balance": 0.5}},
    {"sport": "バドミントン", "emoji": "🏸", "w": {"agility": 1.3, "speed": 1.1, "endurance": 0.9, "power": 0.6, "strength": 0.3, "throw": 0.0, "balance": 0.5}},
    {"sport": "柔道", "emoji": "🥋", "w": {"strength": 1.4, "power": 1.1, "balance": 0.9, "agility": 0.6, "endurance": 0.8, "speed": 0.4, "throw": 0.1}},
    {"sport": "空手", "emoji": "🥋", "w": {"speed": 1.1, "agility": 1.0, "power": 1.0, "endurance": 0.8, "strength": 0.5, "throw": 0.0, "balance": 0.7}},
    {"sport": "ラグビー", "emoji": "🏉", "w": {"strength": 1.4, "power": 1.2, "endurance": 0.8, "speed": 0.6, "agility": 0.6, "throw": 0.2, "balance": 0.5}},
    {"sport": "ハンドボール", "emoji": "🤾", "w": {"throw": 1.3, "power": 1.0, "agility": 0.9, "speed": 0.7, "endurance": 0.7, "strength": 0.4, "balance": 0.5}},
    {"sport": "ダンス", "emoji": "💃", "w": {"agility": 1.4, "balance": 1.2, "endurance": 1.0, "speed": 0.6, "power": 0.6, "strength": 0.3, "throw": 0.0}},
    {"sport": "ボルダリング", "emoji": "🧗", "w": {"strength": 1.4, "balance": 1.1, "agility": 0.8, "power": 0.8, "endurance": 0.7, "speed": 0.2, "throw": 0.0}},
]

TRAINING_MASTER: List[dict] = [
    # strength(筋力・握力)ID 1-10
    {"id": 1, "title": "タオル握りスクイーズ", "ability": "strength", "desc": "指・前腕を使って握る力を鍛え、物をつかむ基礎力を高める。", "freq": "週3回", "image": "/images/trainings/strength_01.JPEG"},
    {"id": 2, "title": "雑巾しぼり", "ability": "strength", "desc": "左右差なく前腕と手指を使い、日常動作に直結する握力を養う。", "freq": "週3回", "image": "/images/trainings/strength_02.JPEG"},
    {"id": 3, "title": "ぶら下がり", "ability": "strength", "desc": "体重を支えることで握力+肩・体幹の支持力も同時に強化。", "freq": "週2回", "image": "/images/trainings/strength_03.JPEG"},
    {"id": 4, "title": "クマ歩き", "ability": "strength", "desc": "手で体を支えるため、握力と上半身の連動力が高まる。", "freq": "週2回", "image": "/images/trainings/strength_04.JPEG"},
    {"id": 5, "title": "カニ歩き", "ability": "strength", "desc": "手と足で体重を分散し、持続的な握力と体幹安定性を養う。", "freq": "週2回", "image": "/images/trainings/strength_05.JPEG"},
    {"id": 6, "title": "プランク手支持", "ability": "strength", "desc": "手で床を押すことで手指・前腕の支持力を強化。", "freq": "週3回", "image": "/images/trainings/strength_06.JPEG"},
    {"id": 7, "title": "ペットボトル持ち替え", "ability": "strength", "desc": "握る→離す動作で巧緻性と握力のコントロール力を鍛える。", "freq": "週2回", "image": "/images/trainings/strength_07.JPEG"},
    {"id": 8, "title": "指立て伏せ(簡易)", "ability": "strength", "desc": "指に体重を分散させ、指先の力と安定性を高める。", "freq": "週2回", "image": "/images/trainings/strength_08.JPEG"},
    {"id": 9, "title": "ボール潰し", "ability": "strength", "desc": "最大握力を直接刺激し、握る瞬間の力発揮を強化。", "freq": "週2回", "image": "/images/trainings/strength_09.JPEG"},
    {"id": 10, "title": "ロープ引き(タオル)", "ability": "strength", "desc": "引く動作で握力+背中・体幹の連動を鍛える。", "freq": "週2回", "image": "/images/trainings/strength_10.JPEG"},
    # power(瞬発力)ID 11-20
    {"id": 11, "title": "その場ジャンプ", "ability": "power", "desc": "一瞬で地面を押す力を高め、跳ぶ基礎能力を作る。", "freq": "週2回", "image": "/images/trainings/power_11.JPEG"},
    {"id": 12, "title": "連続ジャンプ", "ability": "power", "desc": "反発を使った素早い力発揮を覚える。", "freq": "週2回", "image": "/images/trainings/power_12.JPEG"},
    {"id": 13, "title": "スクワットジャンプ", "ability": "power", "desc": "下半身の筋力を一気に使う力を養う。", "freq": "週2回", "image": "/images/trainings/power_13.JPEG"},
    {"id": 14, "title": "前後ジャンプ", "ability": "power", "desc": "前後方向への瞬間的な加速力を強化。", "freq": "週2回", "image": "/images/trainings/power_14.JPEG"},
    {"id": 15, "title": "横ジャンプ", "ability": "power", "desc": "横方向の瞬発力と着地の安定性を高める。", "freq": "週2回", "image": "/images/trainings/power_15.JPEG"},
    {"id": 16, "title": "反応ジャンプ", "ability": "power", "desc": "合図に反応して跳ぶことで神経系の瞬発性を刺激。", "freq": "週2回", "image": "/images/trainings/power_16.JPEG"},
    {"id": 17, "title": "バウンディング", "ability": "power", "desc": "走る時の地面反力を効率よく使う能力を育てる。", "freq": "週1回", "image": "/images/trainings/power_17.JPEG"},
    {"id": 18, "title": "スタートダッシュ3m", "ability": "power", "desc": "最初の一歩の爆発的な力を鍛える。", "freq": "週2回", "image": "/images/trainings/power_18.JPEG"},
    {"id": 19, "title": "キャッチ→即ジャンプ", "ability": "power", "desc": "動作切り替え能力と瞬発力を同時に強化。", "freq": "週2回", "image": "/images/trainings/power_19.JPEG"},
    {"id": 20, "title": "片足ジャンプ", "ability": "power", "desc": "片脚で力を出す能力とバランスを向上。", "freq": "週2回", "image": "/images/trainings/power_20.JPEG"},

    # speed(移動能力)ID 21-30
    {"id": 21, "title": "クマ歩き前進", "ability": "speed", "desc": "全身を連動させて前に進む基礎移動能力を高める。", "freq": "週2回", "image": "/images/trainings/speed_21.JPEG"},
    {"id": 22, "title": "クマ歩き後退", "ability": "speed", "desc": "後ろへの移動で空間認知と身体操作力を向上。", "freq": "週2回", "image": "/images/trainings/speed_22.JPEG"},
    {"id": 23, "title": "カニ歩き横移動", "ability": "speed", "desc": "横方向への移動能力と体幹安定性を強化。", "freq": "週2回", "image": "/images/trainings/speed_23.JPEG"},
    {"id": 24, "title": "サイドステップ", "ability": "speed", "desc": "スポーツで必須の横移動をスムーズにする。", "freq": "週2回", "image": "/images/trainings/speed_24.JPEG"},
    {"id": 25, "title": "スキップ", "ability": "speed", "desc": "リズムと上下移動を組み合わせた移動能力を養う。", "freq": "週2回", "image": "/images/trainings/speed_25.JPEG"},
    {"id": 26, "title": "クロスステップ", "ability": "speed", "desc": "足を交差させる動きで複雑な移動に対応できる。", "freq": "週2回", "image": "/images/trainings/speed_26.JPEG"},
    {"id": 27, "title": "ジグザグ走", "ability": "speed", "desc": "方向転換を含む移動能力を高める。", "freq": "週2回", "image": "/images/trainings/speed_27.JPEG"},
    {"id": 28, "title": "バック走", "ability": "speed", "desc": "後方移動で視野と身体操作の幅を広げる。", "freq": "週2回", "image": "/images/trainings/speed_28.JPEG"},
    {"id": 29, "title": "ハイハイ移動", "ability": "speed", "desc": "左右の協調性と体幹主導の移動を身につける。", "freq": "週2回", "image": "/images/trainings/speed_29.JPEG"},
    {"id": 30, "title": "8の字走", "ability": "speed", "desc": "連続した方向変換に対応する能力を鍛える。", "freq": "週2回", "image": "/images/trainings/speed_30.JPEG"},

    # balance(バランス)ID 31-40
    {"id": 31, "title": "片足立ち", "ability": "balance", "desc": "重心をコントロールする基本能力を養う。", "freq": "週3回", "image": "/images/trainings/balance_31.JPEG"},
    {"id": 32, "title": "目閉じ片足立ち", "ability": "balance", "desc": "視覚に頼らないバランス感覚を鍛える。", "freq": "週2回", "image": "/images/trainings/balance_32.JPEG"},
    {"id": 33, "title": "片足スクワット", "ability": "balance", "desc": "動きながらバランスを保つ力を強化。", "freq": "週2回", "image": "/images/trainings/balance_33.JPEG"},
    {"id": 34, "title": "つま先立ちキープ", "ability": "balance", "desc": "足首の安定性と姿勢保持力を高める。", "freq": "週3回", "image": "/images/trainings/balance_34.JPEG"},
    {"id": 35, "title": "かかと立ちキープ", "ability": "balance", "desc": "前後の重心コントロールを向上。", "freq": "週3回", "image": "/images/trainings/balance_35.JPEG"},
    {"id": 36, "title": "バランスボード", "ability": "balance", "desc": "不安定環境で姿勢調整力を養う。", "freq": "週2回", "image": "/images/trainings/balance_36.JPEG"},
    {"id": 37, "title": "片足キャッチ", "ability": "balance", "desc": "バランス+上肢操作を同時に鍛える。", "freq": "週2回", "image": "/images/trainings/balance_37.JPEG"},
    {"id": 38, "title": "片足ジャンプ着地", "ability": "balance", "desc": "着地時の衝撃吸収と安定性を向上。", "freq": "週2回", "image": "/images/trainings/balance_38.JPEG"},
    {"id": 39, "title": "T字バランス", "ability": "balance", "desc": "体幹と下肢を一直線で支える能力を養う。", "freq": "週2回", "image": "/images/trainings/balance_39.JPEG"},
    {"id": 40, "title": "不安定姿勢で投げ", "ability": "balance", "desc": "崩れながらも姿勢を立て直す力を育てる。", "freq": "週1回", "image": "/images/trainings/balance_40.JPEG"},

    # endurance(筋持久力)ID 41-50
    {"id": 41, "title": "スクワット連続", "ability": "endurance", "desc": "下半身を使い続ける力を鍛える。", "freq": "週2回", "image": "/images/trainings/endurance_41.JPEG"},
    {"id": 42, "title": "プランク", "ability": "endurance", "desc": "体幹を安定させたまま耐える力を強化。", "freq": "週3回", "image": "/images/trainings/endurance_42.JPEG"},
    {"id": 43, "title": "壁スクワット", "ability": "endurance", "desc": "静的姿勢で筋肉を使い続ける能力を養う。", "freq": "週2回", "image": "/images/trainings/endurance_43.JPEG"},
    {"id": 44, "title": "腕立て伏せ", "ability": "endurance", "desc": "上半身の持久力と体幹安定性を向上。", "freq": "週2回", "image": "/images/trainings/endurance_44.JPEG"},
    {"id": 45, "title": "マウンテンクライマー", "ability": "endurance", "desc": "全身を使った持久的運動能力を高める。", "freq": "週2回", "image": "/images/trainings/endurance_45.JPEG"},
    {"id": 46, "title": "連続ジャンプ30秒", "ability": "endurance", "desc": "疲れても動きを維持する力を養う。", "freq": "週2回", "image": "/images/trainings/endurance_46.JPEG"},
    {"id": 47, "title": "その場もも上げ", "ability": "endurance", "desc": "走動作に必要な下肢持久力を強化。", "freq": "週2回", "image": "/images/trainings/endurance_47.JPEG"},
    {"id": 48, "title": "クマ歩き往復", "ability": "endurance", "desc": "全身の筋持久力をバ��ンスよく鍛える。", "freq": "週2回", "image": "/images/trainings/endurance_48.JPEG"},
    {"id": 49, "title": "軽めバーピー", "ability": "endurance", "desc": "全身を使い続ける体力を向上。", "freq": "週2回", "image": "/images/trainings/endurance_49.JPEG"},
    {"id": 50, "title": "なわとび", "ability": "endurance", "desc": "リズムを保ちながら持久的に動く力を育てる。", "freq": "週3回", "image": "/images/trainings/endurance_50.JPEG"},
    # agility(敏捷性)ID 51-60
    {"id": 51, "title": "ラダートレーニング", "ability": "agility", "desc": "素早い足さばきとリズム感を養う。", "freq": "週2回", "image": "/images/trainings/agility_51.JPEG"},
    {"id": 52, "title": "サイドタッチ", "ability": "agility", "desc": "左右への素早い切り替えを強化。", "freq": "週2回", "image": "/images/trainings/agility_52.JPEG"},
    {"id": 53, "title": "色タッチ反応", "ability": "agility", "desc": "判断→動作の速さを高める。", "freq": "週2回", "image": "/images/trainings/agility_53.JPEG"},
    {"id": 54, "title": "合図ダッシュ", "ability": "agility", "desc": "スタート反応を速くする。", "freq": "週2回", "image": "/images/trainings/agility_54.JPEG"},
    {"id": 55, "title": "フェイントステップ", "ability": "agility", "desc": "相手をかわす動作の基礎を作る。", "freq": "週2回", "image": "/images/trainings/agility_55.JPEG"},
    {"id": 56, "title": "方向転換走", "ability": "agility", "desc": "急な切り返し能力を向上。", "freq": "週2回", "image": "/images/trainings/agility_56.JPEG"},
    {"id": 57, "title": "反応キャッチ", "ability": "agility", "desc": "目と体の連動スピードを高める。", "freq": "週2回", "image": "/images/trainings/agility_57.JPEG"},
    {"id": 58, "title": "ミラームーブ", "ability": "agility", "desc": "相手の動きを即座に真似る反応力を養う。", "freq": "週2回", "image": "/images/trainings/agility_58.JPEG"},
    {"id": 59, "title": "じゃんけんダッシュ", "ability": "agility", "desc": "判断力+瞬時の行動力を鍛える。", "freq": "週2回", "image": "/images/trainings/agility_59.JPEG"},
    {"id": 60, "title": "ストップ&ゴー走", "ability": "agility", "desc": "止まる→動く切り替え能力を強化。", "freq": "週2回", "image": "/images/trainings/agility_60.JPEG"},

    # throw(投力)ID 61-70
    {"id": 61, "title": "両手上投げ", "ability": "throw", "desc": "全身を使って力を伝える感覚を養う。", "freq": "週2回", "image": "/images/trainings/throw_61.JPEG"},
    {"id": 62, "title": "片手オーバースロー", "ability": "throw", "desc": "肩・体幹・下半身の連動を学ぶ。", "freq": "週2回", "image": "/images/trainings/throw_62.JPEG"},
    {"id": 63, "title": "下投げ", "ability": "throw", "desc": "腕だけでなく脚の使い方を覚える。", "freq": "週2回", "image": "/images/trainings/throw_63.JPEG"},
    {"id": 64, "title": "壁当てキャッチ", "ability": "throw", "desc": "投げる→受ける連動動作を強化。", "freq": "週2回", "image": "/images/trainings/throw_64.JPEG"},
    {"id": 65, "title": "的当て投げ", "ability": "throw", "desc": "狙って投げるコントロール力を向上。", "freq": "週2回", "image": "/images/trainings/throw_65.JPEG"},
    {"id": 66, "title": "膝立ち投げ", "ability": "throw", "desc": "体幹主導で投げる感覚を身につける。", "freq": "週2回", "image": "/images/trainings/throw_66.JPEG"},
    {"id": 67, "title": "体ひねり投げ", "ability": "throw", "desc": "回旋動作によるパワー伝達を学ぶ。", "freq": "週2回", "image": "/images/trainings/throw_67.JPEG"},
    {"id": 68, "title": "片足立ち投げ", "ability": "throw", "desc": "バランスを保ちながら投げる能力を養う。", "freq": "週2回", "image": "/images/trainings/throw_68.JPEG"},
    {"id": 69, "title": "連続キャッチ&投げ", "ability": "throw", "desc": "リズムと投動作の安定性を高める。", "freq": "週2回", "image": "/images/trainings/throw_69.JPEG"},
    {"id": 70, "title": "重さ違いボール投げ", "ability": "throw", "desc": "力の出し分けと適応能力を向上。", "freq": "週1回", "image": "/images/trainings/throw_70.JPEG"},
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


# ✅ 修正: 既存の推定式をフォールバック用に残す
def _legacy_estimation(test_key: str, sex: str, age: int) -> Tuple[float, float]:
    """
    既存の推定式(全国平均がない場合のフォールバック)
    """
    s = 1.0 if sex == "male" else 0.97
    
    if test_key == "grip":
        return (7.0 + (age - 6.0) * 1.4) * s, 2.2
    if test_key == "standing_jump":
        return (110 + (age - 6.0) * 7.5) * s, 18.0
    if test_key == "dash_15m_sec":
        return (3.7 - (age - 6.0) * 0.12) / s, 0.28
    if test_key == "continuous_standing_jump":
        return (390 + (age - 6.0) * 30.0) * s, 67.5
    if test_key == "squat_30s":
        return (14 + (age - 6.0) * 1.8) * s, 4.5
    if test_key == "side_step":
        return (22 + (age - 6.0) * 2.4) * s, 5.0
    if test_key == "ball_throw":
        return (6.0 + (age - 6.0) * 1.2) * s, 2.0
    
    return 0.0, 1.0


# ✅ 完全書き換え: 全国平均ベースの norm_mean_sd
def norm_mean_sd(test_key: str, sex: str, age_years: int) -> Tuple[float, float]:
    """
    種目ごとの平均・標準偏差を返す(全国平均データベース)
    
    優先順位:
    1. 全国平均データ(実測値)
    2. 換算ロジック(連続立ち幅跳び、15m走)
    3. 独自種目(スクワット)
    4. フォールバック(推定式)
    """
    age = clamp(int(age_years), 6, 11)
    
    # ✅ 全国平均データから取得(握力・立ち幅跳び・反復横跳び・ボール投げ)
    if test_key in ["grip", "standing_jump", "side_step", "ball_throw"]:
        avg, sd = get_national_mean_sd(test_key, sex, age)
        
        # 欠損時は推定式にフォールバック
        if avg is None:
            return _legacy_estimation(test_key, sex, age)
        
        return avg, sd
    
    # 🔄 連続立ち幅跳び = 立ち幅跳び × 3
    if test_key == "continuous_standing_jump":
        avg_single = get_national_average("standing_jump", sex, age)
        
        if avg_single is None:
            return _legacy_estimation(test_key, sex, age)
        
        avg_triple = avg_single * 3
        sd_triple = get_sd_from_mean("standing_jump", avg_single) * 3
        return avg_triple, sd_triple
    
    # 🔄 15m走 = 50m走 × 0.38(加速区間推定)
    if test_key == "dash_15m_sec":
        avg_50m = get_national_average("dash_50m", sex, age)
        
        if avg_50m is None:
            return _legacy_estimation(test_key, sex, age)
        
        avg_15m = avg_50m * 0.38
        sd_15m = get_sd_from_mean("dash_15m_sec", avg_15m)
        return avg_15m, sd_15m
    
    # 🔧 独自種目(全国平均なし)→ 既存ロジック維持
    if test_key == "squat_30s":
        return _legacy_estimation(test_key, sex, age)
    
    return 0.0, 1.0


def t_score(test_key: str, value: float, sex: str, age_years: int) -> float:
    mean, sd = norm_mean_sd(test_key, sex, age_years)
    if sd <= 0:
        return 50.0
    z = (value - mean) / sd

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
    top = sorted(ability_t.items(), key=lambda x: x[1], reverse=True)
    a1 = top[0][0]

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
    if a1 == "balance":
        return {"key": "balance", "label": "バランス 安定タイプ", "desc": "姿勢制御能力が高く、技術習得がスムーズです。"}
    return {"key": "endurance", "label": "筋持久力 継続タイプ", "desc": "動きを繰り返す力が伸びやすいタイプです。"}


def pick_class(avg_t: float) -> Dict[str, str]:
    if avg_t >= 58:
        return {"key": "expert", "label": "上位(ハイレベル)"}
    if avg_t >= 45:
        return {"key": "standard", "label": "標準(スタンダード)"}
    return {"key": "beginner", "label": "基礎(伸びしろ大)"}


def motor_age_from_avg_t(age_years: int, avg_t: float) -> Tuple[float, str]:
    diff_year = (avg_t - 50.0) / 10.0
    val = clamp(age_years + diff_year, 6.0, 15.0)
    label = f"{int(round(val))}"
    return float(round(val, 1)), label


def sport_recommendations(ability_t: Dict[str, float], topn: int = 6) -> List[dict]:
    ranked = []
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
                "reason": f"強み({ABILITY_META[top3[0]]['label']}・{ABILITY_META[top3[1]]['label']})を活かしやすい",
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
                    "image": it.get("image"),
                }
            )
    return out


def guardian_message(avg_t: float, top2: List[str], bottom2: List[str]) -> str:
    top_txt = "・".join([ABILITY_META[a]["label"] for a in top2])
    bot_txt = "・".join([ABILITY_META[a]["label"] for a in bottom2])

    if avg_t >= 55:
        return f"同年代と比べて高めです。得意({top_txt})を伸ばしつつ、苦手({bot_txt})は週1〜2回の練習で底上げしましょう。"
    if avg_t >= 45:
        return f"同年代と同程度です。得意({top_txt})を維持しながら、苦手({bot_txt})を少しずつ伸ばすのがおすすめです。"
    return f"これから伸びる時期です。まずは苦手({bot_txt})を週2回ほど練習して土台を作り、得意({top_txt})を活かせる運動を増やしましょう。"


def month_goal(bottom2: List[str]) -> str:
    a = ABILITY_META[bottom2[0]]["label"]
    b = ABILITY_META[bottom2[1]]["label"]
    return f"最初の1ヶ月は「{a}」「{b}」の底上げに集中(週2回×10分〜)。フォームと基礎を揃えることが最優先です。"


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
    if not isinstance(payload, dict):
        raise CalcError("payload が不正です(JSON)")

    patient_id = payload.get("patient_id")
    if patient_id is None:
        raise CalcError("patient_id が必要です")

    try:
        clinic_id_i = int(clinic_id)
        patient_id_i = int(patient_id)
    except Exception:
        raise CalcError("patient_id は整数で指定してください")

    p = fetch_patient(db, clinic_id_i, patient_id_i)
    if not p:
        raise CalcError("患者が見つかりません(patient_id を確認)")

    bd = p["birth_date"]
    if isinstance(bd, str):
        bd = datetime.strptime(bd[:10], "%Y-%m-%d").date()
    sex = p["sex"]
    if sex not in ("male", "female"):
        sex = "male"

    age_y, age_m = calc_age_years_months(bd)

    grip_best = max(_require_number(payload, "grip_right"), _require_number(payload, "grip_left"))
    standing_jump = _require_number(payload, "standing_jump")
    dash_15 = _require_number(payload, "dash_15m_sec")
    if dash_15 <= 0:
        raise CalcError("dash_15m_sec は 0 より大きい値で入力してください")
    cont_jump = _require_number(payload, "continuous_standing_jump")
    squat_30 = _require_number(payload, "squat_30s")
    side_step = _require_number(payload, "side_step")
    ball_throw = _require_number(payload, "ball_throw")

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

    # ✅ 修正: payloadから測定日を取得(フォールバックは今日の日付)
    measured_at_str = payload.get("measured_at")
    if measured_at_str and isinstance(measured_at_str, str):
        try:
            # YYYY-MM-DD形式のバリデーション
            measured_at = datetime.strptime(measured_at_str[:10], "%Y-%m-%d").date().isoformat()
        except Exception:
            # パースエラー時は今日の日付にフォールバック
            measured_at = date.today().isoformat()
    else:
        # measured_atが指定されていない場合は今日の日付
        measured_at = date.today().isoformat()

    test_values = {
        "grip": grip_best,
        "standing_jump": standing_jump,
        "dash_15m_sec": dash_15,
        "continuous_standing_jump": cont_jump,
        "squat_30s": squat_30,
        "side_step": side_step,
        "ball_throw": ball_throw,
    }

    test_t = {k: t_score(k, v, sex, age_y) for k, v in test_values.items()}

    ability_t = ability_scores_from_tests(test_t)

    top2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1], reverse=True)[:2]]
    bottom2 = [k for k, _ in sorted(ability_t.items(), key=lambda x: x[1])[:2]]

    avg_t = sum(ability_t.values()) / len(ability_t)

    cls = pick_class(avg_t)
    tp = pick_type(ability_t)
    motor_age_val, motor_age_label = motor_age_from_avg_t(age_y, avg_t)

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

    return {
        "meta": {"measured_at": measured_at},  # ✅ payloadから取得した測定日を使用
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