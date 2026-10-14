from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.database import get_db
from src.domain.collection import repository
from src.domain.collection.models import AppUser

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(db: DbSession) -> AppUser:
    """Fase 1: siempre el mismo usuario. Se reemplaza por auth real en la fase 5."""
    return await repository.get_or_create_user(db, get_settings().dev_user_email)


CurrentUser = Annotated[AppUser, Depends(get_current_user)]
