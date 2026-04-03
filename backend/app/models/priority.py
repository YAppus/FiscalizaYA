from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Priority(Base):
    __tablename__ = "priorities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    level: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    occurrences = relationship("Occurrence", back_populates="priority")
