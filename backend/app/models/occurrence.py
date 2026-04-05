from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class OccurrenceStatus(StrEnum):
    ABERTA = "Aberta"
    EM_ANALISE = "Em Analise"
    EM_ANDAMENTO = "Em Andamento"
    RESOLVIDA = "Resolvida"
    FECHADA = "Fechada"
    CANCELADA = "Cancelada"


class Occurrence(Base):
    __tablename__ = "occurrences"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cpf: Mapped[str] = mapped_column(String(11), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    priority_id: Mapped[int] = mapped_column(ForeignKey("priorities.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default=OccurrenceStatus.ABERTA.value, index=True)
    description: Mapped[str] = mapped_column(Text)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category = relationship("Category", back_populates="occurrences")
    priority = relationship("Priority", back_populates="occurrences")
    history_entries = relationship("History", back_populates="occurrence", cascade="all, delete-orphan")
    attachments = relationship("OccurrenceAttachment", back_populates="occurrence", cascade="all, delete-orphan")
