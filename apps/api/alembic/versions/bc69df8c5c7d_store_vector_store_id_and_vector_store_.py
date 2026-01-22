"""Store vector store ID and vector store file ID

Revision ID: bc69df8c5c7d
Revises: 2a43b262c321
Create Date: 2026-01-22 04:14:59.345299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc69df8c5c7d'
down_revision: Union[str, None] = '2a43b262c321'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('vector_store_id', sa.String(), nullable=True))
    op.add_column('file_metadata', sa.Column('vector_store_file_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('file_metadata', 'vector_store_file_id')
    op.drop_column('projects', 'vector_store_id')