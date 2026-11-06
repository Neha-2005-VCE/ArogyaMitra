# app/services/calendar_service.py
import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request

load_dotenv()

# ─── Config ──────────────────────────────────────────────────
CLIENT_ID       = os.getenv("GOOGLE_CALENDAR_CLIENT_ID", "")
CLIENT_SECRET   = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET", "")
REDIRECT_URI    = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "http://localhost:8000/api/calendar/callback")
SCOPES          = ["https://www.googleapis.com/auth/calendar"]

# Color IDs for Google Calendar events
COLORS = {
    "workout":   "9",   # Blueberry
    "nutrition": "5",   # Banana (yellow)
    "rest":      "2",   # Sage (green)
    "cardio":    "6",   # Tangerine
    "strength":  "1",   # Lavender
}

def parse_time_str(time_str: str) -> tuple[int, int]:
    """
    Safely parse various time formats into (hour, minute):
    Supports '08:30', '8:30', '7:30 AM', '12:30 PM', '7:30pm', etc.
    Defaults to (8, 30) if parsing fails.
    """
    if not time_str or not isinstance(time_str, str):
        return (8, 30)
    
    cleaned = time_str.strip().upper().replace(".", "")
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M", "%I %p", "%I%p"):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return (dt.hour, dt.minute)
        except ValueError:
            pass
    
    try:
        parts = cleaned.replace("AM", "").replace("PM", "").strip().split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        if "PM" in cleaned and h < 12:
            h += 12
        elif "AM" in cleaned and h == 12:
            h = 0
        return (h, m)
    except Exception:
        return (8, 30)


# ─── OAuth Flow ───────────────────────────────────────────────
def get_oauth_flow() -> Flow:
    """Create Google OAuth2 flow for Calendar authorization."""
    client_config = {
        "web": {
            "client_id":                CLIENT_ID,
            "client_secret":            CLIENT_SECRET,
            "redirect_uris":            [REDIRECT_URI],
            "auth_uri":                 "https://accounts.google.com/o/oauth2/auth",
            "token_uri":                "https://oauth2.googleapis.com/token",
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    return flow


def get_auth_url(state: str = None) -> str:
    """Generate Google OAuth2 authorization URL for user to visit."""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("GOOGLE_CALENDAR_CLIENT_ID or CLIENT_SECRET not set in .env")
    
    flow = get_oauth_flow()
    auth_kwargs = {
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
    }
    if state:
        auth_kwargs["state"] = str(state)
        
    auth_url, _ = flow.authorization_url(**auth_kwargs)
    return auth_url


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange OAuth authorization code for access + refresh tokens.
    Called after user approves calendar access."""
    flow = get_oauth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    return {
        "token":         creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri":     creds.token_uri,
        "client_id":     creds.client_id,
        "client_secret": creds.client_secret,
        "scopes":        list(creds.scopes or SCOPES),
    }


def build_calendar_service(token_data: dict):
    """Build authenticated Google Calendar API service from stored tokens with auto-refresh."""
    creds = Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id", CLIENT_ID),
        client_secret=token_data.get("client_secret", CLIENT_SECRET),
        scopes=token_data.get("scopes", SCOPES),
    )
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            print("[OK] Google Calendar token refreshed successfully")
        except Exception as e:
            print(f"[WARN] Calendar token auto-refresh warning: {e}")

    return build("calendar", "v3", credentials=creds)


# ─── Create Single Workout / Meal Event ───────────────────────
def create_workout_event(
    service,
    title: str,
    description: str,
    date: str,           # "YYYY-MM-DD"
    start_time: str,     # "06:00" or "8:30 AM"
    duration_minutes: int = 45,
    color_id: str = "9",
    reminders: list[int] | None = None,
) -> dict:
    """Create a single workout or meal event in Google Calendar.
    Returns the created event dict."""
    if reminders is None:
        reminders = [10, 30]
    
    try:
        base_d = datetime.strptime(date, "%Y-%m-%d")
        h, m = parse_time_str(start_time)
        start_dt = base_d.replace(hour=h, minute=m, second=0, microsecond=0)
        end_dt   = start_dt + timedelta(minutes=duration_minutes)
        
        event = {
            "summary":     title,
            "description": description,
            "colorId":     color_id,
            "start": {
                "dateTime": start_dt.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "reminders": {
                "useDefault": False,
                "overrides": [{"method": "popup", "minutes": rem} for rem in reminders],
            },
        }
        
        created = service.events().insert(calendarId="primary", body=event).execute()
        print(f"[OK] Calendar event created: {title} on {date}")
        return {
            "success": True, 
            "event_id": created["id"], 
            "event_link": created.get("htmlLink", "")
        }
    except Exception as e:
        print(f"[ERR] Calendar event creation error: {e}")
        return {"success": False, "error": str(e)}


# ─── Sync Full 7-Day Workout Plan ────────────────────────────
def sync_workout_plan_to_calendar(
    service,
    workout_plan: dict,
    start_date: str,      # "YYYY-MM-DD" — first day of the plan
    preferred_time: str = "06:00",
) -> dict:
    """Sync an entire 7-day workout plan to Google Calendar.
    Creates one event per workout day, skips rest days.
    Returns summary of created events."""
    created_events = []
    failed_events  = []
    
    weekly_schedule = workout_plan.get("days") or workout_plan.get("weekly_schedule") or workout_plan.get("week") or []
    if isinstance(weekly_schedule, dict):
        weekly_schedule = list(weekly_schedule.values())

    base_date = datetime.strptime(start_date, "%Y-%m-%d")
    
    for i, day_plan in enumerate(weekly_schedule):
        if not isinstance(day_plan, dict):
            continue

        day_name  = day_plan.get("day", f"Day {i+1}")
        focus     = day_plan.get("focus_area") or day_plan.get("focus") or "Workout"
        duration  = day_plan.get("duration_minutes", 45)
        exercises = day_plan.get("exercises", [])
        warmup    = day_plan.get("warmup", "")
        tips      = day_plan.get("tips") or day_plan.get("daily_tip", "")
        
        # Skip rest days
        if day_plan.get("rest_day") is True or "rest" in str(focus).lower() or not exercises:
            print(f"[INFO] Skipping rest day: {day_name}")
            continue
        
        event_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        
        exercise_list = "\n".join([
            f"• {ex.get('name', '')} — {ex.get('sets', '')} sets × {ex.get('reps', '')} reps"
            for ex in exercises if isinstance(ex, dict)
        ])
        
        description = (
            f"🏋️ ArogyaMitra Workout — {focus}\n\n"
            f"⏱ Duration: {duration} minutes\n\n"
            f"🔥 Warm-up: {warmup}\n\n"
            f"💪 Exercises:\n{exercise_list}\n\n"
            f"💡 Tip: {tips}\n\n"
            f"Generated by ArogyaMitra - Your AI Fitness Companion"
        )
        
        color = COLORS.get(
            "cardio"   if "cardio" in str(focus).lower()   else
            "strength" if "strength" in str(focus).lower() else
            "workout",
            "9"
        )
        
        result = create_workout_event(
            service=service,
            title=f"🏋️ {focus} — ArogyaMitra",
            description=description,
            date=event_date,
            start_time=preferred_time,
            duration_minutes=duration,
            color_id=color,
        )
        
        if result.get("success"):
            created_events.append({
                "day": day_name, 
                "date": event_date, 
                "event_id": result.get("event_id")
            })
        else:
            failed_events.append({
                "day": day_name, 
                "error": result.get("error", "unknown")
            })
    
    print(f"[OK] Calendar sync complete: {len(created_events)} events created, {len(failed_events)} failed")
    
    return {
        "created": len(created_events),
        "failed":  len(failed_events),
        "events":  created_events,
        "errors":  failed_events,
    }


# ─── Sync Meal Plan to Calendar ──────────────────────────────
def sync_meal_plan_to_calendar(
    service,
    nutrition_plan: dict,
    start_date: str,
) -> dict:
    """Sync 7-day meal plan reminders to Google Calendar.
    Creates breakfast, lunch, and dinner reminders each day."""
    created_events = []
    base_date      = datetime.strptime(start_date, "%Y-%m-%d")
    
    meal_times = {
        "breakfast": "08:30",
        "lunch":     "13:00",
        "dinner":    "20:00",
        "snacks":    "16:30",
        "Breakfast": "08:30",
        "Lunch":     "12:30",
        "Dinner":    "19:30",
        "Snack":     "16:00",
    }
    
    days_list = []
    if isinstance(nutrition_plan, dict):
        days_list = nutrition_plan.get("days") or nutrition_plan.get("weekly_plan") or []
        if not days_list and isinstance(nutrition_plan.get("week"), dict):
            days_list = list(nutrition_plan["week"].values())
        elif not days_list and any(k in nutrition_plan for k in ["breakfast", "lunch", "dinner", "snacks"]):
            days_list = [nutrition_plan]
    elif isinstance(nutrition_plan, list):
        days_list = nutrition_plan
    
    for i, day_data in enumerate(days_list):
        event_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        meals = []
        if isinstance(day_data, dict):
            if "meals" in day_data and isinstance(day_data["meals"], list):
                meals = day_data["meals"]
            else:
                for m_key in ["breakfast", "lunch", "snacks", "dinner"]:
                    m_val = day_data.get(m_key)
                    if m_val:
                        if isinstance(m_val, list):
                            for sub in m_val:
                                if isinstance(sub, dict):
                                    meals.append({**sub, "meal_type": m_key.capitalize()})
                                elif isinstance(sub, str):
                                    meals.append({"name": sub, "meal_type": m_key.capitalize()})
                        elif isinstance(m_val, dict):
                            meals.append({**m_val, "meal_type": m_key.capitalize()})
                        elif isinstance(m_val, str):
                            meals.append({"name": m_val, "meal_type": m_key.capitalize()})
        
        for meal in meals:
            meal_type = meal.get("meal_type", "Meal")
            meal_name = meal.get("name") or meal.get("meal_name", "Balanced Indian Meal")
            calories  = meal.get("calories", "")
            protein   = meal.get("protein_g") or meal.get("protein", "")
            carbs     = meal.get("carbs_g") or meal.get("carbs", "")
            fat       = meal.get("fat_g") or meal.get("fat", "")
            start_t   = meal.get("time") or meal_times.get(meal_type.lower()) or meal_times.get(meal_type, "12:30")
            
            description = (
                f"🥗 ArogyaMitra Meal — {meal_type}\n\n"
                f"🍽️ {meal_name}\n\n"
                f"📊 Nutrition:\n"
                f"  • Calories: {calories}\n"
                f"  • Protein:  {protein}g\n"
                f"  • Carbs:    {carbs}g\n"
                f"  • Fat:      {fat}g\n\n"
                f"Generated by ArogyaMitra - Your AI Fitness Companion"
            )
            
            result = create_workout_event(
                service=service,
                title=f"🥗 {meal_type}: {meal_name} — ArogyaMitra",
                description=description,
                date=event_date,
                start_time=start_t,
                duration_minutes=30,
                color_id=COLORS["nutrition"],
                reminders=[15],
            )
            
            if result.get("success"):
                created_events.append({"date": event_date, "meal": meal_type})
    
    print(f"[OK] Meal calendar sync complete: {len(created_events)} meal reminders created")
    
    return {"created": len(created_events), "events": created_events}


# ─── Delete All ArogyaMitra Events ───────────────────────────
def delete_arogyamitra_events(service, days_ahead: int = 30) -> dict:
    """Delete all ArogyaMitra calendar events in the next N days.
    Used when user regenerates a plan."""
    deleted = 0
    now     = datetime.utcnow().isoformat() + "Z"
    end     = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + "Z"
    
    try:
        events_result = service.events().list(
            calendarId="primary",
            timeMin=now,
            timeMax=end,
            q="ArogyaMitra",
            singleEvents=True,
        ).execute()
        
        for event in events_result.get("items", []):
            service.events().delete(calendarId="primary", eventId=event["id"]).execute()
            deleted += 1
        
        print(f"[OK] Deleted {deleted} ArogyaMitra calendar events")
        return {"deleted": deleted}
    
    except Exception as e:
        print(f"[ERR] Delete events error: {e}")
        return {"deleted": 0, "error": str(e)}


# ─── Singleton instance for backward compatibility ────────────
class CalendarService:
    """Legacy class wrapper for backward compatibility."""
    
    def get_auth_url(self, user_id: int = None) -> str:
        return get_auth_url()
    
    def get_tokens_from_code(self, code: str) -> dict:
        return exchange_code_for_tokens(code)
    
    def _get_calendar_client(self, user_creds_dict: dict):
        return build_calendar_service(user_creds_dict)
    
    async def sync_workout_to_calendar(self, user_creds: dict, workout_day: dict):
        try:
            service = build_calendar_service(user_creds)
            exercises = workout_day.get("exercises", [])
            ex_list = "\n".join([
                f"• {ex.get('name', '')} ({ex.get('sets', '')}x{ex.get('reps', '')})" 
                for ex in exercises if isinstance(ex, dict)
            ])
            
            start_time = datetime.utcnow().replace(hour=7, minute=0, second=0).isoformat() + "Z"
            end_time = datetime.utcnow().replace(hour=8, minute=0, second=0).isoformat() + "Z"

            event = {
                "summary": f"💪 ArogyaMitra: {workout_day.get('focus_area', 'Workout')}",
                "description": f"Today's Focus: {workout_day.get('focus_area')}\n\nExercises:\n{ex_list}",
                "start": {"dateTime": start_time, "timeZone": "UTC"},
                "end": {"dateTime": end_time, "timeZone": "UTC"},
                "colorId": "10",
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup", "minutes": 15},
                    ],
                },
            }

            event_result = service.events().insert(calendarId="primary", body=event).execute()
            return event_result.get("htmlLink")
        except Exception as e:
            print(f"[ERR] Calendar Sync Error: {e}")
            return None


calendar_service = CalendarService()
