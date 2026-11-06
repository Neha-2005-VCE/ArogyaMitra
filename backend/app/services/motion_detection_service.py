"""
Motion Detection & Form Analysis Service
Provides AI-powered exercise tracking, rep counting, and form analysis
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from groq import Groq

class MotionDetectionService:
    """
    AI-powered motion detection and form analysis service
    Uses Groq AI for analyzing exercise form and providing feedback
    """
    
    def __init__(self):
        self.groq_client = None
        self.initialize_ai()
        
        # Exercise-specific rep counting patterns
        self.rep_patterns = {
            "push_ups": {"key_points": ["elbow_angle", "body_alignment"], "threshold": 90},
            "squats": {"key_points": ["knee_angle", "hip_depth"], "threshold": 90},
            "plank": {"key_points": ["body_alignment", "hip_position"], "threshold": 180},
            "lunges": {"key_points": ["knee_angle", "balance"], "threshold": 90},
            "burpees": {"key_points": ["full_extension", "ground_contact"], "threshold": 180}
        }
        
        # Activity confidence thresholds
        self.confidence_thresholds = {
            "high": 0.8,
            "medium": 0.5,
            "low": 0.3
        }
    
    def initialize_ai(self):
        """Initialize Groq AI client for form analysis"""
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            self.groq_client = Groq(api_key=api_key)
            print("[OK] Motion Detection AI initialized")
        else:
            print("[WARN] No Groq API key - using fallback motion detection")
    
    async def analyze_exercise_form(
        self,
        exercise_name: str,
        frame_data: Optional[Dict] = None,
        pose_landmarks: Optional[List] = None
    ) -> Dict:
        """
        Analyze exercise form using AI
        
        Args:
            exercise_name: Name of the exercise
            frame_data: Video frame metadata
            pose_landmarks: Detected pose keypoints (if available)
        
        Returns:
            Form analysis with feedback and corrections
        """
        
        if not self.groq_client:
            return self._fallback_form_analysis(exercise_name)
        
        try:
            # Create prompt for AI analysis
            prompt = f"""
Analyze the form for {exercise_name} exercise.

Exercise: {exercise_name}
Frame Data: {json.dumps(frame_data) if frame_data else "Not available"}
Pose Landmarks: {json.dumps(pose_landmarks) if pose_landmarks else "Not available"}

Provide a JSON response with:
1. form_score (0-100)
2. feedback (array of strings with corrections)
3. good_points (array of strings with what's done well)
4. risk_level (low/medium/high)
5. suggestions (array of improvement tips)

Return ONLY valid JSON.
"""
            
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an expert fitness coach analyzing exercise form. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = response.choices[0].message.content
            
            # Try to parse JSON
            try:
                analysis = json.loads(result)
            except:
                # Extract JSON from response
                start = result.find("{")
                end = result.rfind("}") + 1
                if start != -1 and end > start:
                    analysis = json.loads(result[start:end])
                else:
                    return self._fallback_form_analysis(exercise_name)
            
            return {
                "exercise": exercise_name,
                "timestamp": datetime.utcnow().isoformat(),
                "form_score": analysis.get("form_score", 75),
                "feedback": analysis.get("feedback", []),
                "good_points": analysis.get("good_points", []),
                "risk_level": analysis.get("risk_level", "low"),
                "suggestions": analysis.get("suggestions", []),
                "ai_powered": True
            }
            
        except Exception as e:
            print(f"Form analysis error: {e}")
            return self._fallback_form_analysis(exercise_name)
    
    def _fallback_form_analysis(self, exercise_name: str) -> Dict:
        """Fallback form analysis when AI is unavailable"""
        
        common_feedback = {
            "push_ups": {
                "feedback": ["Keep your body straight", "Lower chest to ground", "Full arm extension"],
                "good_points": ["Good starting position"],
                "suggestions": ["Focus on controlled movement", "Breathe steadily"]
            },
            "squats": {
                "feedback": ["Keep knees behind toes", "Lower hips to knee level", "Keep back straight"],
                "good_points": ["Good stance width"],
                "suggestions": ["Push through heels", "Keep chest up"]
            },
            "plank": {
                "feedback": ["Keep body in straight line", "Don't let hips sag", "Engage core"],
                "good_points": ["Good elbow position"],
                "suggestions": ["Focus on breathing", "Maintain tension"]
            }
        }
        
        exercise_key = exercise_name.lower().replace(" ", "_")
        feedback_data = common_feedback.get(exercise_key, {
            "feedback": ["Maintain proper form", "Control your movement"],
            "good_points": ["Keep going!"],
            "suggestions": ["Focus on technique"]
        })
        
        return {
            "exercise": exercise_name,
            "timestamp": datetime.utcnow().isoformat(),
            "form_score": 75,
            "feedback": feedback_data["feedback"],
            "good_points": feedback_data["good_points"],
            "risk_level": "low",
            "suggestions": feedback_data["suggestions"],
            "ai_powered": False
        }
    
    def detect_activity(
        self,
        motion_intensity: float,
        camera_active: bool = True
    ) -> Dict:
        """
        Detect if user is actively exercising
        
        Args:
            motion_intensity: Movement intensity (0.0 - 1.0)
            camera_active: Whether camera is active
        
        Returns:
            Activity detection result
        """
        
        if not camera_active:
            return {
                "is_active": False,
                "confidence": 0.0,
                "status": "camera_inactive",
                "message": "Camera is not active"
            }
        
        # Determine activity level
        if motion_intensity >= self.confidence_thresholds["high"]:
            status = "active"
            confidence = motion_intensity
            message = "High activity detected"
        elif motion_intensity >= self.confidence_thresholds["medium"]:
            status = "moderate"
            confidence = motion_intensity
            message = "Moderate activity detected"
        elif motion_intensity >= self.confidence_thresholds["low"]:
            status = "low"
            confidence = motion_intensity
            message = "Low activity detected"
        else:
            status = "idle"
            confidence = motion_intensity
            message = "No significant activity"
        
        return {
            "is_active": motion_intensity >= self.confidence_thresholds["medium"],
            "confidence": round(confidence, 2),
            "status": status,
            "message": message,
            "motion_intensity": round(motion_intensity, 2),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def count_reps(
        self,
        exercise_name: str,
        current_angle: Optional[float] = None,
        movement_phase: str = "down"
    ) -> Dict:
        """
        Count exercise repetitions based on movement patterns
        
        Args:
            exercise_name: Name of the exercise
            current_angle: Current joint angle (if available)
            movement_phase: Current phase of movement (up/down)
        
        Returns:
            Rep counting data
        """
        
        exercise_key = exercise_name.lower().replace(" ", "_")
        pattern = self.rep_patterns.get(exercise_key, {
            "key_points": ["movement"],
            "threshold": 90
        })
        
        # Simulate rep detection logic
        rep_detected = False
        if current_angle is not None:
            threshold = pattern["threshold"]
            if movement_phase == "down" and current_angle <= threshold:
                rep_detected = True
            elif movement_phase == "up" and current_angle >= threshold:
                rep_detected = True
        
        return {
            "exercise": exercise_name,
            "rep_detected": rep_detected,
            "current_angle": current_angle,
            "movement_phase": movement_phase,
            "threshold": pattern["threshold"],
            "key_points": pattern["key_points"],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def calculate_calories_burned(
        self,
        exercise_name: str,
        duration_seconds: int,
        intensity: float = 0.7,
        user_weight_kg: float = 70
    ) -> float:
        """
        Calculate calories burned during exercise
        
        Args:
            exercise_name: Name of the exercise
            duration_seconds: Duration in seconds
            intensity: Exercise intensity (0.0 - 1.0)
            user_weight_kg: User's weight in kg
        
        Returns:
            Estimated calories burned
        """
        
        # MET (Metabolic Equivalent) values for exercises
        met_values = {
            "push_ups": 8.0,
            "squats": 5.5,
            "plank": 4.0,
            "lunges": 6.0,
            "burpees": 10.0,
            "jumping_jacks": 8.0,
            "mountain_climbers": 9.0,
            "sit_ups": 5.0,
            "default": 6.0
        }
        
        exercise_key = exercise_name.lower().replace(" ", "_")
        met = met_values.get(exercise_key, met_values["default"])
        
        # Adjust MET by intensity
        adjusted_met = met * intensity
        
        # Calories = MET × weight(kg) × time(hours)
        duration_hours = duration_seconds / 3600
        calories = adjusted_met * user_weight_kg * duration_hours
        
        return round(calories, 2)
    
    def get_exercise_coaching_tips(self, exercise_name: str, current_rep: int) -> Dict:
        """
        Get real-time coaching tips during exercise
        
        Args:
            exercise_name: Name of the exercise
            current_rep: Current repetition number
        
        Returns:
            Coaching tips and motivation
        """
        
        tips_by_phase = {
            "early": [
                "Focus on your form",
                "Breathe steadily",
                "Control your movement",
                "Keep your core engaged"
            ],
            "middle": [
                "You're doing great!",
                "Maintain that form",
                "Keep pushing!",
                "Stay focused"
            ],
            "late": [
                "Almost there!",
                "Finish strong!",
                "Last few reps!",
                "You've got this!"
            ]
        }
        
        # Determine phase based on rep count
        if current_rep <= 4:
            phase = "early"
        elif current_rep <= 8:
            phase = "middle"
        else:
            phase = "late"
        
        import random
        tip = random.choice(tips_by_phase[phase])
        
        return {
            "exercise": exercise_name,
            "current_rep": current_rep,
            "phase": phase,
            "tip": tip,
            "motivation_level": "high" if phase == "late" else "medium",
            "timestamp": datetime.utcnow().isoformat()
        }


# Singleton instance
motion_detection_service = MotionDetectionService()
