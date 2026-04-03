from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.occurrence import OccurrenceStatus
from app.core.sanitizers import sanitize_text
from app.schemas.category import CategoryResponse
from app.schemas.history import HistoryResponse
from app.schemas.priority import PriorityResponse


class OccurrenceBase(BaseModel):
    cpf: str
    category_id: int
    priority_id: int
    status: str = OccurrenceStatus.ABERTA.value
    description: str = Field(min_length=5)
    opened_at: datetime | None = None
    closed_at: datetime | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {item.value for item in OccurrenceStatus}
        if value not in allowed:
            raise ValueError(f"Status invalido. Use um de: {', '.join(sorted(allowed))}")
        return value

    @field_validator("cpf")
    @classmethod
    def sanitize_cpf(cls, value: str) -> str:
        return sanitize_text(value)

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, value: str) -> str:
        return sanitize_text(value)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.opened_at and self.closed_at and self.closed_at < self.opened_at:
            raise ValueError("Data de encerramento nao pode ser anterior a data de abertura")
        return self


class OccurrenceCreate(OccurrenceBase):
    pass


class OccurrenceUpdate(BaseModel):
    cpf: str | None = None
    category_id: int | None = None
    priority_id: int | None = None
    status: str | None = None
    description: str | None = Field(default=None, min_length=5)
    opened_at: datetime | None = None
    closed_at: datetime | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {item.value for item in OccurrenceStatus}
        if value not in allowed:
            raise ValueError(f"Status invalido. Use um de: {', '.join(sorted(allowed))}")
        return value

    @field_validator("cpf", "description")
    @classmethod
    def sanitize_optional_strings(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.opened_at and self.closed_at and self.closed_at < self.opened_at:
            raise ValueError("Data de encerramento nao pode ser anterior a data de abertura")
        return self


class OccurrenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cpf: str
    status: str
    description: str
    opened_at: datetime
    closed_at: datetime | None
    category: CategoryResponse
    priority: PriorityResponse
    history_entries: list[HistoryResponse] = []
