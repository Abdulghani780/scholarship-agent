"""Application settings — driven by environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    scholarship_llm: str = "gemini/gemini-2.0-flash"
    database_url: str = "data/app.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    app_env: str = "development"


settings = Settings()
