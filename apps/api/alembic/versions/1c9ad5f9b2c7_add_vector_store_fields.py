"""Add vector store fields

Revision ID: 1c9ad5f9b2c7
Revises: 8af75a24f233
Create Date: 2026-01-18 11:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c9ad5f9b2c7'
down_revision: Union[str, None] = '8af75a24f233'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('vector_store_id', sa.String(), nullable=True))
    op.add_column('file_metadata', sa.Column('vector_store_file_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('file_metadata', 'vector_store_file_id')
    op.drop_column('projects', 'vector_store_id')
