import os
from typing import List, Dict
import httpx

TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")


def get_platform_api_client(platform: str):
    if platform == "tiktok":
        return TikTokAPI()
    elif platform in ("instagram_reels", "facebook_reels"):
        return MetaAPI()
    elif platform == "youtube_shorts":
        return YouTubeAPI()
    raise ValueError(f"Plateforme non supportée: {platform}")


class TikTokAPI:
    BASE_URL = "https://open.tiktokapis.com/v2"

    async def fetch_user_videos(self, access_token: str, max_count: int = 20) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/video/list/",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"fields": "id,title,video_description,duration,create_time,view_count,like_count,comment_count,share_count", "max_count": max_count},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json().get("data", {}).get("videos", [])

    def normalize_video(self, raw: dict) -> dict:
        return {
            "platform": "tiktok",
            "post_id": raw.get("id"),
            "caption": raw.get("title", "") or raw.get("video_description", ""),
            "duration": raw.get("duration", 0),
            "views": raw.get("view_count", 0),
            "likes": raw.get("like_count", 0),
            "comments": raw.get("comment_count", 0),
            "shares": raw.get("share_count", 0),
        }


class MetaAPI:
    BASE_URL = "https://graph.facebook.com/v21.0"

    async def fetch_instagram_reels(self, ig_user_id: str, access_token: str, limit: int = 25) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{ig_user_id}/media",
                params={"fields": "id,caption,media_type,permalink,timestamp,like_count,comments_count", "limit": limit, "access_token": access_token},
                timeout=30.0,
            )
            response.raise_for_status()
            return [m for m in response.json().get("data", []) if m.get("media_type") == "REELS"]

    async def fetch_facebook_reels(self, page_id: str, access_token: str, limit: int = 25) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{page_id}/videos",
                params={"fields": "id,description,created_time,length,views", "limit": limit, "access_token": access_token},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json().get("data", [])

    def normalize_instagram(self, raw: dict) -> dict:
        return {"platform": "instagram_reels", "post_id": raw.get("id"), "caption": raw.get("caption", ""), "likes": raw.get("like_count", 0), "comments": raw.get("comments_count", 0)}

    def normalize_facebook(self, raw: dict) -> dict:
        return {"platform": "facebook_reels", "post_id": raw.get("id"), "caption": raw.get("description", ""), "duration": raw.get("length", 0), "views": raw.get("views", 0)}


class YouTubeAPI:
    BASE_URL = "https://www.googleapis.com/youtube/v3"

    async def fetch_channel_shorts(self, channel_id: str, max_results: int = 50) -> List[Dict]:
        shorts_playlist_id = channel_id.replace("UC", "UUSH", 1)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/playlistItems",
                params={"part": "snippet,contentDetails", "playlistId": shorts_playlist_id, "maxResults": max_results, "key": YOUTUBE_API_KEY},
                timeout=30.0,
            )
            response.raise_for_status()
            items = response.json().get("items", [])
            video_ids = [i["contentDetails"]["videoId"] for i in items if "contentDetails" in i]
            if not video_ids:
                return []
            stats = await client.get(
                f"{self.BASE_URL}/videos",
                params={"part": "statistics,contentDetails,snippet", "id": ",".join(video_ids), "key": YOUTUBE_API_KEY},
                timeout=30.0,
            )
            stats.raise_for_status()
            return stats.json().get("items", [])

    def normalize_video(self, raw: dict) -> dict:
        stats = raw.get("statistics", {})
        snippet = raw.get("snippet", {})
        duration = self._parse_duration(raw.get("contentDetails", {}).get("duration", "PT0S"))
        return {"platform": "youtube_shorts", "post_id": raw.get("id"), "caption": snippet.get("title", ""), "duration": duration, "views": int(stats.get("viewCount", 0)), "likes": int(stats.get("likeCount", 0)), "comments": int(stats.get("commentCount", 0))}

    @staticmethod
    def _parse_duration(iso: str) -> int:
        import re
        m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
        if not m: return 0
        return int(m.group(1) or 0)*3600 + int(m.group(2) or 0)*60 + int(m.group(3) or 0)
