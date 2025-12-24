"""
Scanner API endpoints for NeonDeck
"""
import os
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import get_db, AsyncSessionLocal
from models import Service, Category, ScanHistory
from scanner import NetworkScanner, HTTPProbe, ServiceCategorizer

router = APIRouter()
logger = logging.getLogger(__name__)

# Keep only the last N scan history entries
MAX_SCAN_HISTORY = 30


class ScanStatus(BaseModel):
    status: str
    message: str
    scan_id: Optional[int] = None


class ScanHistoryResponse(BaseModel):
    id: int
    started_at: str
    completed_at: Optional[str]
    services_found: int
    new_services: int
    removed_services: int
    status: str
    error_message: Optional[str]

    class Config:
        from_attributes = True


async def perform_scan():
    """Background task to perform network scan"""
    logger.info("Starting network scan")
    
    # Create own DB session for background task
    async with AsyncSessionLocal() as db:
        # Créer un enregistrement de scan
        scan = ScanHistory(
            started_at=datetime.utcnow(),
            status="running",
            scan_config={
                "networks": os.getenv("SCAN_NETWORKS", "192.168.1.0/24").split(","),
                "ports": os.getenv("SCAN_PORTS", "80,443,8080,8443,3000,5000,5001,8000,9000").split(",")
            }
        )
        db.add(scan)
        await db.commit()
        await db.refresh(scan)
        
        try:
            # Configuration du scan
            networks = os.getenv("SCAN_NETWORKS", "192.168.1.0/24").split(",")
            ports_str = os.getenv("SCAN_PORTS", "80,443,8080,8443,3000,5000,5001,8000,8081,9000,9090")
            ports = [int(p.strip()) for p in ports_str.split(",")]
            
            # Initialize scanners
            network_scanner = NetworkScanner(networks, ports)
            http_probe = HTTPProbe()
            categorizer = ServiceCategorizer()
            
            # Scan network for hosts
            logger.info(f"Scanning networks: {networks}")
            hosts = await network_scanner.scan_all_networks()
            
            # Probe HTTP services
            logger.info(f"Probing {len(hosts)} hosts for web services")
            web_services = await http_probe.probe_multiple(hosts)
            
            logger.info(f"Found {len(web_services)} web services")
            
            # Process discovered services
            new_services_count = 0
            existing_services = {}
            hidden_urls = set()  # URLs that user has hidden - don't recreate them
            
            # Get existing services (including hidden ones to avoid re-creating them)
            result = await db.execute(select(Service))
            for service in result.scalars():
                if service.is_hidden:
                    hidden_urls.add(service.url)
                else:
                    existing_services[service.url] = service
            
            # Get categories
            cat_result = await db.execute(select(Category))
            categories = {cat.name: cat for cat in cat_result.scalars()}
            
            # Track URLs we've already processed in this batch
            seen_urls = set()
            
            for web_service in web_services:
                url = web_service['url']
                
                # Skip if we've already processed this URL in this batch
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                
                # Skip hidden services (user deleted them)
                if url in hidden_urls:
                    continue
                
                if url in existing_services:
                    # Update existing service
                    service = existing_services[url]
                    service.last_seen = datetime.utcnow()
                    service.response_time = web_service.get('response_time')
                    service.status = 'active'
                else:
                    # Create new service
                    category_name = categorizer.categorize(
                        web_service.get('title', ''),
                        url,
                        web_service.get('description')
                    )
                    
                    category = categories.get(category_name)
                    
                    # Truncate favicon_url to fit DB column (512 chars max)
                    favicon_url = web_service.get('favicon')
                    if favicon_url and len(favicon_url) > 500:
                        favicon_url = None  # Skip SVG data URIs that are too long
                    
                    service = Service(
                        name=web_service.get('title', f"{web_service['ip']}:{web_service['port']}")[:255],
                        url=url[:500],
                        description=web_service.get('description'),
                        favicon_url=favicon_url,
                        category_id=category.id if category else None,
                        ip_address=web_service['ip'],
                        port=web_service['port'],
                        protocol=web_service['protocol'],
                        response_time=web_service.get('response_time'),
                        status='active',
                        is_manual=False,
                        is_category_manual=False
                    )
                    db.add(service)
                    existing_services[url] = service  # Track to prevent duplicates
                    new_services_count += 1
            
            # Mark services not seen as inactive
            scanned_urls = {ws['url'] for ws in web_services}
            for url, service in existing_services.items():
                if url not in scanned_urls and not service.is_manual:
                    service.status = 'inactive'
            
            # Commit changes
            await db.commit()
            
            # Update scan history
            scan.completed_at = datetime.utcnow()
            scan.status = "completed"
            scan.services_found = len(web_services)
            scan.new_services = new_services_count
            await db.commit()
            
            # Cleanup old scan history entries (keep only last MAX_SCAN_HISTORY)
            old_scans_query = (
                select(ScanHistory.id)
                .order_by(ScanHistory.started_at.desc())
                .offset(MAX_SCAN_HISTORY)
            )
            old_scans = await db.execute(old_scans_query)
            old_scan_ids = [row[0] for row in old_scans.fetchall()]
            if old_scan_ids:
                await db.execute(delete(ScanHistory).where(ScanHistory.id.in_(old_scan_ids)))
                await db.commit()
                logger.info(f"Cleaned up {len(old_scan_ids)} old scan history entries")
            
            logger.info(f"Scan completed. Found {len(web_services)} services, {new_services_count} new")
            
        except Exception as e:
            logger.error(f"Scan failed: {e}", exc_info=True)
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            await db.commit()


@router.post("/scan/trigger", response_model=ScanStatus)
async def trigger_scan(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Trigger a network scan"""
    # Check if scan is already running
    result = await db.execute(
        select(ScanHistory)
        .where(ScanHistory.status == "running")
        .order_by(ScanHistory.started_at.desc())
    )
    running_scan = result.scalar_one_or_none()
    
    if running_scan:
        return ScanStatus(
            status="running",
            message="A scan is already in progress",
            scan_id=running_scan.id
        )
    
    # Start scan in background
    background_tasks.add_task(perform_scan)
    
    return ScanStatus(
        status="started",
        message="Network scan started"
    )


@router.get("/scan/history", response_model=List[ScanHistoryResponse])
async def get_scan_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get scan history"""
    result = await db.execute(
        select(ScanHistory)
        .order_by(ScanHistory.started_at.desc())
        .limit(limit)
    )
    scans = result.scalars().all()
    
    return [
        {
            "id": scan.id,
            "started_at": scan.started_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "services_found": scan.services_found,
            "new_services": scan.new_services,
            "removed_services": scan.removed_services,
            "status": scan.status,
            "error_message": scan.error_message
        }
        for scan in scans
    ]


@router.get("/scan/status", response_model=ScanStatus)
async def get_scan_status(db: AsyncSession = Depends(get_db)):
    """Get current scan status"""
    result = await db.execute(
        select(ScanHistory)
        .where(ScanHistory.status == "running")
        .order_by(ScanHistory.started_at.desc())
    )
    running_scan = result.scalar_one_or_none()
    
    if running_scan:
        return ScanStatus(
            status="running",
            message="Scan in progress",
            scan_id=running_scan.id
        )
    
    return ScanStatus(
        status="idle",
        message="No scan running"
    )
