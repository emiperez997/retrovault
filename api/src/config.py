from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    cors_origins: list[str] = ["http://localhost:4200"]

    # Fase 1: Usuario hardcodeado (Se reemplaza por auth en fase 5)
    dev_user_email: str = "emi@retrovault.dev"


@lru_cache
def get_settings() -> Settings:
    return Settings()
