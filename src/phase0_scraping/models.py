from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ReviewSchema(BaseModel):
    """
    Standardized schema for unstructured customer feedback gathered from
    all sources (App Store, Play Store, Reddit, Forums, etc.)
    """
    review_id: str = Field(..., description="Unique identifier for the review or post")
    source: str = Field(..., description="Source of the data (e.g., play_store, app_store, reddit, forum)")
    rating: Optional[int] = Field(None, description="Numerical rating (usually 1-5), if applicable")
    title: Optional[str] = Field(None, description="Title of the review or post, if applicable")
    content: str = Field(..., description="The main text body of the review or discussion post")
    timestamp: str = Field(..., description="ISO 8601 formatted timestamp of when the content was created")
    version: Optional[str] = Field(None, description="App version associated with the review, if applicable")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Source-specific key-value pairs (e.g. user, category, url, score)")
