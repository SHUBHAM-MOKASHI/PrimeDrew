from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.logger import logger
from app.routers import health, damage_routes, kyc_routes

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Microservice providing YOLOv8 Vehicle Damage Detection, EasyOCR Document Parsing, and DeepFace 1:1 Biometric Verification.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to trusted internal gateway IPs in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount APIRouters
app.include_router(health.router)
app.include_router(damage_routes.router)
app.include_router(kyc_routes.router)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal AI microservice error.",
            "error_detail": str(exc)
        }
    )

if __name__ == "__main__":
    logger.info(f"Starting {settings.PROJECT_NAME} on port {settings.PORT}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
