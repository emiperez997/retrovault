from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.domain.catalog.schemas import GameRead
from src.domain.collection.models import BacklogStatus, ItemCondition


class CollectionItemBase(BaseModel):
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
            raise ValueError("owned_condition must be None if owned is False")

        return self


class CollectionItemCreate(CollectionItemBase):
    game_id: int


class ColectionItemUpdate(CollectionItemBase):
    pass


class CollectionItemRead(CollectionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game: GameRead
