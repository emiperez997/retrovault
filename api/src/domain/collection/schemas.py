from datetime import date
from decimal import Decimal

from pydantic import Field, model_validator

from src.domain.catalog.schemas import CamelModel, GameRead
from src.domain.collection.models import BacklogStatus, ItemCondition


class CollectionItemBase(CamelModel):
    status: BacklogStatus = BacklogStatus.BACKLOG
    owned: bool = False
    owned_condition: ItemCondition | None = None
    personal_rating: int | None = Field(default=None, ge=1, le=10)
    hours_played: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    started_at: date | None = None
    finished_at: date | None = None

    @model_validator(mode="after")
    def check_condition(self):
        if not self.owned and self.owned_condition is not None:
            raise ValueError("owned_condition requiere owned=true")
        return self


class CollectionItemCreate(CollectionItemBase):
    game_id: int


class CollectionItemUpdate(CamelModel):
    status: BacklogStatus | None = None
    owned: bool | None = None
    owned_condition: ItemCondition | None = None
    personal_rating: int | None = Field(default=None, ge=1, le=10)
    hours_played: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    started_at: date | None = None
    finished_at: date | None = None


class CollectionItemRead(CollectionItemBase):
    id: int
    game: GameRead
