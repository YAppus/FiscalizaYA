from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.sanitizers import sanitize_text


class HistoryBase(BaseModel):
    occurrence_id: int
    previous_status: str | None = Field(default=None, max_length=30)
    new_status: str = Field(max_length=30)
    note: str | None = Field(default=None, max_length=255)
    changed_by_user_id: str | None = None

    @field_validator("previous_status", "new_status", "note")
    @classmethod
    def sanitize_strings(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value


class HistoryCreate(HistoryBase):
    pass


class HistoryUpdate(BaseModel):
    previous_status: str | None = Field(default=None, max_length=30)
    new_status: str | None = Field(default=None, max_length=30)
    note: str | None = Field(default=None, max_length=255)
    changed_by_user_id: str | None = None


class HistoryResponse(HistoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_at: datetime
