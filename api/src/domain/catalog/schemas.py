from pydantic import BaseModel, ConfigDict

from src.domain.catalog.models import RegionCode


class PlatformRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str


class GameRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    region: RegionCode
    release_year: int | None
    cover_url: str | None
    platform: PlatformRead


class GamePage(BaseModel):
    items: list[GameRead]
    total: int
    page: int
    page_size: int
