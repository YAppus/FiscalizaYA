from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.validators import validate_cpf
from app.models.category import Category
from app.models.history import History
from app.models.occurrence import Occurrence, OccurrenceStatus
from app.models.priority import Priority
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.history import HistoryCreate, HistoryUpdate
from app.schemas.occurrence import OccurrenceCreate, OccurrenceUpdate
from app.schemas.priority import PriorityCreate, PriorityUpdate


ALLOWED_STATUS_TRANSITIONS = {
    OccurrenceStatus.ABERTA.value: {
        OccurrenceStatus.EM_ANALISE.value,
        OccurrenceStatus.CANCELADA.value,
    },
    OccurrenceStatus.EM_ANALISE.value: {
        OccurrenceStatus.EM_ANDAMENTO.value,
    },
    OccurrenceStatus.EM_ANDAMENTO.value: {
        OccurrenceStatus.RESOLVIDA.value,
    },
    OccurrenceStatus.RESOLVIDA.value: {OccurrenceStatus.FECHADA.value},
    OccurrenceStatus.FECHADA.value: set(),
    OccurrenceStatus.CANCELADA.value: set(),
}


async def get_or_404(session: AsyncSession, model, entity_id):
    entity = await session.get(model, entity_id)
    if not entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{model.__name__} nao encontrado")
    return entity


async def _ensure_unique(session: AsyncSession, model, column, value, entity_id=None):
    result = await session.execute(select(model).where(column == value))
    existing = result.scalar_one_or_none()
    if existing and getattr(existing, "id") != entity_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"{model.__name__} ja existe")


async def create_category(session: AsyncSession, payload: CategoryCreate) -> Category:
    await _ensure_unique(session, Category, Category.name, payload.name.strip())
    entity = Category(name=payload.name.strip(), description=payload.description)
    session.add(entity)
    await session.commit()
    await session.refresh(entity)
    return entity


async def update_category(session: AsyncSession, entity: Category, payload: CategoryUpdate) -> Category:
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        data["name"] = data["name"].strip()
        await _ensure_unique(session, Category, Category.name, data["name"], entity.id)
    for field, value in data.items():
        setattr(entity, field, value)
    await session.commit()
    await session.refresh(entity)
    return entity


async def create_priority(session: AsyncSession, payload: PriorityCreate) -> Priority:
    await _ensure_unique(session, Priority, Priority.name, payload.name.strip())
    await _ensure_unique(session, Priority, Priority.level, payload.level)
    entity = Priority(name=payload.name.strip(), level=payload.level, description=payload.description)
    session.add(entity)
    await session.commit()
    await session.refresh(entity)
    return entity


async def update_priority(session: AsyncSession, entity: Priority, payload: PriorityUpdate) -> Priority:
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        data["name"] = data["name"].strip()
        await _ensure_unique(session, Priority, Priority.name, data["name"], entity.id)
    if "level" in data:
        await _ensure_unique(session, Priority, Priority.level, data["level"], entity.id)
    for field, value in data.items():
        setattr(entity, field, value)
    await session.commit()
    await session.refresh(entity)
    return entity


async def create_history(session: AsyncSession, payload: HistoryCreate) -> History:
    await get_or_404(session, Occurrence, payload.occurrence_id)
    if payload.changed_by_user_id:
        await get_or_404(session, User, payload.changed_by_user_id)
    entity = History(**payload.model_dump())
    session.add(entity)
    await session.commit()
    await session.refresh(entity)
    return entity


async def update_history(session: AsyncSession, entity: History, payload: HistoryUpdate) -> History:
    data = payload.model_dump(exclude_unset=True)
    if "changed_by_user_id" in data and data["changed_by_user_id"]:
        await get_or_404(session, User, data["changed_by_user_id"])
    for field, value in data.items():
        setattr(entity, field, value)
    await session.commit()
    await session.refresh(entity)
    return entity


async def _assert_foreign_keys(session: AsyncSession, category_id: int, priority_id: int) -> None:
    await get_or_404(session, Category, category_id)
    await get_or_404(session, Priority, priority_id)


def _assert_status_transition(current_status: str, next_status: str) -> None:
    if current_status == next_status:
        return
    if next_status == OccurrenceStatus.CANCELADA.value and current_status != OccurrenceStatus.ABERTA.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O cancelamento so e permitido a partir de Aberta")
    allowed = ALLOWED_STATUS_TRANSITIONS[current_status]
    if next_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A transicao de {current_status} para {next_status} nao e permitida",
        )


async def _register_status_history(
    session: AsyncSession,
    occurrence: Occurrence,
    previous_status: str | None,
    new_status: str,
    changed_by_user_id: str | None,
    note: str | None = None,
    ) -> None:
    session.add(
        History(
            occurrence=occurrence,
            previous_status=previous_status,
            new_status=new_status,
            changed_by_user_id=changed_by_user_id,
            note=note,
        )
    )


def _build_description_change_note(previous_description: str, new_description: str) -> str:
    base_note = "Descricao alterada"
    detail = f" de '{previous_description}' para '{new_description}'"
    max_length = 255
    if len(base_note) + len(detail) <= max_length:
        return f"{base_note}{detail}"
    return base_note


def _build_change_note(field_label: str, previous_value: str, new_value: str) -> str:
    base_note = f"{field_label} alterada"
    detail = f" de '{previous_value}' para '{new_value}'"
    max_length = 255
    if len(base_note) + len(detail) <= max_length:
        return f"{base_note}{detail}"
    return base_note


def _format_history_datetime(value: datetime) -> str:
    return value.astimezone(UTC).strftime("%d/%m/%Y %H:%M:%S UTC") if value.tzinfo else value.strftime("%d/%m/%Y %H:%M:%S")


def _assert_description_update_allowed(current_status: str) -> None:
    blocked_statuses = {
        OccurrenceStatus.EM_ANDAMENTO.value,
        OccurrenceStatus.RESOLVIDA.value,
        OccurrenceStatus.FECHADA.value,
        OccurrenceStatus.CANCELADA.value,
    }
    if current_status in blocked_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e permitido alterar a descricao neste status da ocorrencia",
        )


def _assert_immutable_occurrence_fields(entity: Occurrence, data: dict) -> None:
    if "cpf" in data and data["cpf"] != entity.cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e permitido alterar CPF da ocorrencia",
        )

    mutable_only_in_early_status = {
        "category_id": ("categoria", entity.category_id),
        "priority_id": ("prioridade", entity.priority_id),
        "opened_at": ("data de abertura", entity.opened_at),
    }

    for field, (label, current_value) in mutable_only_in_early_status.items():
        if field in data and data[field] != current_value and entity.status not in {
            OccurrenceStatus.ABERTA.value,
            OccurrenceStatus.EM_ANALISE.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nao e permitido alterar {label} da ocorrencia",
            )


def _is_terminal_status(status_value: str) -> bool:
    return status_value in {OccurrenceStatus.FECHADA.value, OccurrenceStatus.CANCELADA.value}


def _validate_occurrence_dates(opened_at: datetime, closed_at: datetime | None) -> None:
    if closed_at and closed_at < opened_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de encerramento nao pode ser anterior a data de abertura",
        )


def _validate_create_occurrence_state(status_value: str, closed_at: datetime | None) -> None:
    if status_value != OccurrenceStatus.ABERTA.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma ocorrencia so pode ser criada com status Aberta",
        )
    if closed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma ocorrencia aberta nao pode ter data de encerramento",
        )


def _validate_status_and_dates(status_value: str, opened_at: datetime, closed_at: datetime | None) -> None:
    _validate_occurrence_dates(opened_at, closed_at)
    if _is_terminal_status(status_value) and closed_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status terminais exigem data de encerramento",
        )


async def create_occurrence(session: AsyncSession, payload: OccurrenceCreate, current_user: User | None) -> Occurrence:
    await _assert_foreign_keys(session, payload.category_id, payload.priority_id)
    data = payload.model_dump()
    data["cpf"] = validate_cpf(payload.cpf)
    data["opened_at"] = data["opened_at"] or datetime.now(UTC)
    _validate_create_occurrence_state(data["status"], data.get("closed_at"))
    _validate_status_and_dates(data["status"], data["opened_at"], data.get("closed_at"))

    entity = Occurrence(**data)
    session.add(entity)
    await session.flush()
    await _register_status_history(session, entity, None, entity.status, current_user.id if current_user else None, "Criacao da ocorrencia")
    await session.commit()
    await session.refresh(entity)
    return entity


async def update_occurrence(session: AsyncSession, entity: Occurrence, payload: OccurrenceUpdate, current_user: User | None) -> Occurrence:
    data = payload.model_dump(exclude_unset=True)
    _assert_immutable_occurrence_fields(entity, data)

    category_before = None
    category_after = None
    priority_before = None
    priority_after = None
    if "category_id" in data or "priority_id" in data:
        await _assert_foreign_keys(
            session,
            data.get("category_id", entity.category_id),
            data.get("priority_id", entity.priority_id),
        )
        category_before = await get_or_404(session, Category, entity.category_id)
        category_after = await get_or_404(session, Category, data.get("category_id", entity.category_id))
        priority_before = await get_or_404(session, Priority, entity.priority_id)
        priority_after = await get_or_404(session, Priority, data.get("priority_id", entity.priority_id))

    if "cpf" in data and data["cpf"] is not None:
        data["cpf"] = validate_cpf(data["cpf"])

    previous_status = entity.status
    next_status = data.get("status", previous_status)
    previous_description = entity.description
    previous_opened_at = entity.opened_at

    if "description" in data and data["description"] != previous_description:
        _assert_description_update_allowed(previous_status)

    _assert_status_transition(previous_status, next_status)

    if "status" in data:
        if _is_terminal_status(next_status) and "closed_at" not in data:
            data["closed_at"] = datetime.now(UTC)
        elif not _is_terminal_status(next_status) and "closed_at" not in data:
            data["closed_at"] = None

    resulting_opened_at = data.get("opened_at", entity.opened_at)
    resulting_closed_at = data.get("closed_at", entity.closed_at)
    _validate_status_and_dates(next_status, resulting_opened_at, resulting_closed_at)

    for field, value in data.items():
        setattr(entity, field, value)

    history_notes: list[str] = []
    if "description" in data and data["description"] != previous_description:
        history_notes.append(_build_description_change_note(previous_description, data["description"]))

    if (
        "category_id" in data
        and category_before is not None
        and category_after is not None
        and category_before.id != category_after.id
    ):
        history_notes.append(_build_change_note("Categoria", category_before.name, category_after.name))

    if (
        "priority_id" in data
        and priority_before is not None
        and priority_after is not None
        and priority_before.id != priority_after.id
    ):
        history_notes.append(_build_change_note("Prioridade", priority_before.name, priority_after.name))

    if "opened_at" in data and data["opened_at"] != previous_opened_at:
        history_notes.append(
            _build_change_note(
                "Data de abertura",
                _format_history_datetime(previous_opened_at),
                _format_history_datetime(data["opened_at"]),
            )
        )

    for note in history_notes:
        await _register_status_history(
            session,
            entity,
            previous_status,
            previous_status,
            current_user.id if current_user else None,
            note,
        )

    if next_status != previous_status:
        await _register_status_history(session, entity, previous_status, next_status, current_user.id if current_user else None)

    await session.commit()
    await session.refresh(entity)
    return entity


async def delete_entity(session: AsyncSession, entity) -> None:
    await session.delete(entity)
    await session.commit()
