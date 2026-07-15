import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.forecast import ForecastOut, ForecastListOut
from app.services import forecast as svc

router = APIRouter()


@router.get("/reorder/{product_id}", response_model=ForecastOut)
def get_product_forecast(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_product_forecast(product_id, db)


@router.get("/all", response_model=ForecastListOut)
def get_all_forecasts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_all_forecasts(db)