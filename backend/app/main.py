"""FastAPI Main Application Entrypoint."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.endpoints.analyze import router as analyze_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for ScholarPulse AI - Research Paper Insight Generator",
)

# Ensure CORS middleware handles all origins and credentials cleanly across local and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if "*" not in settings.CORS_ORIGINS else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cors_headers_to_all_responses(request: Request, call_next):
    """Fallback middleware to guarantee CORS headers on every response, even 500 errors."""
    if request.method == "OPTIONS":
        return await call_next(request)

    try:
        response = await call_next(request)
    except Exception as exc:
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}"},
        )

    origin = request.headers.get("origin")
    if origin:
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
        if "Access-Control-Allow-Credentials" not in response.headers:
            response.headers["Access-Control-Allow-Credentials"] = "true"
            
        if "Access-Control-Allow-Methods" not in response.headers:
            request_method = request.headers.get("Access-Control-Request-Method")
            if request_method:
                response.headers["Access-Control-Allow-Methods"] = request_method
            else:
                response.headers["Access-Control-Allow-Methods"] = request.method
                
        if "Access-Control-Allow-Headers" not in response.headers:
            request_headers = request.headers.get("Access-Control-Request-Headers")
            if request_headers:
                response.headers["Access-Control-Allow-Headers"] = request_headers
            else:
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to ensure internal server errors return CORS headers and JSON response."""
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )
    origin = request.headers.get("origin")
    if origin:
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
        if "Access-Control-Allow-Credentials" not in response.headers:
            response.headers["Access-Control-Allow-Credentials"] = "true"
            
        if "Access-Control-Allow-Methods" not in response.headers:
            request_method = request.headers.get("Access-Control-Request-Method")
            if request_method:
                response.headers["Access-Control-Allow-Methods"] = request_method
            else:
                response.headers["Access-Control-Allow-Methods"] = request.method
                
        if "Access-Control-Allow-Headers" not in response.headers:
            request_headers = request.headers.get("Access-Control-Request-Headers")
            if request_headers:
                response.headers["Access-Control-Allow-Headers"] = request_headers
            else:
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin"
    return response


# Include endpoint routes
app.include_router(analyze_router)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

