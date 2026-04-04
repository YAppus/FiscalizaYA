from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OccurrenceAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phase: str
    original_filename: str
    content_type: str
    created_at: datetime
