from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from datetime import datetime


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    userId = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    brands = relationship("Brand", back_populates="user", cascade="all, delete")
    posts = relationship("Post", back_populates="user", cascade="all, delete")


class Brand(Base):
    __tablename__ = "brands"

    brandId = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("users.userId"), nullable=False)

    # Visual Identity
    logo = Column(String, nullable=True)
    title_typography = Column(String, nullable=True)
    text_typography = Column(String, nullable=True)
    extras_typography = Column(String, nullable=True)
    highlights_typography = Column(String, nullable=True)
    photography = Column(String, nullable=True)
    color_palette = Column(JSON, nullable=True)  # ["#FF0000", "#00FF00"]

    # Brand Tone
    vocabulary = Column(String, nullable=True)
    humor_level = Column(String, nullable=True)
    formality = Column(String, nullable=True)
    sentence_rhythm = Column(String, nullable=True)

    # Brand Positioning
    target_audience = Column(String, nullable=True)
    problem_statement = Column(String, nullable=True)
    flare = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relation
    user = relationship("User", back_populates="brands")


class Post(Base):
    __tablename__ = "posts"

    postId = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("users.userId"), nullable=False)

    idea = Column(String, nullable=True)
    script = Column(String, nullable=True)
    hook = Column(String, nullable=True)
    platform = Column(String, nullable=False)
    is_loop = Column(Boolean, default=False)

    # Métadonnées AI
    suggested_vfx = Column(String, nullable=True)
    suggested_sfx = Column(String, nullable=True)
    design_direction = Column(JSON, nullable=True)
    analysis = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relation
    user = relationship("User", back_populates="posts")
