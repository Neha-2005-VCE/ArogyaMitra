# app/routers/calendar.py
import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

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
_token_store: dict[int, dict] = {}


# ─── Request Models ───────────────────────────────────────────

class SyncWorkoutRequest(BaseModel):
    workout_plan:    dict
    start_date:      str            # "YYYY-MM-DD"
    preferred_time:  Optional[str] = "06:00"   # "HH:MM"


class SyncMealRequest(BaseModel):
    nutrition_plan:  dict
    start_date:      str            # "YYYY-MM-DD"


class DeleteEventsRequest(BaseModel):
    days_ahead: Optional[int] = 30


# ─── Helper: get stored tokens ───────────────────────────────

def _get_tokens(current_user: User) -> dict:
    if current_user.google_calendar_token:
        try:
            return json.loads(current_user.google_calendar_token)
        except Exception:
            pass
    tokens = _token_store.get(current_user.id)
    if not tokens:
        raise HTTPException(
            status_code=401,
            detail="Google Calendar not connected. Visit GET /api/calendar/connect first."
        )
    return tokens


# ─── 1. Connect Google Calendar ──────────────────────────────
# GET /api/calendar/connect

@router.get("/connect")
async def connect_google_calendar(
    current_user: User = Depends(get_current_user),
):
    """
    Step 1: Get the Google OAuth2 URL for the user to authorize calendar access.
    Passes current_user.id in state for direct user linking on redirect.
    """
    try:
        auth_url = get_auth_url(state=str(current_user.id))
        return {
            "url": auth_url,
            "auth_url": auth_url,
            "message":  "Open this URL in your browser to connect Google Calendar",
            "instructions": "After approving, you will be redirected back automatically.",
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. OAuth Callback ───────────────────────────────────────
# GET /api/calendar/callback?code=...&state=...

@router.get("/callback")
async def google_calendar_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Step 2: Google redirects here after user approves calendar access.
    Exchanges the auth code for tokens and persists them for the user.
    """
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code:
        raise HTTPException(
            status_code=400, 
            detail="Authorization code missing from callback"
        )
    
    try:
        tokens = exchange_code_for_tokens(code)
        
        # If user ID was passed in state, persist directly to user in DB
        if state and state.isdigit():
            user_id = int(state)
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.google_calendar_token = json.dumps(tokens)
                user.google_calendar_refresh_token = tokens.get("refresh_token")
                db.commit()
                _token_store[user_id] = tokens
                print(f"✅ Google Calendar tokens saved directly to user {user.username} (ID: {user_id})")

        _token_store["pending"] = tokens
        print("✅ Google Calendar tokens obtained")
        
        # Redirect to frontend dashboard with success query param
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        redirect_url = f"{frontend_url}/dashboard?calendar=connected"
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        print(f"❌ Calendar callback error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"OAuth callback failed: {str(e)}"
        )


# ─── 3. Save Tokens for User ─────────────────────────────────
# POST /api/calendar/save-tokens

@router.post("/save-tokens")
async def save_calendar_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Step 3: After OAuth callback, link the pending tokens to the logged-in user.
    """
    pending = _token_store.get("pending")
    if not pending:
        raise HTTPException(
            status_code=400, 
            detail="No pending Google Calendar tokens found"
        )
    
    _token_store[current_user.id] = pending
    current_user.google_calendar_token = json.dumps(pending)
    current_user.google_calendar_refresh_token = pending.get("refresh_token")
    db.commit()
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
):
    """Check if the current user has connected Google Calendar."""
    connected = bool(current_user.google_calendar_token or current_user.id in _token_store)
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
):
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
):
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
    workout_plan:    dict
    nutrition_plan:  dict
    start_date:      str
    preferred_time:  Optional[str] = "06:00"


@router.post("/sync-full-plan")
async def sync_full_plan(
    request: FullPlanRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Sync both workout and meal plans to Google Calendar in one call.
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


# ─── 8. Sync Today's Schedule ────────────────────────────────
# POST /api/calendar/sync-today

@router.post("/sync-today")
async def sync_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sync today's active workout & meals to Google Calendar automatically.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)
    from app.models.user import WorkoutPlan, NutritionPlan
    from datetime import date
    
    today_str = date.today().isoformat()
    total_created = 0

    # 1. Sync Workout Plan (active or fallback)
    wp = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == True).order_by(WorkoutPlan.created_at.desc()).first()
    wp_data = None
    if wp and wp.plan_data:
        try:
            wp_data = json.loads(wp.plan_data)
        except Exception:
            wp_data = None

    if not wp_data:
        try:
            from app.routers.workouts import get_fallback_plan
            wp_data = get_fallback_plan()
        except Exception as e:
            print(f"[ERR] Fallback workout error: {e}")

    if wp_data:
        try:
            res = sync_workout_plan_to_calendar(service, wp_data, today_str, preferred_time="07:00")
            total_created += res.get("created", 0)
        except Exception as e:
            print(f"[ERR] Workout calendar sync error: {e}")

    # 2. Sync Nutrition Plan (active or goal-based fallback)
    np = db.query(NutritionPlan).filter(NutritionPlan.user_id == current_user.id, NutritionPlan.is_active == True).order_by(NutritionPlan.created_at.desc()).first()
    np_data = None
    if np and np.plan_data:
        try:
            np_data = json.loads(np.plan_data)
        except Exception:
            np_data = None

    if not np_data:
        try:
            from app.services.goal_meal_plans import get_goal_based_meal_plan
            goal = getattr(current_user.fitness_goal, "value", str(current_user.fitness_goal or "balance"))
            np_data = get_goal_based_meal_plan(goal or "balance", calorie_target=2000, diet_type="vegetarian")
        except Exception as e:
            print(f"[ERR] Fallback nutrition error: {e}")

    if np_data:
        try:
            res = sync_meal_plan_to_calendar(service, np_data, today_str)
            total_created += res.get("created", 0)
        except Exception as e:
            print(f"[ERR] Nutrition calendar sync error: {e}")

    return {
        "status": "success",
        "message": f"✅ {total_created} events scheduled in Google Calendar!",
        "created": total_created,
    }


# ─── 9. Delete ArogyaMitra Events ────────────────────────────
# POST /api/calendar/clear

@router.post("/clear")
async def clear_calendar_events(
    request: DeleteEventsRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Delete all ArogyaMitra calendar events for the next N days.
    """
    tokens  = _get_tokens(current_user)
    service = build_calendar_service(tokens)
    
    result = delete_arogyamitra_events(service, days_ahead=request.days_ahead or 30)
    
    return {
        "status":  "success",
        "message": f"🗑️ {result['deleted']} ArogyaMitra events removed from your calendar.",
    }


# ─── 10. Disconnect Calendar ──────────────────────────────────
# DELETE /api/calendar/disconnect

@router.delete("/disconnect")
async def disconnect_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the stored Google Calendar tokens for this user."""
    _token_store.pop(current_user.id, None)
    current_user.google_calendar_token = None
    current_user.google_calendar_refresh_token = None
    current_user.google_calendar_expiry = None
    db.commit()
    return {"status": "success", "message": "Google Calendar disconnected."}


# ─── 10. Test Configuration ──────────────────────────────────
# GET /api/calendar/test

@router.get("/test")
def test_calendar_config():
    """
    Test if Google Calendar credentials are configured.
    No authentication required - just checks environment variables.
    """
    client_id = os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI")
    
    return {
        "configured": bool(client_id and client_secret and redirect_uri),
        "client_id_present": bool(client_id),
        "client_secret_present": bool(client_secret),
        "redirect_uri": redirect_uri or "Not configured",
        "message": "Google Calendar is ready" if (client_id and client_secret) else "Please configure Google Calendar credentials in .env"
    }
