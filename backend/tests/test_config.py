"""Configuration validation tests — the fail-fast guarantees we rely on."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_defaults_are_development_safe() -> None:
    s = Settings(_env_file=None)
    assert s.environment == "development"
    assert s.logs_as_json is False


def test_production_rejects_default_secret() -> None:
    with pytest.raises(ValidationError, match="DISPATCH_SECRET_KEY"):
        Settings(environment="production", _env_file=None)


def test_production_accepts_explicit_secret_and_logs_json() -> None:
    s = Settings(
        environment="production",
        secret_key="a-real-secret-from-the-vault",
        _env_file=None,
    )
    assert s.logs_as_json is True


def test_unknown_environment_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="staging", _env_file=None)  # type: ignore[arg-type]
