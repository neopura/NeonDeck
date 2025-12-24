"""
SQLAlchemy database models for NeonDeck
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Category(Base):
    """Service category model"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), default="folder")
    color = Column(String(7), default="#00d9ff")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    services = relationship("Service", back_populates="category")

    def __repr__(self):
        return f"<Category {self.name}>"


class Service(Base):
    """Discovered service model"""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(512), unique=True, nullable=False, index=True)
    description = Column(Text)
    favicon_url = Column(String(512))
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    ip_address = Column(String(45))  # Support IPv4 and IPv6
    port = Column(Integer)
    protocol = Column(String(10), default="https")
    status = Column(String(20), default="active", index=True)
    response_time = Column(Integer)  # milliseconds
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    first_discovered = Column(DateTime, default=datetime.utcnow)
    is_manual = Column(Boolean, default=False)
    is_category_manual = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False, index=True)  # Soft delete - hidden from UI and ignored by scanner
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    category = relationship("Category", back_populates="services")

    def __repr__(self):
        return f"<Service {self.name} ({self.url})>"


class ScanHistory(Base):
    """Scan history model"""
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime)
    services_found = Column(Integer, default=0)
    new_services = Column(Integer, default=0)
    removed_services = Column(Integer, default=0)
    status = Column(String(20), default="running")
    error_message = Column(Text)
    scan_config = Column(JSON, default={})

    def __repr__(self):
        return f"<ScanHistory {self.id} ({self.status})>"
