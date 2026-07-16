import uuid
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    # positive = stock in (restock, return)
    # negative = stock out (sale, damaged, audit)

    reason: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    # restock | sold | damaged | returned | audit_correction

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    # relationships
    product: Mapped["Product"] = relationship(back_populates="stock_movements")
    created_by_user: Mapped["User | None"] = relationship(
        back_populates="stock_movements"
    )
