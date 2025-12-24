"""
Database configuration and session management
Supports SQLite for development and PostgreSQL for production
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base

# Default to SQLite for development, PostgreSQL for production
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./data/neondeck.db"
)

# Handle SQLite vs PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    # SQLite - create data directory if needed
    import os
    os.makedirs("data", exist_ok=True)
    engine = create_async_engine(
        DATABASE_URL,
        echo=os.getenv("LOG_LEVEL") == "DEBUG",
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL
    engine = create_async_engine(
        DATABASE_URL,
        echo=os.getenv("LOG_LEVEL") == "DEBUG",
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

# Create async session maker
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default categories for SQLite
    if DATABASE_URL.startswith("sqlite"):
        await seed_categories()


async def seed_categories():
    """Seed default categories"""
    from models import Category
    
    default_categories = [
        {"name": "Infrastructure", "icon": "server", "color": "#00d9ff", "order_index": 1},
        {"name": "Monitoring", "icon": "activity", "color": "#ff00ff", "order_index": 2},
        {"name": "Media", "icon": "film", "color": "#b026ff", "order_index": 3},
        {"name": "Automation", "icon": "zap", "color": "#ff0080", "order_index": 4},
        {"name": "Storage", "icon": "database", "color": "#0080ff", "order_index": 5},
        {"name": "Development", "icon": "code", "color": "#00ffaa", "order_index": 6},
        {"name": "Security", "icon": "shield", "color": "#ff4444", "order_index": 7},
        {"name": "Networking", "icon": "globe", "color": "#00d9ff", "order_index": 8},
    ]
    
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(Category))
        if not result.scalars().first():
            for cat_data in default_categories:
                session.add(Category(**cat_data))
            await session.commit()

