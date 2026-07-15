import pytest
from app.models.supplier import Supplier
from app.models.product import Product


@pytest.fixture
def supplier(client, auth_headers):
    res = client.post("/suppliers", json={
        "name": "Test Supplier",
        "contact_email": "test@supplier.com",
        "lead_time_days": 7,
    }, headers=auth_headers)
    return res.json()


def test_create_supplier_success(client, auth_headers):
    res = client.post("/suppliers", json={
        "name": "Acme Supplies",
        "contact_email": "orders@acme.com",
        "lead_time_days": 5,
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Acme Supplies"
    assert data["contact_email"] == "orders@acme.com"
    assert data["lead_time_days"] == 5


def test_create_supplier_duplicate_name(client, auth_headers, supplier):
    res = client.post("/suppliers", json={
        "name": "Test Supplier",
        "contact_email": "other@supplier.com",
        "lead_time_days": 3,
    }, headers=auth_headers)
    assert res.status_code == 409


def test_create_supplier_invalid_email(client, auth_headers):
    res = client.post("/suppliers", json={
        "name": "Bad Supplier",
        "contact_email": "notanemail",
        "lead_time_days": 7,
    }, headers=auth_headers)
    assert res.status_code == 422


def test_create_supplier_unauthenticated(client):
    res = client.post("/suppliers", json={
        "name": "Test",
        "contact_email": "test@test.com",
        "lead_time_days": 7,
    })
    assert res.status_code == 403


def test_create_supplier_as_staff(client, staff_headers):
    res = client.post("/suppliers", json={
        "name": "Staff Supplier",
        "contact_email": "staff@supplier.com",
        "lead_time_days": 7,
    }, headers=staff_headers)
    assert res.status_code == 201


def test_list_suppliers(client, auth_headers, supplier):
    res = client.get("/suppliers", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1


def test_list_suppliers_search(client, auth_headers, supplier):
    res = client.get("/suppliers?search=Test", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    res = client.get("/suppliers?search=nonexistent", headers=auth_headers)
    assert res.json()["total"] == 0


def test_get_supplier(client, auth_headers, supplier):
    res = client.get(f"/suppliers/{supplier['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == supplier["id"]


def test_get_supplier_not_found(client, auth_headers):
    res = client.get("/suppliers/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert res.status_code == 404


def test_update_supplier(client, auth_headers, supplier):
    res = client.put(f"/suppliers/{supplier['id']}", json={
        "name": "Updated Supplier",
        "lead_time_days": 3,
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Updated Supplier"
    assert data["lead_time_days"] == 3


def test_delete_supplier_no_products(client, auth_headers, supplier):
    res = client.delete(f"/suppliers/{supplier['id']}", headers=auth_headers)
    assert res.status_code == 204


def test_delete_supplier_with_products(client, auth_headers, supplier, db):
    # link a product to the supplier
    product = Product(
        name="Linked Product",
        sku="LNK-001",
        quantity=10,
        threshold=5,
        supplier_id=supplier["id"],
    )
    db.add(product)
    db.commit()

    res = client.delete(f"/suppliers/{supplier['id']}", headers=auth_headers)
    assert res.status_code == 400


def test_delete_supplier_as_staff(client, staff_headers, supplier):
    res = client.delete(f"/suppliers/{supplier['id']}", headers=staff_headers)
    assert res.status_code == 403