from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from src.domain.catalog.models import RegionCode


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PlatformRead(CamelModel):
    id: int
    slug: str
    name: str


class GameRead(CamelModel):
    id: int
    slug: str
    title: str
    region: RegionCode
    release_year: int | None
    cover_url: str | None
    platform: PlatformRead


class GamePage(CamelModel):
    items: list[GameRead]
    total: int
    page: int
    page_size: int
