import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.domain.catalog.models import Game


class BacklogStatus(str, enum.Enum):
    WISHLIST = "WISHLIST"
    BACKLOG = "BACKLOG"
    PLAYING = "PLAYING"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class ItemCondition(str, enum.Enum):
    LOOSE = "LOOSE"
    CIB = "CIB"
    SEALED = "SEALED"
    UNKNOWN = "UNKNOWN"


class AppUser(Base):
    __tablename__ = "app_user"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class CollectionItem(Base):
    __tablename__ = "collection_item"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="collection_item_unique"),
        CheckConstraint(
            "owned OR owned_condition IS NULL",
            name="condition_requires_owned",
        ),
        CheckConstraint(
            "personal_rating IS NULL OR personal_rating BETWEEN 1 AND 10",
            name="rating_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), index=True
    )
    game_id: Mapped[int] = mapped_column(ForeignKey("game.id"))

    status: Mapped[BacklogStatus] = mapped_column(
        Enum(BacklogStatus, name="backlog_status"), default=BacklogStatus.BACKLOG
    )
    owned: Mapped[bool] = mapped_column(default=False)
    owned_condition: Mapped[ItemCondition | None] = mapped_column(
        Enum(ItemCondition, name="item_condition")
    )
    personal_rating: Mapped[int | None] = mapped_column(SmallInteger)
    hours_played: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    notes: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[date | None]
    finished_at: Mapped[date | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    game: Mapped[Game] = relationship(lazy="joined")
