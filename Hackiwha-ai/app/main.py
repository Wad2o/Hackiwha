import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from datetime import datetime

from routers.video_coach import router as video_critic_router
from routers.partner_evaluation import router as partner_evaluator_router

# Configure logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


app = FastAPI(title="AI Service :D")

app.include_router(video_critic_router)
app.include_router(partner_evaluator_router)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unexpected error: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later. (Error Handling to be improved in future versions)"
        },
    )


@app.get("/health")
def health():
    return {
        "response": f"Hello from the AI Service, Current Time {datetime.now().isoformat()}",
        "status": "ok",
    }
