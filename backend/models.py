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

engine = create_engine("sqlite:///receipts.db")
Base.metadata.create_all(engine)
