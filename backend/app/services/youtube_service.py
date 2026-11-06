import os
import httpx
from typing import Dict

class YouTubeService:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.cache = {}

    async def search_exercise_video(self, exercise_name: str) -> Dict:
        if exercise_name in self.cache:
            return self.cache[exercise_name]

        if not self.api_key:
            return self.fallback_video(exercise_name)

        try:
            params = {
                "part": "snippet",
                "q": f"{exercise_name} proper form tutorial",
                "type": "video",
                "maxResults": 1,
                "key": self.api_key
            }
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/search", params=params)
                data = response.json()
                
                if not data.get('items'):
                    return self.fallback_video(exercise_name)
                
                item = data['items'][0]
                video_id = item['id']['videoId']
                snippet = item.get('snippet', {})
                
                result = {
                    "video_id": video_id,
                    "embed_url": f"https://www.youtube.com/embed/{video_id}?autoplay=0&rel=0&modestbranding=1",
                    "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                    "title": snippet.get('title', exercise_name),
                    "thumbnail": snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                    "channel": snippet.get('channelTitle', ''),
                    "description": snippet.get('description', '')[:200]  # First 200 chars
                }
                self.cache[exercise_name] = result
                return result
        except Exception as e:
            print(f"YouTube API error for '{exercise_name}': {e}")
            return self.fallback_video(exercise_name)

    def fallback_video(self, exercise_name: str):
        """Fallback video when API fails or quota exceeded"""
        # Generic fitness video ID
        fallback_id = "2pLT-aSC22s"
        return {
            "video_id": fallback_id,
            "embed_url": f"https://www.youtube.com/embed/{fallback_id}?autoplay=0&rel=0&modestbranding=1",
            "watch_url": f"https://www.youtube.com/results?search_query={exercise_name.replace(' ', '+')}",
            "title": f"{exercise_name} - Exercise Tutorial",
            "thumbnail": f"https://img.youtube.com/vi/{fallback_id}/hqdefault.jpg",
            "channel": "Fitness Tutorial",
            "description": f"Learn proper form for {exercise_name}",
            "is_fallback": True
        }

youtube_service = YouTubeService()