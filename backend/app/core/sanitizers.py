def sanitize_text(value: str) -> str:
    return " ".join(value.strip().split())
