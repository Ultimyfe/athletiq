# api/deps/auth.py
# from fastapi import Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# import jwt

# SECRET_KEY = "CHANGE_ME_SECRET"
# ALGORITHM = "HS256"

# security = HTTPBearer()


# def get_current_clinic(
#     cred: HTTPAuthorizationCredentials = Depends(security),
# ) -> dict:
#     try:
#         payload = jwt.decode(
#             cred.credentials,
#             SECRET_KEY,
#             algorithms=[ALGORITHM],
#         )
#         return payload
#     except Exception:
#         raise HTTPException(status_code=401, detail="invalid token")

# api/deps/auth.py
# import os

# from fastapi import Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# import jwt

# SECRET_KEY = os.getenv("ATHLETIQ_JWT_SECRET")
# ALGORITHM = os.getenv("ATHLETIQ_JWT_ALGORITHM", "HS256")

# if not SECRET_KEY:
#     raise RuntimeError("ATHLETIQ_JWT_SECRET is not set")

# # ✅ Authorizationが無い時に FastAPI が自動で 403 を返さないようにする
# security = HTTPBearer(auto_error=False)


# def get_current_clinic(
#     cred: HTTPAuthorizationCredentials = Depends(security),
# ) -> dict:
#     if cred is None or not cred.credentials:
#         raise HTTPException(status_code=401, detail="Not authenticated")

#     try:
#         payload = jwt.decode(
#             cred.credentials,
#             SECRET_KEY,
#             algorithms=[ALGORITHM],
#             options={"require": ["exp"]},
#         )
#         clinic_id = payload.get("clinic_id")
#         if clinic_id is None:
#             raise HTTPException(status_code=401, detail="invalid token")
#         return payload
#     except HTTPException:
#         raise
#     except Exception:
#         raise HTTPException(status_code=401, detail="invalid token")

# api/deps/auth.py
import os

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()


def _get_secret() -> str:
    secret = os.getenv("ATHLETIQ_JWT_SECRET")
    if not secret:
        raise RuntimeError("ATHLETIQ_JWT_SECRET is not set")
    return secret


def _get_algorithm() -> str:
    return os.getenv("ATHLETIQ_JWT_ALGORITHM", "HS256")


def get_current_clinic(
    cred: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = jwt.decode(
            cred.credentials,
            _get_secret(),
            algorithms=[_get_algorithm()],
        )
        # 必須キーだけ最低限チェック
        if "clinic_id" not in payload:
            raise HTTPException(status_code=401, detail="invalid token")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")