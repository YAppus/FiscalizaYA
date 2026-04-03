from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.sanitizers import sanitize_text


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, value: str | None) -> str | None:
        return sanitize_text(value) if value else value


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
