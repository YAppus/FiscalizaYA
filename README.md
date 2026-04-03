# FiscalizaYA

Sistema de Controle de Ocorrencias Municipais.

## Visao Geral

Base full stack com:

- Backend em FastAPI
- Frontend em React 19 + TypeScript + MUI 7
- PostgreSQL
- Autenticacao JWT com login, logout e refresh token
- Rate limiting nos endpoints de autenticacao
- Validacao e sanitizacao no backend

## Estrutura

```text
backend/   API FastAPI com SQLAlchemy async
frontend/  App Vite + React 19 + MUI 7
```

## Subir com Docker

```bash
docker compose up --build
```

## Subir localmente

### Backend

```bash
cd backend
copy .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Endpoints principais

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/categories`
- `GET /api/v1/priorities`
- `GET /api/v1/occurrences`
- `GET /api/v1/history`
- `GET /api/v1/health`

## Filtros e paginacao

```text
GET /api/v1/occurrences?page=1&page_size=20&filtro=status:eq:Aberta&filtro=priority_id:eq:1
```

## Regras de status

```text
Aberta -> Em Analise -> Em Andamento -> Resolvida -> Fechada
```

Cancelamento so e permitido a partir de `Aberta`, e cada mudanca de status gera um registro automatico em `Historico`.

## Frontend

- Login com React Hook Form + Zod
- Dashboard com contadores por status
- CRUD de ocorrencias com MUI DataGrid em paginacao server-side
- Dialogo de criacao e edicao validado
- Historico lateral por ocorrencia
- Tokens em `sessionStorage`, nunca em URL
