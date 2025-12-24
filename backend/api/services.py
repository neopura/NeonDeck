"""
Services API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import get_db
from models import Service, Category

router = APIRouter()


# Pydantic schemas
class ServiceBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    category_id: Optional[int] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None


class ServiceResponse(BaseModel):
    id: int
    name: str
    url: str
    description: Optional[str]
    favicon_url: Optional[str]
    category_id: Optional[int]
    category_name: Optional[str]
    ip_address: Optional[str]
    port: Optional[int]
    protocol: str
    status: str
    response_time: Optional[int]
    last_seen: str
    is_manual: bool
    is_category_manual: bool

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "folder"
    color: Optional[str] = "#00d9ff"
    order_index: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order_index: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    order_index: int
    service_count: int = 0

    class Config:
        from_attributes = True


def format_service(service: Service) -> dict:
    """Helper to format Service model to response dict"""
    return {
        "id": service.id,
        "name": service.name,
        "url": service.url,
        "description": service.description,
        "favicon_url": service.favicon_url,
        "category_id": service.category_id,
        "category_name": service.category.name if service.category else None,
        "ip_address": str(service.ip_address) if service.ip_address else None,
        "port": service.port,
        "protocol": service.protocol,
        "status": service.status,
        "response_time": service.response_time,
        "last_seen": service.last_seen.isoformat() if service.last_seen else None,
        "is_manual": service.is_manual,
        "is_category_manual": service.is_category_manual
    }


@router.get("/services", response_model=List[ServiceResponse])
async def get_services(
    category_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all services with optional filtering"""
    query = select(Service).options(selectinload(Service.category)).where(Service.is_hidden == False)
    
    if category_id:
        query = query.where(Service.category_id == category_id)
    if status:
        query = query.where(Service.status == status)
    if search:
        query = query.where(
            Service.name.ilike(f"%{search}%") | 
            Service.url.ilike(f"%{search}%") |
            Service.description.ilike(f"%{search}%")
        )
    
    query = query.order_by(Service.name)
    result = await db.execute(query)
    services = result.scalars().all()
    
    return [format_service(s) for s in services]


@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific service by ID"""
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return format_service(service)


@router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, db: AsyncSession = Depends(get_db)):
    """Manually create or update a new service"""
    # Check if a service with this URL already exists
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.url == service.url)
    )
    existing_service = result.scalar_one_or_none()
    
    if existing_service:
        # If the service is hidden, we "restore" it with the new manual data
        if existing_service.is_hidden:
            existing_service.name = service.name
            existing_service.description = service.description
            existing_service.category_id = service.category_id
            existing_service.is_manual = True
            existing_service.is_hidden = False
            if service.category_id:
                existing_service.is_category_manual = True
            
            await db.commit()
            await db.refresh(existing_service)
            # Need to reload category after refresh to ensure it's available for format_service
            await db.execute(select(Service).options(selectinload(Service.category)).where(Service.id == existing_service.id))
            return format_service(existing_service)
        else:
            # If it's already active, we warn the user instead of silent update
            raise HTTPException(
                status_code=400, 
                detail=f"This URL is already in use by service: '{existing_service.name}'"
            )

    # Create new service
    new_service = Service(
        **service.dict(),
        is_manual=True,
        is_category_manual=True if service.category_id else False,
        status="active"
    )
    
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    # Reload with category
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == new_service.id)
    )
    new_service = result.scalar_one()
    
    return format_service(new_service)


@router.patch("/services/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a service"""
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Update fields
    update_data = service_update.dict(exclude_unset=True)
    if "category_id" in update_data:
        service.is_category_manual = True
        
    for field, value in update_data.items():
        setattr(service, field, value)
    
    await db.commit()
    await db.refresh(service)
    
    # Reload with category after refresh
    result = await db.execute(
        select(Service).options(selectinload(Service.category)).where(Service.id == service.id)
    )
    service = result.scalar_one()
    
    return format_service(service)


@router.delete("/services/{service_id}")
async def delete_service(service_id: int, db: AsyncSession = Depends(get_db)):
    """Soft delete a service - marks it as hidden so scanner ignores it"""
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Soft delete - mark as hidden instead of actually deleting
    service.is_hidden = True
    await db.commit()
    
    return {"status": "hidden", "id": service_id}


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories with service counts"""
    result = await db.execute(
        select(Category).order_by(Category.order_index, Category.name)
    )
    categories = result.scalars().all()
    
    # Get service counts
    response_categories = []
    for category in categories:
        count_result = await db.execute(
            select(Service).where(Service.category_id == category.id, Service.is_hidden == False)
        )
        service_count = len(count_result.scalars().all())
        
        category_dict = {
            "id": category.id,
            "name": category.name,
            "icon": category.icon,
            "color": category.color,
            "order_index": category.order_index,
            "service_count": service_count
        }
        response_categories.append(category_dict)
    
    return response_categories
@router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    """Create a new category"""
    # Check if category already exists
    result = await db.execute(select(Category).where(Category.name == category.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_category = Category(**category.dict())
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    # Return with 0 service count
    return {
        "id": new_category.id,
        "name": new_category.name,
        "icon": new_category.icon,
        "color": new_category.color,
        "order_index": new_category.order_index,
        "service_count": 0
    }


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a category"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    
    # Get service count
    count_result = await db.execute(
        select(Service).where(Service.category_id == category.id, Service.is_hidden == False)
    )
    service_count = len(count_result.scalars().all())
    
    return {
        "id": category.id,
        "name": category.name,
        "icon": category.icon,
        "color": category.color,
        "order_index": category.order_index,
        "service_count": service_count
    }


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a category - sets category_id to NULL for all services in it"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # SQLAlchemy will handle the SET NULL on services due to foreign key constraint
    await db.delete(category)
    await db.commit()
    
    return {"status": "deleted", "id": category_id}
