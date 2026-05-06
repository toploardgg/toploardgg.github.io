"""
Centralised input-validation helpers.

Defence layers:
  1. Regex allow-list / block-list (SQL patterns, XSS tags)
  2. Django's ORM parameterised queries (never string-format SQL)
  3. MaxLength / format constraints enforced at the ORM level too
  4. Constant-time token comparison in the delete view (secrets.compare_digest)
"""
from __future__ import annotations

import re

from django.conf import settings
from django.core.exceptions import ValidationError

# ─── SQL injection detector ───────────────────────────────────────────────────
# Looks for known dangerous SQL keywords and punctuation.
# The ORM already prevents injection, but we surface bad input early.
_SQL_INJECTION_RE = re.compile(
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b"
    r"|--|;|\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)",
    re.IGNORECASE,
)

# ─── XSS pattern detector ─────────────────────────────────────────────────────
_XSS_RE = re.compile(
    r"<\s*(script|iframe|object|embed|link|meta|svg|img\s[^>]*on\w+)[^>]*>",
    re.IGNORECASE,
)

# ─── Email format ─────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def sanitize_text(value: str, *, max_len: int = 1000, field: str = "field") -> str:
    """
    Strip null bytes, truncate, and reject obvious attack payloads.
    Raises ValidationError (→ HTTP 400) on suspicious input.
    """
    if not isinstance(value, str):
        raise ValidationError(f"{field}: must be a string.")

    value = value[:max_len].replace("\x00", "").strip()

    if _SQL_INJECTION_RE.search(value):
        raise ValidationError(f"{field}: suspicious SQL pattern detected.")
    if _XSS_RE.search(value):
        raise ValidationError(f"{field}: suspicious HTML/script content detected.")

    return value


def validate_email_format(email: str) -> None:
    """Raises ValidationError if the email address format is wrong."""
    if not _EMAIL_RE.match(email):
        raise ValidationError("Invalid email address format.")


def validate_photo(photo_data) -> str | None:
    """
    Validates a base64-encoded image data-URI.
    Only PNG and JPEG accepted; size limit from settings.MAX_IMAGE_BYTES.
    """
    if not photo_data:
        return None
    if not isinstance(photo_data, str):
        raise ValidationError("Invalid photo format.")
    if not photo_data.startswith(("data:image/png;base64,", "data:image/jpeg;base64,")):
        raise ValidationError("Only PNG and JPG images are allowed.")

    raw_b64 = photo_data.split(",", 1)[-1]
    approx_bytes = len(raw_b64) * 0.75
    limit = getattr(settings, "MAX_IMAGE_BYTES", 10 * 1024 * 1024)
    if approx_bytes > limit:
        raise ValidationError(f"Image must be under {limit // 1_048_576} MB.")

    return photo_data
