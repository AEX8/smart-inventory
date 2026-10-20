"""
Generate 30 days of realistic stock movements for existing products.

Works backwards from each product's current quantity, so today's stock levels
stay exactly as they are and the movement history still adds up to them.

Run from inside the container:
  docker compose exec backend python scripts/simulate_activity.py
  docker compose exec backend python scripts/simulate_activity.py --force   # run again anyway
"""

import os
import random
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User

DAYS = 30


def timestamp(day: datetime) -> datetime:
    # trading hours, 7am to 8pm
    return day.replace(hour=random.randint(7, 19), minute=random.randint(0, 59), second=0, microsecond=0)


def main() -> None:
    db = SessionLocal()
    now = datetime.utcnow()
    since = now - timedelta(days=DAYS)

    recent = db.query(StockMovement).filter(StockMovement.created_at >= since).count()
    if recent > 100 and "--force" not in sys.argv:
        print(f"{recent} movements already in the last {DAYS} days, skipping. Use --force to add more.")
        return

    staff_ids = [u.id for u in db.query(User).filter(User.role.in_(["admin", "warehouse_staff"])).all()]
    products = db.query(Product).all()
    created = 0

    for product in products:
        threshold = max(product.threshold, 5)
        daily_use = max(1, threshold // 8)
        qty_end = product.quantity  # stock at the end of the day being simulated

        for offset in range(DAYS):
            day = now - timedelta(days=offset)
            weekend = day.weekday() >= 5
            events: list[tuple[int, str]] = []

            # sales, busier on weekends
            if random.random() < 0.75:
                sold = random.randint(1, daily_use * (3 if weekend else 2))
                events.append((-sold, "sold"))

            # occasional breakage
            if random.random() < 0.06:
                events.append((-random.randint(1, 3), "damaged"))

            # restock roughly weekly, never more than what keeps the earlier stock at or above zero
            if random.random() < 0.15:
                reduced = -sum(d for d, _ in events)
                restock = min(random.randint(threshold, threshold * 2), qty_end + reduced)
                if restock > 0:
                    events.append((restock, "restock"))

            for delta, reason in events:
                db.add(StockMovement(
                    product_id=product.id,
                    delta=delta,
                    reason=reason,
                    created_by=random.choice(staff_ids) if staff_ids else None,
                    created_at=timestamp(day) if offset else min(timestamp(day), now),
                ))
                created += 1

            # step back to the previous day's closing stock
            qty_end -= sum(d for d, _ in events)

    db.commit()
    db.close()
    print(f"Created {created} stock movements across {len(products)} products.")


if __name__ == "__main__":
    main()
