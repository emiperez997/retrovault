from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.dependencies import get_current_user
from src.domain.catalog import repository as catalog_repo
from src.domain.collection import repository as collection_repo
from src.domain.collection.models import AppUser
from src.domain.collection.schemas import (
    CollectionItemCreate,
    CollectionItemRead,
    CollectionItemUpdate,
)

router = APIRouter(prefix="/api/collection", tags=["collection"])


async def _get_item_or_404(db: AsyncSession, user: AppUser, item_id: int):
    item = await collection_repo.get_owned_item(db, user.id, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="No encontramos ese ítem")
    return item


@router.get("", response_model=list[CollectionItemRead])
async def list_items(
    user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await collection_repo.list_items(db, user.id)


@router.post("", response_model=CollectionItemRead, status_code=status.HTTP_201_CREATED)
async def add_item(
    payload: CollectionItemCreate,
    user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if await catalog_repo.get_game(db, payload.game_id) is None:
        raise HTTPException(status_code=404, detail="No encontramos ese juego")

    if await collection_repo.find_by_game(db, user.id, payload.game_id):
        raise HTTPException(status_code=409, detail="Ese juego ya está en tu backlog")

    data = payload.model_dump(exclude={"game_id"})
    return await collection_repo.create(db, user.id, payload.game_id, data)


@router.patch("/{item_id}", response_model=CollectionItemRead)
async def update_item(
    item_id: int,
    payload: CollectionItemUpdate,
    user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_item_or_404(db, user, item_id)
    data = payload.model_dump(exclude_unset=True)

    # La regla owned/condition se revalida acá porque en un PATCH parcial
    # el estado final depende de lo que ya estaba en la base.
    owned = data.get("owned", item.owned)
    condition = data.get("owned_condition", item.owned_condition)
    if not owned and condition is not None:
        raise HTTPException(
            status_code=422,
            detail="No podés registrar la condición de una copia que no tenés",
        )

    return await collection_repo.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_item_or_404(db, user, item_id)
    await collection_repo.delete(db, item)
