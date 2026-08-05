import enum
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Enum,
    ForeignKey,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class RegionCode(str, enum.Enum):
    NTSC_U = "NTSC_U"
    NTSC_J = "NTSC_J"
    PAL = "PAL"
    BRA = "BRA"
    UNKNOWN = "UNKNOW"


class Platform(Base):
    __tablename__ = "platform"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    manufacturer: Mapped[str | None] = mapped_column(String(80))
    release_year: Mapped[int | None] = mapped_column(SmallInteger)
    search_aliases: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, server_default="{}"
    )

    games: Mapped[list["Game"]] = relationship(back_populates="platform")


class Game(Base):
    __tablename__ = "game"
    __table_args__ = (
        UniqueConstraint(
            "platform_id", "title_norm", "region", name="game_unique_release"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    platform_id: Mapped[int] = mapped_column(ForeignKey("platform.id"))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    title_norm: Mapped[str] = mapped_column(String(200), index=True)
    region: Mapped[RegionCode] = mapped_column(
        Enum(RegionCode, name="region_code"), default=RegionCode.UNKNOWN
    )
    release_year: Mapped[int | None] = mapped_column(SmallInteger)
    publisher: Mapped[str | None] = mapped_column(String(120))
    cover_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    platform: Mapped[Platform] = relationship(back_populates="games")
