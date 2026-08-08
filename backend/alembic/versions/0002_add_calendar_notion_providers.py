"""Add GOOGLE_CALENDAR and NOTION to integration_provider.

ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so both
statements run in an autocommit block. Postgres provides no way to remove
enum values without recreating the type, so downgrade() is intentionally
unsupported rather than silently doing the wrong thing.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-08

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE integration_provider ADD VALUE 'GOOGLE_CALENDAR'")
        op.execute("ALTER TYPE integration_provider ADD VALUE 'NOTION'")


def downgrade() -> None:
    raise NotImplementedError(
        "Removing values from integration_provider requires recreating the type; not supported."
    )
