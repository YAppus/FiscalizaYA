from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.base import Base
from app.models.category import Category


engine = create_async_engine(settings.database_url, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def seed_reference_data() -> None:
    default_categories = [
        ("Reclamacao", "Registro de reclamacoes de cidadaos"),
        ("Denuncia", "Registro de denuncias encaminhadas"),
        ("Solicitacao", "Registro de solicitacoes e pedidos de atendimento"),
    ]

    async with SessionLocal() as session:
        result = await session.execute(select(Category.name))
        existing_names = {name for name in result.scalars().all()}

        for name, description in default_categories:
            if name not in existing_names:
                session.add(Category(name=name, description=description))

        await session.commit()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await seed_reference_data()
    yield
