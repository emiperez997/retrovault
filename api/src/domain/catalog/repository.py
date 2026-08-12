from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.catalog.models import Game


async def search_games(
    db: AsyncSession,
    *,
    query: str | None = None,
    platform_id: int | None = None,
    page: int = 1,
    page_size: int = 24,
) -> tuple[list[Game], int]:
    stmt = select(Game).options(joinedload(Game.platform))
    count_stmt = select(func.count()).select_from(Game)

    if query:
        pattern = f"%{query.lower()}%"
        stmt = stmt.where(Game.title_norm.like(pattern))
        count_stmt = count_stmt.where(Game.title_norm.like(pattern))

    if platform_id:
        stmt = stmt.where(Game.platform_id == platform_id)
        count_stmt = count_stmt.where(Game.platform_id == platform_id)

    stmt = stmt.order_by(Game.title).offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    total = await db.scalar(count_stmt) or 0
    return list(result.scalars().unique().all()), total


async def get_game(db: AsyncSession, game_id: int) -> Game | None:
    stmt = select(Game).options(joinedload(Game.platform)).where(Game.id == game_id)
    return await db.scalar(stmt)
