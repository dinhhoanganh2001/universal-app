from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.friends import router as friends_router
from app.api.v1.game import router as game_router
from app.api.v1.money import router as money_router


api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(money_router, prefix="/money", tags=["money"])
api_router.include_router(friends_router, prefix="/friends", tags=["friends"])
api_router.include_router(game_router, prefix="/game", tags=["game"])
