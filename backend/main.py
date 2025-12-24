"""
Main FastAPI application for NeonDeck
"""
import os
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from database import get_db, init_db
from api import services_router, scanner_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


async def scheduled_scan():
    """Run scheduled network scan"""
    from api.scanner import perform_scan
    logger.info("Starting scheduled daily scan at 4:00 AM")
    try:
        await perform_scan()
        logger.info("Scheduled daily scan completed successfully")
    except Exception as e:
        logger.error(f"Scheduled scan failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup
    logger.info("Starting NeonDeck API")
    await init_db()
    logger.info("Database initialized")
    
    # Configure scheduler for daily scan at 4:00 AM
    scan_hour = int(os.getenv("SCAN_HOUR", "4"))
    scan_minute = int(os.getenv("SCAN_MINUTE", "0"))
    
    scheduler.add_job(
        scheduled_scan,
        CronTrigger(hour=scan_hour, minute=scan_minute),
        id="daily_scan",
        name="Daily Network Scan",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"Scheduler started - Daily scan scheduled at {scan_hour:02d}:{scan_minute:02d}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down scheduler...")
    scheduler.shutdown(wait=False)
    logger.info("Shutting down NeonDeck API")


# Create FastAPI app
app = FastAPI(
    title="NeonDeck API",
    description="Network discovery and service inventory dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(services_router, prefix="/api", tags=["services"])
app.include_router(scanner_router, prefix="/api", tags=["scanner"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NeonDeck API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/api/scheduler/status")
async def scheduler_status():
    """Get scheduler status and next run time"""
    job = scheduler.get_job("daily_scan")
    if job:
        return {
            "enabled": True,
            "job_id": job.id,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "schedule": f"{os.getenv('SCAN_HOUR', '4')}:{os.getenv('SCAN_MINUTE', '0')}"
        }
    return {"enabled": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )

