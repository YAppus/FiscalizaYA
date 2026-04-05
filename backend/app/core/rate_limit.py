from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings


_ATTEMPTS: dict[str, deque[datetime]] = defaultdict(deque)


def _clean_attempts(bucket: deque[datetime], window_seconds: int, now: datetime) -> None:
    threshold = now - timedelta(seconds=window_seconds)
    while bucket and bucket[0] < threshold:
        bucket.popleft()


def auth_rate_limit(request: Request) -> None:
    now = datetime.now(UTC)
    identifier = request.client.host if request.client else "unknown"
    bucket = _ATTEMPTS[f"{request.url.path}:{identifier}"]
    _clean_attempts(bucket, settings.auth_rate_limit_window_seconds, now)

    if len(bucket) >= settings.auth_rate_limit_max_attempts:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Muitas tentativas. Tente novamente mais tarde.")

    bucket.append(now)


AuthRateLimit = Depends(auth_rate_limit)
