"""
Seed script — populates the database with realistic inventory data.
Run from inside the container:
  docker compose exec backend python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.delivery import Delivery
from app.core.security import hash_password
from datetime import datetime, timedelta
import random

db = SessionLocal()

print("Seeding database...")

# users
print("Creating users...")

admin = User(email="admin1@test.com", hashed_password=hash_password("password123"), role="admin")
staff = User(email="staff1@test.com", hashed_password=hash_password("password123"), role="warehouse_staff")
driver = User(email="driver1@test.com", hashed_password=hash_password("password123"), role="driver")

db.add_all([admin, staff, driver])
db.flush()

# suppliers
print("Creating suppliers...")

suppliers_data = [
    {"name": "Acme Industrial", "contact_email": "orders@acme.com", "lead_time_days": 5},
    {"name": "Bevande", "contact_email": "supply@bevande.com.au", "lead_time_days": 7},
    {"name": "Steelite", "contact_email": "info@steelite.com.au", "lead_time_days": 3},
    {"name": "Robert Gordon", "contact_email": "sales@rgcomp.com", "lead_time_days": 14},
    {"name": "Ken Hands", "contact_email": "warehouse@kh.com.au", "lead_time_days": 1},
]

suppliers = []
for s in suppliers_data:
    supplier = Supplier(**s)
    db.add(supplier)
    suppliers.append(supplier)

db.flush()

# products
print("Creating products...")


products_data = [
    # Crockery — Robert Gordon & Steelite
    {"name": "Dinner Plate 27cm White", "sku": "CRK-001", "category": "Crockery", "quantity": 240, "threshold": 60, "supplier": suppliers[3]},
    {"name": "Side Plate 18cm White", "sku": "CRK-002", "category": "Crockery", "quantity": 180, "threshold": 50, "supplier": suppliers[3]},
    {"name": "Pasta Bowl 28cm", "sku": "CRK-003", "category": "Crockery", "quantity": 8, "threshold": 40, "supplier": suppliers[2]},
    {"name": "Soup Bowl 16cm", "sku": "CRK-004", "category": "Crockery", "quantity": 0, "threshold": 40, "supplier": suppliers[2]},
    {"name": "Share Plate 35cm Slate", "sku": "CRK-005", "category": "Crockery", "quantity": 45, "threshold": 20, "supplier": suppliers[3]},

    # Cups & Saucers — Acme & Bevande
    {"name": "Espresso Cup 90ml", "sku": "CUP-001", "category": "Cups & Saucers", "quantity": 320, "threshold": 80, "supplier": suppliers[1]},
    {"name": "Espresso Saucer", "sku": "CUP-002", "category": "Cups & Saucers", "quantity": 18, "threshold": 80, "supplier": suppliers[1]},
    {"name": "Cappuccino Cup 220ml", "sku": "CUP-003", "category": "Cups & Saucers", "quantity": 12, "threshold": 60, "supplier": suppliers[0]},
    {"name": "Cappuccino Saucer", "sku": "CUP-004", "category": "Cups & Saucers", "quantity": 190, "threshold": 60, "supplier": suppliers[0]},
    {"name": "Latte Glass 320ml", "sku": "CUP-005", "category": "Cups & Saucers", "quantity": 5, "threshold": 50, "supplier": suppliers[1]},

    # Hospitality Equipment — Ken Hands
    {"name": "Chafing Dish Full Size", "sku": "EQP-001", "category": "Equipment", "quantity": 310, "threshold": 10, "supplier": suppliers[4]},
    {"name": "Serving Tray 40cm GN", "sku": "EQP-002", "category": "Equipment", "quantity": 43, "threshold": 15, "supplier": suppliers[4]},
    {"name": "Bain Marie 1/3 Pan", "sku": "EQP-003", "category": "Equipment", "quantity": 7, "threshold": 8, "supplier": suppliers[4]},
    {"name": "Cutlery Caddy Stainless", "sku": "EQP-004", "category": "Equipment", "quantity": 0, "threshold": 10, "supplier": suppliers[4]},
    {"name": "Menu Holder A4 Black", "sku": "EQP-005", "category": "Equipment", "quantity": 56, "threshold": 20, "supplier": suppliers[4]},
    {"name": "Salt & Pepper Set", "sku": "EQP-006", "category": "Equipment", "quantity": 29, "threshold": 12, "supplier": suppliers[4]},
]


products = []
for p_data in products_data:
    supplier = p_data.pop("supplier")
    product = Product(**p_data, supplier_id=supplier.id)
    db.add(product)
    products.append(product)

db.flush()

# stock movements
print("Creating stock movements...")

reasons = ["restock", "sold", "damaged", "returned", "audit_correction"]

for product in products:
    # initial stock movement
    if product.quantity > 0:
        db.add(StockMovement(
            product_id=product.id,
            delta=product.quantity,
            reason="restock",
            created_by=admin.id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 60)),
        ))

    # simulate 5-10 historical movements per product
    for _ in range(random.randint(5, 10)):
        reason = random.choice(reasons)
        delta = random.randint(1, 30) if reason in ("restock", "returned") else -random.randint(1, 20)
        db.add(StockMovement(
            product_id=product.id,
            delta=delta,
            reason=reason,
            created_by=random.choice([admin.id, staff.id]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 29)),
        ))

# deliveries
print("Creating deliveries...")

delivery_scenarios = [
    {"product": products[2],  "quantity": 100, "status": "in_transit",  "eta_days": 2},
    {"product": products[3],  "quantity": 20,  "status": "processing",  "eta_days": 7},
    {"product": products[6],  "quantity": 50,  "status": "in_transit",  "eta_days": 1},
    {"product": products[10], "quantity": 80,  "status": "delayed",     "eta_days": 5},
    {"product": products[13], "quantity": 15,  "status": "processing",  "eta_days": 3},
    {"product": products[7],  "quantity": 30,  "status": "delivered",   "eta_days": -2},
    {"product": products[11], "quantity": 60,  "status": "delivered",   "eta_days": -5},
    {"product": products[0],  "quantity": 50,  "status": "cancelled",   "eta_days": 4},
]

for scenario in delivery_scenarios:
    product = scenario["product"]
    db.add(Delivery(
        product_id=product.id,
        quantity=scenario["quantity"],
        status=scenario["status"],
        eta=datetime.utcnow() + timedelta(days=scenario["eta_days"]),
        created_by=staff.id,
        created_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
    ))

db.commit()
print("\nDone! Seeded:")
print(f"  {3} users (admin1@test.com, staff1@test.com, driver1@test.com)")
print(f"  {len(suppliers_data)} suppliers")
print(f"  {len(products_data)} products across 4 categories")
print(f"  {len(delivery_scenarios)} deliveries in various states")
print("\nAll passwords: password123")