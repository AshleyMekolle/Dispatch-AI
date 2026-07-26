"""Reusable column type helpers shared across models.

Centralizing these means every JSON or enum column is declared identically —
a reviewer only has to trust this file once, instead of re-checking dialect
handling on every model.
"""

from __future__ import annotations

import enum

from sqlalchemy import JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB

# Real JSONB on Postgres (indexable, binary-stored); plain JSON everywhere else
# (SQLite, used by the fast unit-test suite) so the same model works unmodified
# against both.
JSONVariant = JSON().with_variant(JSONB(), "postgresql")


def pg_enum[E: enum.Enum](python_enum: type[E], name: str) -> SAEnum:
    """Native Postgres ``ENUM`` with a fixed type name (required for Alembic to
    manage it as a first-class type), falling back to ``VARCHAR`` + ``CHECK``
    on dialects without native enum support.
    """
    return SAEnum(python_enum, name=name, native_enum=True, validate_strings=True)
