import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User

# use a separate test database
TEST_DATABASE_URL = "postgresql://postgres:postgres@db:5432/inventory_test"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Clean all tables before each test."""
    yield
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()


@pytest.fixture
def admin_user(db):
    user = User(
        email="admin@test.com",
        hashed_password=hash_password("password123"),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def staff_user(db):
    user = User(
        email="staff@test.com",
        hashed_password=hash_password("password123"),
        role="warehouse_staff",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    res = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "password123",
    })
    return res.json()["access_token"]


@pytest.fixture
def staff_token(client, staff_user):
    res = client.post("/auth/login", json={
        "email": "staff@test.com",
        "password": "password123",
    })
    return res.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}