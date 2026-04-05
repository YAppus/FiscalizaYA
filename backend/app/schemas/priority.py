from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.sanitizers import sanitize_text


class PriorityBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    level: int = Field(ge=1, le=999)
    description: str | None = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value


class PriorityCreate(PriorityBase):
    pass


class PriorityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    level: int | None = Field(default=None, ge=1, le=999)
    description: str | None = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value


class PriorityResponse(PriorityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
