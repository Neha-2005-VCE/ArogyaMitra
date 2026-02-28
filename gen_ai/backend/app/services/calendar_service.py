# app/services/calendar_service.py
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import List, Dict, Any, Optional

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


def get_auth_url(user_id: int) -> str:
    """Generate Google OAuth2 authorization URL for user to visit."""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("GOOGLE_CALENDAR_CLIENT_ID or CLIENT_SECRET not set in .env")
    flow = get_oauth_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=str(user_id), # Track user ID in state
    )
    return auth_url


def exchange_code_for_tokens(code: str) -> dict:
    """
    Exchange OAuth authorization code for access + refresh tokens.
    Called after user approves calendar access.
    """
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
    """Build authenticated Google Calendar API service from stored tokens."""
    creds = Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id", CLIENT_ID),
        client_secret=token_data.get("client_secret", CLIENT_SECRET),
        scopes=token_data.get("scopes", SCOPES),
    )
    return build("calendar", "v3", credentials=creds)


# ─── Create Single Workout Event ─────────────────────────────
def create_workout_event(
    service,
    title: str,
    description: str,
    date: str,           # "YYYY-MM-DD"
    start_time: str,     # "06:00"
    duration_minutes: int = 45,
    color_id: str = "9",
    reminders: list[int] | None = None,
) -> dict:
    """
    Create a single workout event in Google Calendar.
    Returns the created event dict.
    """
    if reminders is None:
        reminders = [10, 30]   # remind 10 min and 30 min before

    start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
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
            "overrides": [
                {"method": "popup",  "minutes": m} for m in reminders
            ],
        },
    }

    try:
        created = service.events().insert(calendarId="primary", body=event).execute()
        print(f"✅ Calendar event created: {title} on {date}")
        return {"success": True, "event_id": created["id"], "event_link": created.get("htmlLink", "")}
    except HttpError as e:
        print(f"❌ Calendar event creation error: {e}")
        return {"success": False, "error": str(e)}


# ─── Sync Full 7-Day Workout Plan ────────────────────────────
def sync_workout_plan_to_calendar(
    service,
    workout_plan: dict,
    start_date: str,      # "YYYY-MM-DD" — first day of the plan
    preferred_time: str = "06:00",
) -> dict:
    """
    Sync an entire 7-day workout plan to Google Calendar.
    Creates one event per workout day, skips rest days.
    Handles both AI-generated ("days") and legacy ("weekly_schedule") plan formats.
    """
    created_events = []
    failed_events  = []

    # Handle both plan formats from AI agent
    weekly_schedule = workout_plan.get("days", workout_plan.get("weekly_schedule", workout_plan.get("weekly_plan", [])))
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    for i, day_plan in enumerate(weekly_schedule):
        day_name  = day_plan.get("day", f"Day {i+1}")
        focus     = day_plan.get("focus_area", day_plan.get("focus", "Workout"))
        duration  = day_plan.get("duration_minutes", 45)
        exercises = day_plan.get("exercises", [])
        warmup    = day_plan.get("warmup", "")
        cool_down = day_plan.get("cool_down", "")
        tips      = day_plan.get("daily_tip", day_plan.get("tips", ""))
        is_rest   = day_plan.get("rest_day", False)

        # Skip rest days
        if is_rest or focus.lower() in ("rest", "rest day") or not exercises:
            print(f"⏭️  Skipping rest day: {day_name}")
            continue

        # Calculate actual calendar date
        event_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")

        # Build rich description with exercise details
        exercise_list = "\n".join([
            f"• {ex.get('name', '')} — {ex.get('sets', '')} sets × {ex.get('reps', '')} reps"
            + (f" (rest {ex.get('rest_seconds', '')}s)" if ex.get('rest_seconds') else "")
            + (f"\n  💬 {ex.get('coaching_cue', ex.get('description', ''))}" if ex.get('coaching_cue') or ex.get('description') else "")
            for ex in exercises
        ])
        description = (
            f"🏋️ ArogyaMitra Workout — {focus}\n\n"
            f"⏱ Duration: {duration} minutes\n\n"
            f"🔥 Warm-up: {warmup}\n\n"
            f"💪 Exercises:\n{exercise_list}\n\n"
            + (f"🧊 Cool-down: {cool_down}\n\n" if cool_down else "")
            + (f"💡 Tip: {tips}\n\n" if tips else "")
            + f"Generated by ArogyaMitra - Your AI Fitness Companion"
        )

        # Pick color based on focus type
        focus_lower = focus.lower()
        if "cardio" in focus_lower:
            color = COLORS["cardio"]
        elif any(w in focus_lower for w in ("leg", "chest", "back", "shoulder", "arm", "bicep", "tricep")):
            color = COLORS["strength"]
        else:
            color = COLORS["workout"]

        result = create_workout_event(
            service=service,
            title=f"🏋️ {focus} — ArogyaMitra",
            description=description,
            date=event_date,
            start_time=preferred_time,
            duration_minutes=duration,
            color_id=color,
        )

        if result["success"]:
            created_events.append({"day": day_name, "date": event_date, "event_id": result["event_id"]})
        else:
            failed_events.append({"day": day_name, "error": result.get("error", "unknown")})

    print(f"✅ Calendar sync complete: {len(created_events)} events created, {len(failed_events)} failed")
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
    """
    Sync 7-day meal plan reminders to Google Calendar.
    Creates breakfast, lunch, and dinner reminders each day.
    Handles both AI-generated ("days" with breakfast/lunch/dinner keys) and legacy formats.
    """
    created_events = []
    base_date      = datetime.strptime(start_date, "%Y-%m-%d")

    meal_times = {
        "breakfast": "07:00",
        "lunch":     "12:30",
        "dinner":    "19:30",
        "snacks":    "16:00",
    }

    # Handle both plan formats
    weekly_plan = nutrition_plan.get("days", nutrition_plan.get("weekly_plan", []))

    for i, day_data in enumerate(weekly_plan):
        event_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        day_name   = day_data.get("day", f"Day {i+1}")

        # Try the AI-generated format: day_data has breakfast, lunch, dinner as direct keys
        for meal_key in ["breakfast", "lunch", "dinner"]:
            meal = day_data.get(meal_key)
            if not meal:
                continue

            meal_name    = meal.get("name", "Meal")
            calories     = meal.get("calories", "")
            protein      = meal.get("protein_g", meal.get("protein", ""))
            carbs        = meal.get("carbs_g", meal.get("carbs", ""))
            fat          = meal.get("fat_g", meal.get("fat", ""))
            ingredients  = meal.get("ingredients", [])
            meal_time    = meal.get("time", meal_times.get(meal_key, "12:00"))
            # Normalize time format — strip AM/PM and convert to 24h
            start_t      = _normalize_time(meal_time, meal_times.get(meal_key, "12:00"))

            # Build ingredient list
            ing_text = ""
            if ingredients:
                ing_list = ingredients if isinstance(ingredients, list) else [ingredients]
                ing_text = f"\n🛒 Ingredients: {', '.join(str(x) for x in ing_list)}\n"

            description = (
                f"🥗 ArogyaMitra Meal — {meal_key.title()}\n\n"
                f"🍽️ {meal_name}\n\n"
                f"📊 Nutrition:\n"
                f"  • Calories: {calories}\n"
                f"  • Protein:  {protein}g\n"
                f"  • Carbs:    {carbs}g\n"
                f"  • Fat:      {fat}g\n"
                f"{ing_text}\n"
                f"Generated by ArogyaMitra - Your AI Fitness Companion"
            )

            result = create_workout_event(
                service=service,
                title=f"🥗 {meal_key.title()}: {meal_name} — ArogyaMitra",
                description=description,
                date=event_date,
                start_time=start_t,
                duration_minutes=30,
                color_id=COLORS["nutrition"],
                reminders=[15],
            )

            if result["success"]:
                created_events.append({"date": event_date, "day": day_name, "meal": meal_key})

        # Also handle legacy format: day_data has "meals" array
        for meal in day_data.get("meals", []):
            meal_type = meal.get("meal_type", "Meal")
            meal_name = meal.get("name", "")
            calories  = meal.get("calories", "")
            protein   = meal.get("protein", "")
            carbs     = meal.get("carbs", "")
            fat       = meal.get("fat", "")
            start_t   = meal_times.get(meal_type.lower(), "12:00")

            description = (
                f"🥗 ArogyaMitra Meal — {meal_type}\n\n"
                f"🍽️ {meal_name}\n\n"
                f"📊 Nutrition:\n"
                f"  • Calories: {calories}\n"
                f"  • Protein:  {protein}\n"
                f"  • Carbs:    {carbs}\n"
                f"  • Fat:      {fat}\n\n"
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

            if result["success"]:
                created_events.append({"date": event_date, "meal": meal_type})

    print(f"✅ Meal calendar sync complete: {len(created_events)} meal reminders created")
    return {"created": len(created_events), "events": created_events}


def _normalize_time(time_str: str, fallback: str = "12:00") -> str:
    """Convert various time formats like '7:00 AM', '1:00 PM' to 24h 'HH:MM'."""
    if not time_str:
        return fallback
    time_str = time_str.strip()
    # Already 24h format
    if len(time_str) == 5 and ":" in time_str and time_str[:2].isdigit():
        return time_str
    try:
        for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M"):
            try:
                dt = datetime.strptime(time_str, fmt)
                return dt.strftime("%H:%M")
            except ValueError:
                continue
    except Exception:
        pass
    return fallback


# ─── Delete All ArogyaMitra Events ───────────────────────────
def delete_arogyamitra_events(service, days_ahead: int = 30) -> dict:
    """
    Delete all ArogyaMitra calendar events in the next N days.
    Used when user regenerates a plan.
    """
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

        print(f"✅ Deleted {deleted} ArogyaMitra calendar events")
        return {"deleted": deleted}
    except HttpError as e:
        print(f"❌ Delete events error: {e}")
        return {"deleted": 0, "error": str(e)}
