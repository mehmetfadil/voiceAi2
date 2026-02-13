# voice_ai_backend/models.py
from sqlalchemy import Column, Integer, String, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    # YENİ: AI'nın nasıl davranacağını belirleyen özel talimat (Persona)
    system_prompt = Column(Text, default="You are a helpful AI assistant.")