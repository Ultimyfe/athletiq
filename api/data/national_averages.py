# api/data/national_averages.py

"""
全国体力・運動能力調査の平均値データ（小学生 6〜11歳）
標準偏差は変動係数（CV）から自動計算
"""

from typing import Optional, Tuple

# 種目ごとの変動係数（CV: Coefficient of Variation）
# スポーツテストの経験的な値
CV_BY_TEST = {
    "grip": 0.23,           # 握力: 約23%のばらつき
    "standing_jump": 0.13,  # 立ち幅跳び: 約13%
    "side_step": 0.15,      # 反復横跳び: 約15%
    "ball_throw": 0.24,     # ボール投げ: 約24%（個人差大）
    "dash_50m": 0.075,      # 50m走: 約7.5%
    "dash_15m_sec": 0.08,   # 15m走: 約8%
    "squat_30s": 0.32,      # スクワット: 約32%（独自種目）
}

# 全国平均データ（文部科学省 全国体力・運動能力調査より）
NATIONAL_AVERAGES = {
    "male": {
        6: {
            "grip": 9.52,
            "standing_jump": 111.25,
            "side_step": 26.05,
            "ball_throw": 8.41,
            "dash_50m": 11.68,
        },
        7: {
            "grip": 11.34,
            "standing_jump": 123.74,
            "side_step": 29.73,
            "ball_throw": 12.00,
            "dash_50m": 10.90,
        },
        8: {
            "grip": 13.32,
            "standing_jump": 135.35,
            "side_step": 34.21,
            "ball_throw": 15.88,
            "dash_50m": 10.24,
        },
        9: {
            "grip": 15.42,
            "standing_jump": 143.24,
            "side_step": 38.14,
            "ball_throw": 20.25,  # 欠損
            "dash_50m": 9.83,
        },
        10: {
            "grip": 17.60,
            "standing_jump": 154.16,  # 欠損
            "side_step": 40.86,
            "ball_throw": 24.26,
            "dash_50m": 9.48,
        },
        11: {
            "grip": 20.00,
            "standing_jump": 163.17,
            "side_step": 44.11,
            "ball_throw": 28.40,
            "dash_50m": 9.11,
        },
    },
    "female": {
        6: {
            "grip": 8.63,
            "standing_jump": 102.42,
            "side_step": 25.09,
            "ball_throw": 5.64,
            "dash_50m": 12.12,
        },
        7: {
            "grip": 10.74,
            "standing_jump": 116.97,
            "side_step": 29.11,
            "ball_throw": 7.72,
            "dash_50m": 11.14,
        },
        8: {
            "grip": 12.56,
            "standing_jump": 127.47,
            "side_step": 33.19,
            "ball_throw": 9.77,
            "dash_50m": 10.56,
        },
        9: {
            "grip": 14.46,
            "standing_jump": 136.26,
            "side_step": 36.06,
            "ball_throw": 12.17,
            "dash_50m": 10.08,
        },
        10: {
            "grip": 17.13,
            "standing_jump": 147.87,
            "side_step": 38.91,
            "ball_throw": 14.88,
            "dash_50m": 9.66,
        },
        11: {
            "grip": 19.44,
            "standing_jump": 151.91,
            "side_step": 40.93,
            "ball_throw": 16.52,
            "dash_50m": 9.44,
        },
    },
}


def get_national_average(test_key: str, sex: str, age: int) -> Optional[float]:
    """
    全国平均データから平均値を取得
    
    Args:
        test_key: 種目キー (grip, standing_jump, side_step, ball_throw, dash_50m)
        sex: 性別 (male, female)
        age: 年齢 (6〜11歳)
    
    Returns:
        平均値 or None（欠損時）
    """
    return NATIONAL_AVERAGES.get(sex, {}).get(age, {}).get(test_key)


def get_sd_from_mean(test_key: str, mean: float) -> float:
    """
    平均値から標準偏差を計算（変動係数を使用）
    
    標準偏差 = 平均 × 変動係数（CV）
    
    Args:
        test_key: 種目キー
        mean: 平均値
    
    Returns:
        標準偏差
    """
    cv = CV_BY_TEST.get(test_key, 0.15)  # デフォルト15%
    return mean * cv


def get_national_mean_sd(test_key: str, sex: str, age: int) -> Tuple[Optional[float], Optional[float]]:
    """
    全国平均データから平均と標準偏差を取得
    
    Args:
        test_key: 種目キー
        sex: 性別
        age: 年齢
    
    Returns:
        (平均, 標準偏差) or (None, None)
    """
    avg = get_national_average(test_key, sex, age)
    if avg is None:
        return None, None
    
    sd = get_sd_from_mean(test_key, avg)
    return avg, sd