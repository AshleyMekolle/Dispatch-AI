"""Application configuration with fail-fast environment validation.

Why pydantic-settings instead of ``os.getenv`` scattered through the codebase:

* Every knob the app accepts is declared **in one place**, typed, and documented.
* Invalid configuration (bad URL, missing secret in production) crashes the
  process at startup with a precise error, instead of failing at 3 a.m. deep
  inside a request handler.
* Tests can construct ``Settings(...)`` directly and inject it, so no test
  ever depends on the developer's shell environment.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "test", "production"]

# Marker value so we can distinguish "developer never set a secret" from a
# deliberately configured one. Never acceptable outside development/test.
_INSECURE_DEFAULT_SECRET = "insecure-dev-secret-change-me"

# A real (but published, hence insecure) Fernet key so `docker compose up` works
# with zero setup in development. Generate a real one with:
#   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
_INSECURE_DEFAULT_ENCRYPTION_KEY = "8FGZyZ3h7izzCOVjpzIKT1Mf5MeDK2_5UszUT5J-TXQ="


class Settings(BaseSettings):
    """All runtime configuration for the Dispatch API, sourced from the environment.

    Environment variables are prefixed with ``DISPATCH_`` (e.g. ``DISPATCH_DATABASE_URL``)
    so they can never collide with variables owned by other tools on the host.
    """

    model_config = SettingsConfigDict(
        env_prefix="DISPATCH_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Runtime identity -------------------------------------------------
    app_name: str = "Dispatch API"
    environment: Environment = "development"
    debug: bool = False
    version: str = "0.1.0"

    # --- Persistence ------------------------------------------------------
    database_url: str = Field(
        default="postgresql+asyncpg://dispatch:dispatch@localhost:5432/dispatch",
        description="SQLAlchemy async connection URL.",
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL (cache, rate limiting, job broker).",
    )

    # --- Security ---------------------------------------------------------
    secret_key: str = Field(
        default=_INSECURE_DEFAULT_SECRET,
        description="HMAC signing key for JWTs. MUST be overridden in production.",
    )
    access_token_ttl_seconds: int = 60 * 15
    refresh_token_ttl_seconds: int = 60 * 60 * 24 * 14
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Origins allowed to call the API from a browser.",
    )

    # --- Field-level credential encryption ---------------------------------
    # Ordered newest-first. Encryption always uses the first key; decryption
    # tries each in turn, which is what makes key rotation possible: prepend
    # a new key, redeploy, and old ciphertext still decrypts. See
    # app/core/crypto.py and docs/adr/0008-encrypted-credentials.md.
    encryption_keys: list[str] = Field(
        default=[_INSECURE_DEFAULT_ENCRYPTION_KEY],
        description="Fernet keys for encrypting OAuth credentials at rest, newest first.",
    )

    # --- Observability ----------------------------------------------------
    log_level: str = "INFO"
    log_json: bool | None = Field(
        default=None,
        description="Force JSON logs. Defaults to True in production, False elsewhere.",
    )

    @model_validator(mode="after")
    def _forbid_insecure_production(self) -> Self:
        """Fail fast if production is booted with a development secret.

        This is the single most valuable validation in the file: it converts a
        silent security hole into an immediate, obvious crash.
        """
        if self.environment == "production" and self.secret_key == _INSECURE_DEFAULT_SECRET:
            raise ValueError(
                "DISPATCH_SECRET_KEY must be set to a strong random value in production."
            )
        insecure_key_in_use = _INSECURE_DEFAULT_ENCRYPTION_KEY in self.encryption_keys
        if self.environment == "production" and insecure_key_in_use:
            raise ValueError(
                "DISPATCH_ENCRYPTION_KEYS must not contain the published development key "
                "in production — every OAuth credential encrypted with it is compromised."
            )
        return self

    @property
    def logs_as_json(self) -> bool:
        if self.log_json is not None:
            return self.log_json
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide Settings instance.

    ``lru_cache`` gives us a lazily-constructed singleton that FastAPI can
    still override per-test via ``app.dependency_overrides`` — unlike a
    module-level constant, which would be evaluated at import time and be
    impossible to swap out cleanly.
    """
    return Settings()
