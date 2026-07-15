import pytest
from app.models.product import Product
from app.models.delivery import Delivery


@pytest.fixture
def seeded_data(db):
    """Create a small dataset for dashboard assertions."""
    # healthy product
    p1 = Product(name="Product A", sku="TST-001", quantity=100, threshold=20)
    # low stock product
    p2 = Product(name="Product B", sku="TST-002", quantity=10, threshold=20)
    # critical product
    p3 = Product(name="Product C", sku="TST-003", quantity=0, threshold=20)
    db.add_all([p1, p2, p3])
    db.flush()

    # pending delivery
    d1 = Delivery(product_id=p1.id, quantity=50, status="processing")
    # in transit delivery
    d2 = Delivery(product_id=p2.id, quantity=30, status="in_transit")
    # delayed delivery
    d3 = Delivery(product_id=p3.id, quantity=20, status="delayed")
    # delivered
    d4 = Delivery(product_id=p1.id, quantity=10, status="delivered")
    db.add_all([d1, d2, d3, d4])
    db.commit()
    return {"products": [p1, p2, p3], "deliveries": [d1, d2, d3, d4]}


def test_summary_unauthenticated(client):
    res = client.get("/dashboard/summary")
    assert res.status_code == 403


def test_summary_counts(client, auth_headers, seeded_data):
    res = client.get("/dashboard/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_products"] == 3
    assert data["low_stock_count"] == 1      # p2 quantity <= threshold
    assert data["critical_stock_count"] == 1  # p3 quantity == 0
    assert data["pending_deliveries"] == 2    # processing + in_transit
    assert data["delayed_deliveries"] == 1
    assert data["anomalies_flagged"] == 0


def test_analytics_unauthenticated(client):
    res = client.get("/dashboard/analytics")
    assert res.status_code == 403


def test_analytics_structure(client, auth_headers, seeded_data):
    res = client.get("/dashboard/analytics", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert "category_stock" in data
    assert "low_stock_products" in data
    assert "delivery_status_counts" in data
    assert "movement_trend" in data


def test_analytics_delivery_status_counts(client, auth_headers, seeded_data):
    res = client.get("/dashboard/analytics", headers=auth_headers)
    data = res.json()

    status_counts = {d["status"]: d["count"] for d in data["delivery_status_counts"]}
    assert status_counts.get("processing") == 1
    assert status_counts.get("in_transit") == 1
    assert status_counts.get("delayed") == 1
    assert status_counts.get("delivered") == 1


def test_analytics_low_stock_products(client, auth_headers, seeded_data):
    res = client.get("/dashboard/analytics", headers=auth_headers)
    data = res.json()

    # should include p2 and p3 (both at or below threshold)
    low_stock_names = [p["name"] for p in data["low_stock_products"]]
    assert "Product B" in low_stock_names
    assert "Product C" in low_stock_names
    assert "Product A" not in low_stock_names