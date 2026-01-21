"""add mime_type and purpose to file_metadata

Revision ID: 2a43b262c321
Revises: 8af75a24f233
Create Date: 2026-01-22 02:38:07.036281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a43b262c321'
down_revision: Union[str, None] = '8af75a24f233'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("file_metadata", sa.Column("mime_type", sa.String(), nullable=True))
    op.add_column("file_metadata", sa.Column("purpose", sa.String(), nullable=True))





def downgrade() -> None:
   op.drop_column("file_metadata", "purpose")
   op.drop_column("file_metadata", "mime_type")