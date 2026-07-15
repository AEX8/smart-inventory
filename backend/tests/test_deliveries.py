import pytest
from app.models.product import Product


@pytest.fixture
def product(db):
    p = Product(
        name="Test Product",
        sku="TST-001",
        quantity=100,
        threshold=20,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def delivery(client, auth_headers, product):
    res = client.post("/deliveries", json={
        "product_id": str(product.id),
        "quantity": 50,
    }, headers=auth_headers)
    return res.json()


def test_create_delivery_success(client, auth_headers, product):
    res = client.post("/deliveries", json={
        "product_id": str(product.id),
        "quantity": 50,
        "notes": "Urgent order",
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["quantity"] == 50
    assert data["status"] == "processing"
    assert data["notes"] == "Urgent order"


def test_create_delivery_invalid_product(client, auth_headers):
    res = client.post("/deliveries", json={
        "product_id": "00000000-0000-0000-0000-000000000000",
        "quantity": 10,
    }, headers=auth_headers)
    assert res.status_code == 404


def test_create_delivery_zero_quantity(client, auth_headers, product):
    res = client.post("/deliveries", json={
        "product_id": str(product.id),
        "quantity": 0,
    }, headers=auth_headers)
    assert res.status_code == 422


def test_create_delivery_unauthenticated(client, product):
    res = client.post("/deliveries", json={
        "product_id": str(product.id),
        "quantity": 10,
    })
    assert res.status_code == 403


def test_list_deliveries(client, auth_headers, delivery):
    res = client.get("/deliveries", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1


def test_list_deliveries_status_filter(client, auth_headers, delivery):
    res = client.get("/deliveries?status=processing", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    res = client.get("/deliveries?status=delivered", headers=auth_headers)
    assert res.json()["total"] == 0


def test_get_delivery(client, auth_headers, delivery):
    res = client.get(f"/deliveries/{delivery['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == delivery["id"]


def test_get_delivery_not_found(client, auth_headers):
    res = client.get("/deliveries/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert res.status_code == 404


def test_status_transition_valid(client, auth_headers, delivery):
    res = client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "in_transit",
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "in_transit"


def test_status_transition_invalid(client, auth_headers, delivery):
    # cannot go from processing directly to delivered
    res = client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "delivered",
    }, headers=auth_headers)
    assert res.status_code == 400


def test_status_transition_terminal(client, auth_headers, delivery):
    # move to cancelled 
    client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "cancelled",
    }, headers=auth_headers)
    # try to move again
    res = client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "processing",
    }, headers=auth_headers)
    assert res.status_code == 400


def test_delivered_updates_stock(client, auth_headers, product, delivery):
    initial_stock = product.quantity

    # processing -> in_transit
    client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "in_transit",
    }, headers=auth_headers)

    # in_transit -> delivered
    client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "delivered",
    }, headers=auth_headers)

    # check stock increased
    res = client.get(f"/inventory/products/{product.id}", headers=auth_headers)
    assert res.json()["quantity"] == initial_stock + delivery["quantity"]


def test_delete_delivery_processing(client, auth_headers, delivery):
    res = client.delete(f"/deliveries/{delivery['id']}", headers=auth_headers)
    assert res.status_code == 204


def test_delete_delivery_in_transit(client, auth_headers, delivery):
    client.patch(f"/deliveries/{delivery['id']}/status", json={
        "status": "in_transit",
    }, headers=auth_headers)
    res = client.delete(f"/deliveries/{delivery['id']}", headers=auth_headers)
    assert res.status_code == 400


def test_delete_delivery_staff_forbidden(client, staff_headers, delivery):
    res = client.delete(f"/deliveries/{delivery['id']}", headers=staff_headers)
    assert res.status_code == 403