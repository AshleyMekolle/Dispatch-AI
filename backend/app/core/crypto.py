"""Field-level encryption for credentials at rest.

Why Fernet instead of hand-rolled AES-GCM: Fernet (AES-128-CBC + HMAC, from the
``cryptography`` package) is authenticated encryption with a deliberately narrow
API — callers cannot supply their own nonce/IV, which is exactly the mistake that
turns "we encrypt tokens" into a real vulnerability. ``MultiFernet`` takes an
ordered list of keys: it always encrypts with the first (newest) key and tries
each key in turn when decrypting, which is what makes key rotation possible
without a flag day — see docs/adr/0008-encrypted-credentials.md.

This module is the *only* place ciphertext is created or opened. Everything else
in the codebase — models, repositories, services, schemas — works with plaintext
strings; ``EncryptedString`` makes that transparent at the ORM boundary.
"""

from __future__ import annotations

from functools import lru_cache

from cryptography.fernet import Fernet, MultiFernet
from sqlalchemy import String
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator

from app.core.config import get_settings


class CredentialCipher:
    """Thin wrapper around ``MultiFernet`` — the only class that touches key material."""

    def __init__(self, keys: list[str]) -> None:
        if not keys:
            raise ValueError("CredentialCipher requires at least one encryption key.")
        self._fernet = MultiFernet([Fernet(key.encode()) for key in keys])

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self._fernet.decrypt(ciphertext.encode()).decode()


@lru_cache
def get_cipher() -> CredentialCipher:
    """Process-wide cipher, keyed off configured settings.

    ``lru_cache`` here mirrors ``get_settings``/``get_engine``: a lazily-built
    singleton so key material is parsed once per process, not once per column
    access.
    """
    return CredentialCipher(get_settings().encryption_keys)


class EncryptedString(TypeDecorator):
    """A ``String`` column that is transparently encrypted at rest.

    Model and repository code reads/writes plain strings; the database, a
    ``pg_dump``, or a raw ``SELECT`` only ever sees ciphertext. This is the
    structural half of "never expose decrypted values outside the integration
    layer" — the other half is that response schemas simply omit these fields.
    """

    impl = String
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return get_cipher().encrypt(value)

    def process_result_value(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return get_cipher().decrypt(value)
