from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.services.calendar_service import calendar_service
from app.routers.auth import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

@router.get("/google/authorize")
async def authorize_google(current_user: User = Depends(get_current_user)):
    """Step 1: Returns the Google OAuth URL for the user to authorize calendar access."""
    return {"url": calendar_service.get_auth_url(current_user.id)}

@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Step 2: Exchange the authorization code for tokens and save to database."""
    try:
        # Exchange code for tokens
        tokens = calendar_service.get_tokens_from_code(code)
        
        # Get user_id from state parameter (CSRF protection)
        user_id = int(state)
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Save tokens to database
        user.google_calendar_token = tokens.get("access_token")
        user.google_calendar_refresh_token = tokens.get("refresh_token")
        if tokens.get("expiry"):
            user.google_calendar_expiry = datetime.fromisoformat(tokens["expiry"])
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Calendar synced successfully for user {user.username}",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync calendar: {str(e)}")

@router.post("/calendar/sync-workout")
async def sync_workout_to_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Step 3: Sync today's workout to Google Calendar."""
    if not current_user.google_calendar_token:
        raise HTTPException(status_code=400, detail="Calendar not connected. Please authorize first.")
    
    # Get today's workout
    from app.models.user import WorkoutPlan
    import json
    from datetime import date
    
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan found")
    
    plan_data = json.loads(plan.plan_data)
    days = plan_data.get("days", [])
    day_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    today_name = day_names[date.today().weekday()]
    
    today_workout = None
    for day in days:
        if day.get("day", "").lower() == today_name.lower():
            today_workout = day
            break
    
    if not today_workout:
        raise HTTPException(status_code=404, detail="No workout scheduled for today")
    
    # Sync to calendar
    user_creds = {
        "access_token": current_user.google_calendar_token,
        "refresh_token": current_user.google_calendar_refresh_token
    }
    
    event_link = await calendar_service.sync_workout_to_calendar(user_creds, today_workout)
    
    if event_link:
        return {"success": True, "message": "Workout synced to calendar", "event_link": event_link}
    else:
        raise HTTPException(status_code=500, detail="Failed to create calendar event")

@router.get("/calendar/status")
async def calendar_status(current_user: User = Depends(get_current_user)):
    """Check if user has connected their Google Calendar."""
    return {
        "connected": bool(current_user.google_calendar_token),
        "has_refresh_token": bool(current_user.google_calendar_refresh_token)
    }