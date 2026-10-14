from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.domain.catalog import repository
from src.domain.catalog.schemas import GamePage, GameRead

router = APIRouter(prefix="/api/games", tags=["catalog"])


@router.get("", response_model=GamePage)
async def list_games(
    q: str | None = None,
    platform_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    games, total = await repository.search_games(
        db, query=q, platform_id=platform_id, page=page, page_size=page_size
    )
    return GamePage(
        items=[GameRead.model_validate(g) for g in games],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{game_id}", response_model=GameRead)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await repository.get_game(db, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="No encontramos ese juego")
    return game
