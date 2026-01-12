import json
import logging
import time

import httpx
import jwt
from jwt.algorithms import ECAlgorithm
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings


logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

_JWKS_CACHE: dict | None = None
_JWKS_CACHE_EXPIRES = 0.0


class AuthenticatedUser:
    def __init__(self, user_id: str, email: str | None = None, role: str = "authenticated"):
        self.user_id = user_id
        self.email = email
        self.role = role


def _issuer() -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1"


def _jwks_urls() -> list[str]:
    base = settings.supabase_url.rstrip("/")
    return [
        f"{base}/auth/v1/.well-known/jwks.json",
        f"{base}/auth/v1/keys",
    ]


def _fetch_jwks() -> dict:
    global _JWKS_CACHE, _JWKS_CACHE_EXPIRES
    now = time.time()
    if _JWKS_CACHE and now < _JWKS_CACHE_EXPIRES:
        return _JWKS_CACHE

    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
    }
    last_error: Exception | None = None
    with httpx.Client(timeout=5.0) as client:
        for url in _jwks_urls():
            try:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                _JWKS_CACHE = data
                _JWKS_CACHE_EXPIRES = now + 600
                return data
            except Exception as exc:
                last_error = exc
                logger.error("JWKS fetch failed for %s: %s", url, exc)

    if last_error:
        raise last_error
    raise HTTPException(status_code=401, detail="JWKS fetch failed")


def _get_es256_key(token: str):
    header = jwt.get_unverified_header(token)
    if header.get("alg") != "ES256":
        raise HTTPException(status_code=401, detail="Invalid token algorithm")
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token header")

    jwks = _fetch_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return ECAlgorithm.from_jwk(json.dumps(key))

    raise HTTPException(status_code=401, detail="Signing key not found")


def _decode_token(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg")
    if alg == "HS256":
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=_issuer(),
        )
    if alg == "ES256":
        signing_key = _get_es256_key(token)
        return jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=_issuer(),
        )
    raise HTTPException(status_code=401, detail="Unsupported token algorithm")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser | None:
    if not credentials:
        return None

    token = credentials.credentials
    try:
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.error("Invalid token: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    except httpx.HTTPError as exc:
        logger.error("JWKS fetch failed: %s", exc)
        raise HTTPException(status_code=401, detail="Token verification unavailable") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    return AuthenticatedUser(
        user_id=user_id,
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
    )


async def require_auth(user: AuthenticatedUser | None = Depends(get_current_user)) -> AuthenticatedUser:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
