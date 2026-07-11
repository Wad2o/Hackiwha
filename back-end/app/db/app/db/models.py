import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, Text

from app.db.database import Base  # ← même Base que l'engine


class User(Base):
    __tablename__ = "users"

    userId = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    userId = Column(String, primary_key=True, index=True)
    name = Column(String, default="")
    age = Column(Integer, default=0)
    gender = Column(String, default="")
    country = Column(String, default="")
    city = Column(String, default="")
    timezone = Column(String, default="")


class Brand(Base):
    __tablename__ = "brands"

    brandId = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, index=True, nullable=False)
    logo = Column(String, default="")
    photography = Column(String, default="")
    color_palette = Column(JSON, default=list)
    title_typography = Column(String, default="")
    text_typography = Column(String, default="")
    extras_typography = Column(String, default="")
    highlights_typography = Column(String, default="")
    vocabulary = Column(String, default="natural")
    humor_level = Column(String, default="none")
    formality = Column(String, default="casual")
    sentence_rhythm = Column(String, default="efficient")
    target_audience = Column(String, default="")
    problem_statement = Column(String, default="")
    flare = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Post(Base):
    __tablename__ = "posts"

    postId = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, index=True, nullable=False)
    idea = Column(Text, nullable=True)
    script = Column(Text, nullable=True)
    hook = Column(String, nullable=True)
    platform = Column(String, default="tiktok")
    is_loop = Column(Boolean, default=False)
    suggested_vfx = Column(String, nullable=True)
    suggested_sfx = Column(String, nullable=True)
    design_direction = Column(JSON, nullable=True)
    analysis = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)