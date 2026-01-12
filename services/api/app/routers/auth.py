from fastapi import APIRouter, Depends

from app.middleware.auth import require_auth, AuthenticatedUser


router = APIRouter()


@router.get("/me")
async def get_me(user: AuthenticatedUser = Depends(require_auth)):
    return {
        "user": {
            "id": user.user_id,
            "email": user.email,
            "role": user.role,
        }
    }
