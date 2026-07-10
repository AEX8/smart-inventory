from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard as svc
from app.schemas.dashboard import DashboardSummary, AnalyticsData

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_summary(db)

@router.get("/analytics", response_model=AnalyticsData)
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_analytics(db)