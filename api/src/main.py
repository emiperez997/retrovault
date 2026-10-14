from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.domain.catalog.router import router as catalog_router
from src.domain.collection.router import router as collection_router

app = FastAPI(title="RetroVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router)
app.include_router(collection_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
