import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import content
from app.db.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup : crée les tables + client HTTP
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.state.ai_client = httpx.AsyncClient(timeout=30.0)
    print("Serveur en marche")
    yield
    # Shutdown
    await app.state.ai_client.aclose()
    await engine.dispose()
    print("Serveur en arret")


app = FastAPI(
    title="Kbsli AI",
    description="Backend avec DB, AI Service, et APIs officielles",
    version="1.0.0",
    lifespan=lifespan
)

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
    return {"status": "ok", "service": "backend-gateway"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
