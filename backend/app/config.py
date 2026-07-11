"""
Central application configuration.

All environment-dependent values are read here, once, via pydantic-settings.
Nothing else in the codebase should call os.environ directly.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/hiresense"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # AI
    gemini_api_key: str = "replace-with-your-gemini-api-key"
    gemini_model: str = "gemini-2.5-flash"

    # App
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def ai_is_mocked(self) -> bool:
        """True whenever no real Gemini key has been configured yet."""
        return not self.gemini_api_key or self.gemini_api_key.startswith("replace-with")


@lru_cache
def get_settings() -> Settings:
    return Settings()
