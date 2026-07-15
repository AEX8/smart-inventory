import pytest
from app.models.supplier import Supplier


@pytest.fixture
def supplier(db):
    s = Supplier(name="Test Supplier", contact_email="test@supplier.com", lead_time_days=7)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def product(client, auth_headers, supplier):
    res = client.post("/inventory/products", json={
        "name": "Test Product",
        "sku": "TST-001",
        "category": "Equipment",
        "initial_stock": 100,
        "threshold": 20,
        "supplier_id": str(supplier.id),
    }, headers=auth_headers)
    return res.json()


def test_create_product_success(client, auth_headers, supplier):
    res = client.post("/inventory/products", json={
        "name": "Espresso Cup",
        "sku": "CUP-001",
        "initial_stock": 50,
        "threshold": 10,
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Espresso Cup"
    assert data["sku"] == "CUP-001"
    assert data["quantity"] == 50
    assert data["threshold"] == 10


def test_create_product_duplicate_sku(client, auth_headers, product):
    res = client.post("/inventory/products", json={
        "name": "Another Product",
        "sku": "TST-001",
        "initial_stock": 10,
        "threshold": 5,
    }, headers=auth_headers)
    assert res.status_code == 409


def test_create_product_unauthenticated(client):
    res = client.post("/inventory/products", json={
        "name": "Test",
        "sku": "TST-002",
    })
    assert res.status_code == 403


def test_list_products(client, auth_headers, product):
    res = client.get("/inventory/products", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_list_products_search(client, auth_headers, product):
    res = client.get("/inventory/products?search=Test", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    res = client.get("/inventory/products?search=nonexistent", headers=auth_headers)
    assert res.json()["total"] == 0


def test_list_products_stock_filter(client, auth_headers, product):
    res = client.get("/inventory/products?stock_status=healthy", headers=auth_headers)
    assert res.status_code == 200


def test_get_product(client, auth_headers, product):
    res = client.get(f"/inventory/products/{product['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == product["id"]


def test_get_product_not_found(client, auth_headers):
    res = client.get("/inventory/products/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert res.status_code == 404


def test_update_product(client, auth_headers, product):
    res = client.put(f"/inventory/products/{product['id']}", json={
        "name": "Updated Product",
        "threshold": 30,
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Updated Product"
    assert data["threshold"] == 30


def test_adjust_stock_positive(client, auth_headers, product):
    res = client.post(f"/inventory/products/{product['id']}/adjust", json={
        "delta": 50,
        "reason": "restock",
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["quantity"] == 150


def test_adjust_stock_negative(client, auth_headers, product):
    res = client.post(f"/inventory/products/{product['id']}/adjust", json={
        "delta": -20,
        "reason": "sold",
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["quantity"] == 80


def test_adjust_stock_negative_guard(client, auth_headers, product):
    res = client.post(f"/inventory/products/{product['id']}/adjust", json={
        "delta": -999,
        "reason": "sold",
    }, headers=auth_headers)
    assert res.status_code == 400


def test_adjust_stock_zero_delta(client, auth_headers, product):
    res = client.post(f"/inventory/products/{product['id']}/adjust", json={
        "delta": 0,
        "reason": "sold",
    }, headers=auth_headers)
    assert res.status_code == 422


def test_get_movements(client, auth_headers, product):
    # adjust stock to create a movement
    client.post(f"/inventory/products/{product['id']}/adjust", json={
        "delta": 10,
        "reason": "restock",
    }, headers=auth_headers)
    res = client.get(f"/inventory/products/{product['id']}/movements", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_delete_product_as_admin(client, auth_headers, product):
    res = client.delete(f"/inventory/products/{product['id']}", headers=auth_headers)
    assert res.status_code == 204


def test_delete_product_as_staff(client, staff_headers, product):
    res = client.delete(f"/inventory/products/{product['id']}", headers=staff_headers)
    assert res.status_code == 403