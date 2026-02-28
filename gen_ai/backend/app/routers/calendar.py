# app/routers/calendar.py
import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Union, Any

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.calendar_service import (
    get_auth_url,
    exchange_code_for_tokens,
    build_calendar_service,
    sync_workout_plan_to_calendar,
    sync_meal_plan_to_calendar,
    delete_arogyamitra_events,
)

router = APIRouter(prefix="/api/calendar", tags=["Google Calendar"])

# In-memory token store (use DB in production)
_token_store: Dict[Union[int, str], Dict[str, Any]] = {}


# ─── Request Models ───────────────────────────────────────────
class SyncWorkoutRequest(BaseModel):
    workout_plan:    Dict[str, Any]
    start_date:      str            # "YYYY-MM-DD"
    preferred_time:  Optional[str] = "06:00"   # "HH:MM"

class SyncMealRequest(BaseModel):
    nutrition_plan:  Dict[str, Any]
    start_date:      str            # "YYYY-MM-DD"

class DeleteEventsRequest(BaseModel):
    days_ahead: Optional[int] = 30


# ─── Helper: get stored tokens ───────────────────────────────
def _get_tokens(user: User) -> Dict[str, Any]:
    if not user.calendar_token:
        raise HTTPException(
            status_code=401,
            detail="Google Calendar not connected. Visit GET /api/calendar/connect first."
        )
    return json.loads(user.calendar_token)


# ─── 1. Connect Google Calendar ──────────────────────────────
# GET /api/calendar/connect
@router.get("/connect")
async def connect_google_calendar(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Step 1: Get the Google OAuth2 URL for the user to authorize calendar access.
    Frontend opens this URL in a browser or popup.
    """
    try:
        auth_url = get_auth_url(current_user.id)
        return {
            "auth_url": auth_url,
            "message":  "Open this URL in your browser to connect Google Calendar",
            "instructions": "After approving, you will be redirected back automatically.",
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. OAuth Callback ───────────────────────────────────────
# GET /api/calendar/callback?code=...
@router.get("/callback")
async def google_calendar_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Step 2: Google redirects here after user approves calendar access.
    Exchanges the auth code for tokens and stores them.
    """
    code = request.query_params.get("code")
    state = request.query_params.get("state") # This is user_id string
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code missing from callback")

    try:
        tokens = exchange_code_for_tokens(code)
        
        # Now we know WHICH user it is from state
        user_id = int(state) if state else None
        if user_id:
            db_user = db.query(User).filter(User.id == user_id).first()
            if db_user:
                db_user.calendar_token = json.dumps(tokens)
                db.commit()
                print(f"✅ Google Calendar tokens persistent for user {state}")
        
        # Also keep in-memory as backup/legacy if needed, but DB is primary now
        _token_store[f"pending_{state}"] = tokens

        # Redirect to frontend success page
        cors_env = os.getenv("CORS_ORIGINS", '["http://localhost:5173"]')
        try:
            urls = json.loads(cors_env)
            base_url = urls[0] if urls else "http://localhost:5173"
        except:
            base_url = "http://localhost:5173"

        redirect_url = f"{base_url}/dashboard?calendar=connected&user_id={state}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print(f"❌ Calendar callback error: {e}")
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


# ─── 3. Save Tokens for User ─────────────────────────────────
# POST /api/calendar/save-tokens
@router.post("/save-tokens")
async def save_calendar_tokens(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Step 3: After OAuth callback, link the pending tokens to the logged-in user.
    Call this from the frontend after redirect back from Google.
    """
    user_key = f"pending_{current_user.id}"
    tokens = _token_store.get(user_key)
    if not tokens:
        # Fallback to just "pending" if state was lost
        tokens = _token_store.get("pending")
        
    if not tokens:
        raise HTTPException(status_code=400, detail="No pending Google Calendar tokens found. Please connect again.")

    _token_store[current_user.id] = tokens
    _token_store.pop(user_key, None)
    _token_store.pop("pending", None)

    return {
        "status":  "success",
        "message": f"✅ Google Calendar connected for {current_user.full_name}",
    }


# ─── 4. Check Connection Status ──────────────────────────────
# GET /api/calendar/status
@router.get("/status")
async def calendar_status(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Check if the current user has connected Google Calendar."""
    connected = bool(current_user.calendar_token)
    return {
        "connected": connected,
        "user":      current_user.full_name,
        "message":   "Google Calendar is connected ✅" if connected else "Not connected yet.",
    }


# ─── 5. Sync Workout Plan ─────────────────────────────────────
# POST /api/calendar/sync-workout
@router.post("/sync-workout")
async def sync_workout(
    request: SyncWorkoutRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Sync a 7-day workout plan to the user's Google Calendar.
    Creates one event per workout day with exercise details and reminders.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)

    result = sync_workout_plan_to_calendar(
        service=service,
        workout_plan=request.workout_plan,
        start_date=request.start_date,
        preferred_time=request.preferred_time or "06:00",
    )

    return {
        "status":  "success",
        "message": f"✅ {result['created']} workout events added to your Google Calendar!",
        "details": result,
    }


# ─── 6. Sync Meal Plan ────────────────────────────────────────
# POST /api/calendar/sync-meals
@router.post("/sync-meals")
async def sync_meals(
    request: SyncMealRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Sync 7-day meal reminders to the user's Google Calendar.
    Creates breakfast, lunch, and dinner reminder events each day.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)

    result = sync_meal_plan_to_calendar(
        service=service,
        nutrition_plan=request.nutrition_plan,
        start_date=request.start_date,
    )

    return {
        "status":  "success",
        "message": f"✅ {result['created']} meal reminders added to your Google Calendar!",
        "details": result,
    }


# ─── 7. Sync Both (Full Plan) ────────────────────────────────
# POST /api/calendar/sync-full-plan
class FullPlanRequest(BaseModel):
    workout_plan:    Dict[str, Any]
    nutrition_plan:  Dict[str, Any]
    start_date:      str
    preferred_time:  Optional[str] = "06:00"

@router.post("/sync-full-plan")
async def sync_full_plan(
    request: FullPlanRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Sync both workout and meal plans to Google Calendar in one call.
    Called after health assessment when user generates their full plan.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)

    workout_result = sync_workout_plan_to_calendar(
        service=service,
        workout_plan=request.workout_plan,
        start_date=request.start_date,
        preferred_time=request.preferred_time or "06:00",
    )

    meal_result = sync_meal_plan_to_calendar(
        service=service,
        nutrition_plan=request.nutrition_plan,
        start_date=request.start_date,
    )

    total = workout_result["created"] + meal_result["created"]

    return {
        "status":  "success",
        "message": f"✅ {total} events added to your Google Calendar!",
        "workouts_synced": workout_result["created"],
        "meals_synced":    meal_result["created"],
    }


# ─── 8. Delete ArogyaMitra Events ────────────────────────────
# POST /api/calendar/clear
@router.post("/clear")
async def clear_calendar_events(
    request: DeleteEventsRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Delete all ArogyaMitra calendar events for the next N days.
    Called when user regenerates their plan.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)

    result = delete_arogyamitra_events(service, days_ahead=request.days_ahead or 30)

    return {
        "status":  "success",
        "message": f"🗑️ {result['deleted']} ArogyaMitra events removed from your calendar.",
    }


# ─── 9. Disconnect Calendar ──────────────────────────────────
# DELETE /api/calendar/disconnect
@router.delete("/disconnect")
async def disconnect_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Remove the stored Google Calendar tokens for this user."""
    if current_user.calendar_token:
        current_user.calendar_token = ""
        db.commit()
        return {"status": "success", "message": "Google Calendar disconnected."}
    return {"status": "info", "message": "Calendar was not connected."}
