import asyncio

from sqlalchemy import select

from src.database import SessionLocal
from src.domain.catalog.models import Game, Platform, RegionCode
from src.domain.catalog.normalization import normalize_title, slugify

PLATFORMS = [
    {
        "slug": "n64",
        "name": "Nintendo 64",
        "manufacturer": "Nintendo",
        "release_year": 1996,
        "search_aliases": ["nintendo 64", "n64", "nintendo64"],
    },
    {
        "slug": "ps1",
        "name": "PlayStation",
        "manufacturer": "Sony",
        "release_year": 1994,
        "search_aliases": ["playstation", "ps1", "psx", "play 1"],
    },
    {
        "slug": "snes",
        "name": "Super Nintendo",
        "manufacturer": "Nintendo",
        "release_year": 1990,
        "search_aliases": ["super nintendo", "snes", "super nes"],
    },
]

GAMES = [
    ("n64", "Super Mario 64", 1996, "Nintendo"),
    ("n64", "The Legend of Zelda: Ocarina of Time", 1998, "Nintendo"),
    ("n64", "GoldenEye 007", 1997, "Rare"),
    ("n64", "Paper Mario", 2000, "Nintendo"),
    ("ps1", "Metal Gear Solid", 1998, "Konami"),
    ("ps1", "Silent Hill", 1999, "Konami"),
    ("ps1", "Final Fantasy VII", 1997, "Square"),
    ("ps1", "Castlevania: Symphony of the Night", 1997, "Konami"),
    ("snes", "Chrono Trigger", 1995, "Square"),
    ("snes", "Super Metroid", 1994, "Nintendo"),
    ("snes", "Donkey Kong Country", 1994, "Rare"),
    ("snes", "Super Mario World", 1990, "Nintendo"),
]


async def main() -> None:
    async with SessionLocal() as db:
        by_slug: dict[str, Platform] = {}
        for data in PLATFORMS:
            platform = await db.scalar(select(Platform).where(Platform.slug == data["slug"]))
            if platform is None:
                platform = Platform(**data)
                db.add(platform)
                await db.flush()
            by_slug[data["slug"]] = platform

        created = 0
        for platform_slug, title, year, publisher in GAMES:
            slug = f"{platform_slug}-{slugify(title)}"
            if await db.scalar(select(Game).where(Game.slug == slug)):
                continue
            db.add(
                Game(
                    platform_id=by_slug[platform_slug].id,
                    slug=slug,
                    title=title,
                    title_norm=normalize_title(title),
                    region=RegionCode.NTSC_U,
                    release_year=year,
                    publisher=publisher,
                )
            )
            created += 1

        await db.commit()
        print(f"Catálogo cargado. {created} juegos nuevos.")


if __name__ == "__main__":
    asyncio.run(main())
