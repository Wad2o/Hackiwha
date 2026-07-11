import pytest
import httpx
import uuid

BASE_URL = "http://localhost:8000"

# Global state to share data between test steps
state = {
    "unique_id": str(uuid.uuid4())[:8]
}

@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL) as client:
        yield client

# ==========================================
# 1. AUTHENTICATION TESTS
# ==========================================
class TestAuth:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_register(self, client):
        email = f"test_{state['unique_id']}@hackiwha.com"
        state["email"] = email
        state["password"] = "Password123!"
        
        response = client.post("/auth/register", json={
            "email": email,
            "password": state["password"]
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "userId" in data
        state["authUserId"] = data["userId"]

    def test_login(self, client):
        response = client.post("/auth/login", data={
            "username": state["email"],
            "password": state["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        state["token"] = data["access_token"]

    def test_me(self, client):
        response = client.get("/auth/me", headers={
            "Authorization": f"Bearer {state['token']}"
        })
        assert response.status_code == 200
        assert response.json()["email"] == state["email"]


# ==========================================
# 2. BRAND & PROFILES TESTS
# ==========================================
class TestBrandAndProfiles:


    def test_create_user_profile(self, client):
        data = {
            "email": f"profile_{state['unique_id']}@hackiwha.com",
            "password": "Password123!",
            "name": "LiveTest",
            "age": 22,
            "gender": "male",
            "country": "France",
            "city": "Paris",
        }
        response = client.post("/content/form-user", data=data)
        assert response.status_code == 200
        profile = response.json()
        assert "userId" in profile
        state["profileUserId"] = profile["userId"]
        state["contentUserId"] = profile["userId"]  # Used by other tests

    def test_create_brand(self, client):
        brand_payload = {
            "userId": state["contentUserId"],
            "visual": {
                "logo": "logo.png",
                "photography": "",
                "color_palette": ["#ff0000"],
                "typography": { "titles": "Bold", "texts": "Regular", "extra": "", "highlight": "" }
            },
            "tone": { "vocabulary": "natural", "humor_level": "none", "formality": "casual", "sentence_rhythm": "efficient" },
            "positioning": { "target_audience": "Gen Z", "problem_statement": "Viral content", "flare": "edgy" }
        }
        response = client.post("/content/brands", json=brand_payload)
        assert response.status_code == 200
        assert "brandId" in response.json()

    def test_get_brand(self, client):
        response = client.get(f"/content/brands/{state['contentUserId']}")
        assert response.status_code == 200
        assert response.json()["userId"] == state["contentUserId"]


# ==========================================
# 3. POSTS TESTS
# ==========================================
class TestPosts:
    def test_create_post(self, client):
        post_data = {
            "userId": state["contentUserId"],
            "idea": "hackiwha viral idea",
            "script": "Hook -> Demo -> CTA",
            "hook": "POV tu decouvres",
            "platform": "tiktok",
            "is_loop": "false",
            "suggested_vfx": "zoom",
            "suggested_sfx": "sound",
            "confidence_score": 0.85    
        }
        response = client.post("/content/posts/form", data=post_data)
        assert response.status_code == 200
        data = response.json()
        assert "postId" in data
        state["postId"] = data["postId"]

    def test_get_posts(self, client):
        response = client.get(f"/content/posts/{state['contentUserId']}")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        assert len(posts) > 0

    def test_delete_post(self, client):
        response = client.delete(f"/content/posts/{state['postId']}")
        assert response.status_code == 200


# ==========================================
# 4. AI ENDPOINTS TESTS
# ==========================================
class TestAIEndpoints:
    def test_video_coach(self, client):
        payload = {
            "userId": state["profileUserId"],
            "brand": {
                "visual": { "logo": "", "photography": "", "color_palette": [], "typography": { "titles": "", "texts": "", "extra": "", "highlight": "" } },
                "tone": { "vocabulary": "natural", "humor_level": "none", "formality": "casual", "sentence_rhythm": "efficient" },
                "positioning": { "target_audience": "Gen Z", "problem_statement": "viral", "flare": "edgy" }
            },
            "posts": [],
            "prompt": "Je veux promouvoir mon app hackiwha"
        }
        response = client.post("/content/video-coach", json=payload)
        assert response.status_code == 200
        assert "script" in response.json()

    def test_partner_evaluation(self, client):
        payload = {
            "user": {
                "userId": state["profileUserId"],
                "name": "HackTest",
                "description": "test",
                "content_type": ["tiktok"],
                "age": 22,
                "gender": "male",
                "location": { "country": "France", "city": "Paris", "timezone": "" },
                "experience": { "years": 1, "months": 3, "days": 0 }
            },
            "partner_brand": "Nike",
            "brand": {
                "visual": { "logo": "", "photography": "", "color_palette": [], "typography": { "titles": "", "texts": "", "extra": "", "highlight": "" } },
                "tone": { "vocabulary": "natural", "humor_level": "none", "formality": "casual", "sentence_rhythm": "efficient" },
                "positioning": { "target_audience": "Gen Z", "problem_statement": "viral", "flare": "edgy" }
            },
            "prompt": "Est-ce que Nike est compatible avec mon profil ?"
        }
        response = client.post("/content/partner-evaluation", json=payload)
        assert response.status_code == 200
        assert "compatibility" in response.json()
