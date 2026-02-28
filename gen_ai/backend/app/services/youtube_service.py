import os
import httpx
from typing import Optional, List, Dict

class YouTubeService:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.search_url = "https://www.googleapis.com/youtube/v3/search"

    async def search_exercise_videos(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search for exercise tutorial videos."""
        if not self.api_key or self.api_key == "YOUTUBE_API_KEY":
            return [self._fallback_search(query)]

        params = {
            "part": "snippet",
            "q": f"{query} exercise form tutorial",
            "type": "video",
            "maxResults": max_results,
            "key": self.api_key,
            "videoDuration": "any",
            "relevanceLanguage": "en"
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(self.search_url, params=params)
                if response.status_code == 200:
                    items = response.json().get("items", [])
                    return [
                        {
                            "video_id": item["id"]["videoId"],
                            "title": item["snippet"]["title"],
                            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                            "embed_url": f"https://www.youtube.com/embed/{item['id']['videoId']}"
                        }
                        for item in items
                    ]
        except Exception as e:
            print(f"YouTube search error: {e}")
        
        return [self._fallback_search(query)]

    def _fallback_search(self, query: str) -> Dict:
        """Return a direct search link if API fails."""
        from urllib.parse import quote_plus
        safe_query = quote_plus(f"{query} exercise tutorial")
        return {
            "video_id": None,
            "title": f"Search Results: {query}",
            "thumbnail": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80", # Generic fitness image
            "url": f"https://www.youtube.com/results?search_query={safe_query}",
            "embed_url": None
        }

    async def get_top_tutorial(self, exercise_name: str) -> Optional[str]:
        """Convenience method for AI Agent to get a single best tutorial URL."""
        videos = await self.search_exercise_videos(exercise_name, max_results=1)
        if videos and videos[0].get("url"):
            return videos[0]["url"]
        return None

youtube_service = YouTubeService()
