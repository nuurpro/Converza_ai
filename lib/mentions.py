import re

AGENT_MENTIONS = {
    "milo": "milo",
    "sleyz": "sleyz",
    "vea": "vea",
}


def extract_mentions(text: str) -> list[str]:
    """Return unique agent slugs mentioned in text, preserving first-seen order."""
    seen: set[str] = set()
    mentions: list[str] = []

    for raw in re.findall(r"@([A-Za-z][A-Za-z0-9_-]*)", text):
        slug = AGENT_MENTIONS.get(raw.lower())
        if not slug or slug in seen:
            continue
        seen.add(slug)
        mentions.append(slug)

    return mentions
