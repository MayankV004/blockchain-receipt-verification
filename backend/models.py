import os
from sqlalchemy import Column, String, Float, create_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Receipt(Base):
    __tablename__ = "receipts"
    receipt_id = Column(String, primary_key=True)
    file_hash = Column(String, unique=True)
    uploader = Column(String)
    timestamp = Column(Float)
    r2_key = Column(String)

# Bug #3 fix: use DATABASE_URL from environment instead of hardcoded SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///receipts.db")
# SQLAlchemy doesn't accept asyncpg URLs for sync engine; convert if needed
SYNC_DB_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(SYNC_DB_URL)
Base.metadata.create_all(engine)
