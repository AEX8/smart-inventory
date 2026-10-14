"""add product image_url

Revision ID: 5225bd4b5fc9
Revises: fcd347c7599c
Create Date: 2026-10-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5225bd4b5fc9'
down_revision: Union[str, None] = 'fcd347c7599c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'image_url')
