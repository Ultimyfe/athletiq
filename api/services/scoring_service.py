from __future__ import annotations

from typing import Dict, List
import math
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

# ---- constants ----
TEST_KEYS = [
    "grip",
    "standing_jump",
    "dash_15m_sec",
    "continuous_standing_jump",
    "squat_30s",
    "side_step",
    "ball_throw",
]

ABILITIES = ["strength", "power", "speed", "agility", "throw", "repeat"]

TEST_META = {
    "grip": {"label": "握力(平均)", "unit": "kg"},
    "standing_jump": {"label": "立ち幅跳び", "unit": "cm"},
    "dash_15m_sec": {"label": "15m走", "unit": "秒"},
    "continuous_standing_jump": {"label": "連続立ち幅跳び(合計)", "unit": "cm"},
    "squat_30s": {"label": "30秒スクワット", "unit": "回"},
    "side_step": {"label": "反復横跳び", "unit": "回"},
    "ball_throw": {"label": "ボール投げ", "unit": "m"},
}

ABILITY_META = {
    "strength": {"label": "筋力"},
    "power": {"label": "瞬発力"},
    "speed": {"label": "スピード"},
    "agility": {"label": "敏捷性"},
    "throw": {"label": "投力"},
    "repeat": {"label": "反復パワー"},
}


class CalcError(Exception):
    pass


def z_to_t(z: float) -> float:
    return 50.0 + 10.0 * z


def _std(vals: List[float]) -> float:
    m = sum(vals) / len(vals)
    v = sum((x - m) ** 2 for x in vals) / len(vals)
    return math.sqrt(v)


def _round1(x: float) -> float:
    return float(f"{x:.1f}")


def grade_from_t(t: float, thresholds: List[dict]) -> int:
    for r in thresholds:
        g = int(r["grade_10"])
        t_min = r["t_min"]
        t_max = r["t_max"]
        lo_ok = True if t_min is None else (t >= float(t_min))
        hi_ok = True if t_max is None else (t < float(t_max))
        if lo_ok and hi_ok:
            return g
    return 5


def load_norms(db: Session, age: int, sex: str) -> Dict[str, dict]:
    rows = (
        db.execute(
            text(
                """
                SELECT test_key,
                       avg::float8 AS avg,
                       sd::float8  AS sd
                FROM norm_master
                WHERE age = :age AND sex = :sex
                """
            ),
            {"age": age, "sex": sex},
        )
        .mappings()
        .all()
    )
    m = {r["test_key"]: r for r in rows}
    missing = [k for k in TEST_KEYS if k not in m]
    if missing:
        raise CalcError(f"norm_master missing: age={age}, sex={sex}, missing={missing}")
    for k in TEST_KEYS:
        if float(m[k]["sd"]) <= 0:
            raise CalcError(f"norm_master sd<=0 for {k}")
    return m


def load_thresholds(db: Session) -> List[dict]:
    rows = (
        db.execute(
            text(
                """
                SELECT grade_10,
                       t_min::float8 AS t_min,
                       t_max::float8 AS t_max
                FROM grade_thresholds
                ORDER BY grade_10
                """
            )
        )
        .mappings()
        .all()
    )
    if not rows:
        raise CalcError("grade_thresholds empty")
    return list(rows)


def load_ability_weights(db: Session) -> List[dict]:
    rows = (
        db.execute(
            text(
                """
                SELECT ability,
                       test_key,
                       weight::float8 AS weight,
                       direction::int AS direction
                FROM ability_weights
                """
            )
        )
        .mappings()
        .all()
    )
    if not rows:
        raise CalcError("ability_weights empty")
    return list(rows)


def _insert_measurements_raw(db: Session, payload: dict) -> int:
    stmt = text(
        """
        INSERT INTO measurements_raw (
          age, sex,
          grip_right, grip_left,
          standing_jump, dash_15m_sec,
          continuous_standing_jump, squat_30s,
          side_step, ball_throw,
          raw_payload
        )
        VALUES (
          :age, :sex,
          :grip_right, :grip_left,
          :standing_jump, :dash_15m_sec,
          :continuous_standing_jump, :squat_30s,
          :side_step, :ball_throw,
          (:raw_payload)::jsonb
        )
        RETURNING id
        """
    )

    params = {
        "age": int(payload["age"]),
        "sex": str(payload["sex"]).strip().lower(),
        "grip_right": float(payload["grip_right"]),
        "grip_left": float(payload["grip_left"]),
        "standing_jump": float(payload["standing_jump"]),
        "dash_15m_sec": float(payload["dash_15m_sec"]),
        "continuous_standing_jump": float(payload["continuous_standing_jump"]),
        "squat_30s": float(payload["squat_30s"]),
        "side_step": float(payload["side_step"]),
        "ball_throw": float(payload["ball_throw"]),
        "raw_payload": json.dumps(payload, ensure_ascii=False),
    }

    raw_id = db.execute(stmt, params).scalar_one()
    return int(raw_id)


def _insert_measurements_scored(db: Session, raw_id: int, result: dict) -> int:
    stmt = text(
        """
        INSERT INTO measurements_scored (raw_id, result)
        VALUES (:raw_id, (:result)::jsonb)
        RETURNING id
        """
    )
    scored_id = db.execute(
        stmt,
        {"raw_id": int(raw_id), "result": json.dumps(result, ensure_ascii=False)},
    ).scalar_one()
    return int(scored_id)


def _insert_measurements(db: Session, payload: dict) -> int:
    """
    measurements に INSERT して id を返す
    - measurements.user_id が NOT NULL なので、今は user_id=1 固定
    - measurements.dash_15m はカラム名が dash_15m（_sec じゃない）なので注意
    """
    stmt = text(
        """
        INSERT INTO measurements (
          user_id,
          grip_right,
          grip_left,
          standing_jump,
          dash_15m,
          continuous_standing_jump,
          squat_30s,
          side_step,
          ball_throw
        )
        VALUES (
          :user_id,
          :grip_right,
          :grip_left,
          :standing_jump,
          :dash_15m,
          :continuous_standing_jump,
          :squat_30s,
          :side_step,
          :ball_throw
        )
        RETURNING id
        """
    )

    mid = db.execute(
        stmt,
        {
            "user_id": 1,
            "grip_right": float(payload["grip_right"]),
            "grip_left": float(payload["grip_left"]),
            "standing_jump": float(payload["standing_jump"]),
            "dash_15m": float(payload["dash_15m_sec"]),
            "continuous_standing_jump": float(payload["continuous_standing_jump"]),
            "squat_30s": float(payload["squat_30s"]),
            "side_step": float(payload["side_step"]),
            "ball_throw": float(payload["ball_throw"]),
        },
    ).scalar_one()

    return int(mid)


def _insert_diagnosis_results(
    db: Session,
    measurement_id: int,
    raw_id: int,
    scored_id: int,
    motor_age: int,
    grade_10: int,
    athlete_type: str,
) -> int:
    stmt = text(
        """
        INSERT INTO diagnosis_results (
          measurement_id,
          motor_age,
          grade_10,
          athlete_type,
          month_goal,
          raw_id,
          scored_id
        )
        VALUES (
          :measurement_id,
          :motor_age,
          :grade_10,
          :athlete_type,
          NULL,
          :raw_id,
          :scored_id
        )
        RETURNING id
        """
    )

    diagnosis_id = db.execute(
        stmt,
        {
            "measurement_id": int(measurement_id),
            "motor_age": int(motor_age),
            "grade_10": int(grade_10),
            "athlete_type": str(athlete_type),
            "raw_id": int(raw_id),
            "scored_id": int(scored_id),
        },
    ).scalar_one()

    return int(diagnosis_id)


def diagnose(db: Session, payload: dict) -> dict:
    # ---- validate ----
    if "age" not in payload or "sex" not in payload:
        raise CalcError("age and sex are required")

    age = int(payload["age"])
    sex = str(payload["sex"]).strip().lower()
    if sex not in ("male", "female"):
        raise CalcError("sex must be 'male' or 'female'")

    # grip composite
    try:
        grip = (float(payload["grip_right"]) + float(payload["grip_left"])) / 2.0
    except Exception:
        raise CalcError("grip_right and grip_left must be numeric")

    # tests (raw values)
    try:
        tests: Dict[str, float] = {
            "grip": grip,
            "standing_jump": float(payload["standing_jump"]),
            "dash_15m_sec": float(payload["dash_15m_sec"]),
            "continuous_standing_jump": float(payload["continuous_standing_jump"]),
            "squat_30s": float(payload["squat_30s"]),
            "side_step": float(payload["side_step"]),
            "ball_throw": float(payload["ball_throw"]),
        }
    except KeyError as e:
        raise CalcError(f"missing field: {e}")
    except Exception:
        raise CalcError("test values must be numeric")

    # ---- transaction ----
    try:
        # 0) measurements を作る（FKの親）
        measurement_id = _insert_measurements(db, payload)

        # 1) raw 保存
        raw_id = _insert_measurements_raw(db, payload)

        # ---- masters ----
        norms = load_norms(db, age, sex)
        thresholds = load_thresholds(db)
        aw = load_ability_weights(db)

        # direction per test (DB優先)
        directions = {k: 1 for k in TEST_KEYS}
        for r in aw:
            directions[r["test_key"]] = int(r["direction"])

        # ---- per-test scoring ----
        z_tests: Dict[str, float] = {}
        t_tests: Dict[str, float] = {}
        grade_tests: Dict[str, int] = {}

        for k, x in tests.items():
            avg = float(norms[k]["avg"])
            sd = float(norms[k]["sd"])
            d = directions.get(k, 1)
            z = (x - avg) / sd if d == 1 else (avg - x) / sd
            t = z_to_t(z)
            g = grade_from_t(t, thresholds)

            z_tests[k] = z
            t_tests[k] = t
            grade_tests[k] = g

        # ---- ability scoring (z weighted average) ----
        acc = {a: 0.0 for a in ABILITIES}
        wsum = {a: 0.0 for a in ABILITIES}

        for r in aw:
            ability = r["ability"]
            test_key = r["test_key"]
            w = float(r["weight"])
            if ability in acc:
                acc[ability] += w * float(z_tests[test_key])
                wsum[ability] += w

        z_abilities: Dict[str, float] = {}
        t_abilities: Dict[str, float] = {}
        grade_abilities: Dict[str, int] = {}

        for a in ABILITIES:
            if wsum[a] <= 0:
                raise CalcError(f"ability_weights missing for ability={a}")
            z_a = acc[a] / wsum[a]
            t_a = z_to_t(z_a)
            g_a = grade_from_t(t_a, thresholds)
            z_abilities[a] = z_a
            t_abilities[a] = t_a
            grade_abilities[a] = g_a

        # ---- overall ----
        z_overall = sum(z_abilities[a] for a in ABILITIES) / len(ABILITIES)
        t_overall = z_to_t(z_overall)
        grade_overall = grade_from_t(t_overall, thresholds)

        # ---- motor age ----
        motor_age = int(round(max(age - 3, min(age + 3, age + 1.0 * z_overall))))

        # ---- type ----
        vals = [z_abilities[a] for a in ABILITIES]
        spread = _std(vals)
        top_ability = max(z_abilities, key=lambda k: z_abilities[k])

        if z_overall >= 0.7 and spread <= 0.6:
            type_label = "all-rounder"
        elif z_overall >= 0.7 and spread > 0.6:
            type_label = f"specialist:{top_ability}"
        elif z_abilities[top_ability] >= 0.5:
            type_label = f"growth:{top_ability}"
        else:
            type_label = "foundation"

        # ---- format output ----
        out_tests = []
        for k in TEST_KEYS:
            meta = TEST_META.get(k, {"label": k, "unit": ""})
            out_tests.append(
                {
                    "key": k,
                    "label": meta["label"],
                    "value": _round1(float(tests[k])),
                    "unit": meta["unit"],
                    "t": _round1(float(t_tests[k])),
                    "grade_10": int(grade_tests[k]),
                }
            )

        out_abilities = []
        for a in ABILITIES:
            meta = ABILITY_META.get(a, {"label": a})
            out_abilities.append(
                {
                    "key": a,
                    "label": meta["label"],
                    "t": _round1(float(t_abilities[a])),
                    "grade_10": int(grade_abilities[a]),
                }
            )

        result = {
            "summary": {
                "age": age,
                "sex": sex,
                "overall": {"t": _round1(float(t_overall)), "grade_10": int(grade_overall)},
                "motor_age": int(motor_age),
                "type": type_label,
            },
            "tests": out_tests,
            "abilities": out_abilities,
        }

        # 2) scored 保存
        scored_id = _insert_measurements_scored(db, raw_id, result)

        # 3) diagnosis_results 保存（FKの親 measurement_id を正しく入れる）
        _insert_diagnosis_results(
            db,
            measurement_id=measurement_id,
            raw_id=raw_id,
            scored_id=scored_id,
            motor_age=motor_age,
            grade_10=grade_overall,
            athlete_type=type_label,
        )

        db.commit()
        return result

    except Exception:
        db.rollback()
        raise