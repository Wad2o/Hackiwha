from pydantic import BaseModel, Field


class Typography(BaseModel):
    titles: str = ""
    text: str = ""
    extra: str = ""
    highlight: str = ""


class Visual(BaseModel):
    logo: str = ""
    typography: Typography = Field(default_factory=Typography)
    photography: str = ""
    color_palette: str = ""


class Tone(BaseModel):
    vocabulary: str = ""
    humor_level: str = ""
    formality: str = ""
    sentence_rhythm: str = ""


class Positioning(BaseModel):
    target_audience: str = ""
    problem_statement: str = ""
    flare: str = ""


class BrandImage(BaseModel):
    visual: Visual = Field(default_factory=Visual)
    tone: Tone = Field(default_factory=Tone)
    positioning: Positioning = Field(default_factory=Positioning)
