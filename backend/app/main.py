from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
 
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
 
from app.routers import auth
app.include_router(auth.router, prefix="/auth", tags=["auth"])
 
# Uncomment as they're built
# from app.routers import inventory, deliveries, forecast
# app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
# app.include_router(deliveries.router, prefix="/deliveries", tags=["deliveries"])
# app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
 
 
@app.get("/health")
def health_check():
    return {"status": "ok"}
 