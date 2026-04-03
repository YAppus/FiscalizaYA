# Backend

## Run

```bash
uv sync
uv run uvicorn app.main:app --reload
```

The API expects a PostgreSQL database configured through `.env`.

## Resources

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/categories`
- `GET /api/v1/priorities`
- `GET /api/v1/occurrences`
- `GET /api/v1/history`

## Pagination and filters

Use `page` and `page_size`, plus one or more `filtro` params:

```text
GET /api/v1/occurrences?page=1&page_size=20&filtro=status:eq:Aberta&filtro=cpf:eq:12345678909
```
