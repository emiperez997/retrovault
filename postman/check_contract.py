"""Validate frontend simulation traffic against the actual FastAPI schemas.

Run from the repository root after web's npm test:
    api/.venv/Scripts/python.exe -B postman/check_contract.py
No database is accessed.
"""

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://review:review@localhost/review")

from src.domain.catalog.schemas import GamePage, GameRead  # noqa: E402
from src.domain.collection.schemas import (  # noqa: E402
    CollectionItemCreate,
    CollectionItemRead,
    CollectionItemUpdate,
)


def main() -> None:
    checked = 0
    routes = set()
    for line in (ROOT / "postman" / "frontend.ndjson").read_text(encoding="utf-8").splitlines():
        if not line.startswith("{"):
            continue
        event = json.loads(line)
        if event.get("event") != "request" or not 200 <= event.get("statusCode", 0) < 300:
            continue
        path, method = event["path"].split("?")[0], event["method"]
        body = event.get("responseBody")
        request = event.get("requestBody")
        if method == "GET" and path == "/api/games":
            GamePage.model_validate(body)
        elif method == "GET" and re.fullmatch(r"/api/games/\d+", path):
            GameRead.model_validate(body)
        elif method == "GET" and path == "/api/collection":
            for item in body:
                CollectionItemRead.model_validate(item)
        elif method == "POST" and path == "/api/collection":
            CollectionItemCreate.model_validate(request)
            CollectionItemRead.model_validate(body)
        elif method == "PATCH" and re.fullmatch(r"/api/collection/\d+", path):
            CollectionItemUpdate.model_validate(request)
            CollectionItemRead.model_validate(body)
        elif method == "DELETE" and re.fullmatch(r"/api/collection/\d+", path):
            assert event["statusCode"] == 204
        else:
            continue
        checked += 1
        routes.add((method, re.sub(r"/\d+$", "/{id}", path)))
    assert len(routes) == 6, f"Missing frontend routes in simulation traffic: {routes}"
    print(f"Contract OK: {checked} successful exchanges across {len(routes)} API routes.")


if __name__ == "__main__":
    main()
