import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.catalog.models import Game
from src.domain.collection.models import AppUser, CollectionItem


async def get_or_create_user(db: AsyncSession, email: str) -> AppUser:
    user = await db.scalar(select(AppUser).where(AppUser.email == email))
    if user is None:
        user = AppUser(email=email, display_name="Dev")
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


def _with_game():
    """Carga el juego y su plataforma en la misma query."""
    return joinedload(CollectionItem.game).joinedload(Game.platform)


async def list_items(db: AsyncSession, user_id: uuid.UUID) -> list[CollectionItem]:
    stmt = (
        select(CollectionItem)
        .options(_with_game())
        .where(CollectionItem.user_id == user_id)
        .order_by(CollectionItem.updated_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def get_owned_item(
    db: AsyncSession, user_id: uuid.UUID, item_id: int
) -> CollectionItem | None:
    """
    Única forma de traer un ítem por id en toda la app.

    El filtro por user_id va acá adentro, no en el router: buscar por id
    y después chequear el dueño en Python es exactamente cómo se filtra
    información entre usuarios. Si el ítem no es tuyo, no existe.
    """
    stmt = (
        select(CollectionItem)
        .options(_with_game())
        .where(
            CollectionItem.id == item_id,
            CollectionItem.user_id == user_id,
        )
    )
    return await db.scalar(stmt)


async def find_by_game(
    db: AsyncSession, user_id: uuid.UUID, game_id: int
) -> CollectionItem | None:
    stmt = select(CollectionItem).where(
        CollectionItem.user_id == user_id,
        CollectionItem.game_id == game_id,
    )
    return await db.scalar(stmt)


async def create(
    db: AsyncSession, user_id: uuid.UUID, game_id: int, data: dict
) -> CollectionItem | None:
    item = CollectionItem(user_id=user_id, game_id=game_id, **data)
    db.add(item)
    await db.commit()
    return await get_owned_item(db, user_id, item.id)


async def update(db: AsyncSession, item: CollectionItem, data: dict) -> CollectionItem:
    for field, value in data.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete(db: AsyncSession, item: CollectionItem) -> None:
    await db.delete(item)
    await db.commit()
