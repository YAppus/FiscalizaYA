from collections.abc import Sequence

from fastapi import HTTPException, Query, status
from sqlalchemy import String, cast, func, select


def parse_filters(filtro: list[str] | None = Query(default=None)) -> list[tuple[str, str, str]]:
    if not filtro:
        return []

    parsed: list[tuple[str, str, str]] = []
    for item in filtro:
        parts = item.split(":", 2)
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de filtro invalido: {item}. Use campo:operador:valor",
            )
        parsed.append((parts[0], parts[1], parts[2]))
    return parsed


def apply_filters(query, filters: Sequence[tuple[str, str, str]], allowed_fields: dict[str, object]):
    for field_name, operator, raw_value in filters:
        column = allowed_fields.get(field_name)
        if column is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Nao e permitido filtrar por {field_name}")

        value = raw_value.strip()
        if field_name in {"priority_id", "category_id", "status"} and operator != "eq":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O campo {field_name} aceita apenas o operador eq",
            )
        if field_name in {"cpf", "description"} and operator != "like":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O campo {field_name} aceita apenas o operador like",
            )
        if field_name in {"priority_id", "category_id"}:
            try:
                value = int(value)
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field_name} deve ser um valor inteiro",
                ) from exc
        if operator == "eq":
            query = query.where(column == value)
        elif operator == "neq":
            query = query.where(column != value)
        elif operator == "like":
            query = query.where(cast(column, String).ilike(f"%{value}%"))
        elif operator == "in":
            items = [item.strip() for item in value.split(",") if item.strip()]
            query = query.where(column.in_(items))
        elif operator == "gt":
            query = query.where(column > value)
        elif operator == "gte":
            query = query.where(column >= value)
        elif operator == "lt":
            query = query.where(column < value)
        elif operator == "lte":
            query = query.where(column <= value)
        elif operator == "isnull":
            normalized = value.lower()
            if normalized not in {"true", "false"}:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="isnull aceita apenas true ou false")
            query = query.where(column.is_(None) if normalized == "true" else column.is_not(None))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Operador nao suportado: {operator}")
    return query


async def paginate(session, query, page: int, page_size: int):
    total_query = select(func.count()).select_from(query.order_by(None).subquery())
    total = (await session.execute(total_query)).scalar_one()
    items = (await session.execute(query.offset((page - 1) * page_size).limit(page_size))).scalars().all()
    return items, total
