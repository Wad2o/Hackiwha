import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import content


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager :
    - Au démarrage : crée un client HTTP partagé pour communiquer avec l'AI Service
    - À l'arrêt : ferme proprement le client
    """
    # Startup
    app.state.ai_client = httpx.AsyncClient(timeout=30.0)
    print("[OK] Backend demarre - Client HTTP pret pour l'AI Service")
    yield
    # Shutdown
    await app.state.ai_client.aclose()
    print("[STOP] Backend arrete - Client HTTP ferme")


app = FastAPI(
    title="ViralContent AI Coach — Backend Gateway",
    description="Gateway FastAPI qui orchestre le frontend, le dataset et l'AI Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "backend-gateway",
        "ai_service_url": "http://localhost:8001"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
