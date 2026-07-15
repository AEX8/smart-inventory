from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, inventory, deliveries, dashboard, suppliers, forecast
 
app = FastAPI(
    title="Smart Inventory & Delivery Tracker",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(deliveries.router, prefix="/deliveries", tags=["deliveries"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
 
@app.get("/health")
def health_check():
    return {"status": "ok"}
 