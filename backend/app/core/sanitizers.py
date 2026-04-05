from html import unescape
from html.parser import HTMLParser


class _TextOnlyHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._ignored_tag_stack: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:  # type: ignore[override]
        normalized_tag = tag.lower()
        if normalized_tag in {"script", "style"}:
            self._ignored_tag_stack.append(normalized_tag)

    def handle_endtag(self, tag: str) -> None:
        normalized_tag = tag.lower()
        if self._ignored_tag_stack and self._ignored_tag_stack[-1] == normalized_tag:
            self._ignored_tag_stack.pop()

    def handle_data(self, data: str) -> None:
        if not self._ignored_tag_stack:
            self._parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if not self._ignored_tag_stack:
            self._parts.append(unescape(f"&{name};"))

    def handle_charref(self, name: str) -> None:
        if not self._ignored_tag_stack:
            self._parts.append(unescape(f"&#{name};"))

    def get_text(self) -> str:
        return "".join(self._parts)


def _strip_html(value: str) -> str:
    parser = _TextOnlyHTMLParser()
    parser.feed(value)
    parser.close()
    return parser.get_text()


def sanitize_text(value: str) -> str:
    text_only = _strip_html(value)
    return " ".join(text_only.strip().split())
