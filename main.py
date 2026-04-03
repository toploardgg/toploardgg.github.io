import os
import re
import secrets
import socket
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, jsonify, render_template, request, redirect

app = Flask(__name__, template_folder=".", static_folder=".", static_url_path="")

DB_PATH = os.path.join(os.path.dirname(__file__), "comments.db")
BANNED_PATH = os.path.join(os.path.dirname(__file__), "banned_ips.txt")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

# ─────────────────────────────────────────
# Security Headers Middleware
# ─────────────────────────────────────────

# Content Security Policy — дозволяємо лише свої ресурси та cdnjs (для Font Awesome)
CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; "
    "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; "
    "font-src 'self' cdnjs.cloudflare.com data:; "
    "img-src 'self' data: https://twemoji.maxcdn.com; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self';"
)

@app.after_request
def apply_security_headers(response):
    # Заборона вбудовування у фрейми (clickjacking)
    response.headers["X-Frame-Options"] = "DENY"

    # Заборона MIME-sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # HSTS — примусовий HTTPS на 1 рік (вмикати тільки якщо є SSL!)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )

    # Content Security Policy
    response.headers["Content-Security-Policy"] = CSP

    # Заборона відправки Referer на інші домени
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Заборона доступу до функцій браузера (геолокація, мікрофон і т.д.)
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=(), payment=()"
    )

    # Додатковий захист від XSS (старі браузери)
    response.headers["X-XSS-Protection"] = "1; mode=block"

    return response


# ─────────────────────────────────────────
# HTTP → HTTPS Redirect
# ─────────────────────────────────────────

@app.before_request
def redirect_http_to_https():
    """
    Перенаправляє HTTP → HTTPS на продакшні.
    Визначається за заголовком X-Forwarded-Proto (nginx/proxy).
    На localhost (127.0.0.1 / ::1) редирект не виконується.
    """
    proto = request.headers.get("X-Forwarded-Proto", "")
    host  = request.host.split(":")[0]
    local = host in ("localhost", "127.0.0.1", "::1")
    if not local and proto == "http":
        url = request.url.replace("http://", "https://", 1)
        return redirect(url, code=301)


# ─────────────────────────────────────────
# Rate Limiting (3 коментарі на місяць з IP)
# ─────────────────────────────────────────

def get_monthly_comment_count(conn, ip: str) -> int:
    """Підраховує кількість коментарів з IP за поточний місяць."""
    month_start = datetime.utcnow().strftime("%Y-%m-01T00:00:00")
    row = conn.execute(
        "SELECT COUNT(*) FROM comments WHERE ip = ? AND created_at >= ?",
        (ip, month_start),
    ).fetchone()
    return row[0] if row else 0


# ─────────────────────────────────────────
# Input Sanitization
# ─────────────────────────────────────────

# Шаблони SQL-ін'єкцій — детектуємо та блокуємо
SQL_INJECTION_RE = re.compile(
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b"
    r"|--|;|\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)",
    re.IGNORECASE,
)

# Шаблони XSS
XSS_RE = re.compile(
    r"<\s*(script|iframe|object|embed|link|meta|svg|img\s[^>]*on\w+)[^>]*>",
    re.IGNORECASE,
)


def sanitize_text(value: str, max_len: int = 1000) -> str:
    """Обрізає рядок, видаляє нульові байти та перевіряє на атаки."""
    value = value[:max_len].replace("\x00", "").strip()
    if SQL_INJECTION_RE.search(value):
        raise ValueError("Suspicious SQL pattern detected.")
    if XSS_RE.search(value):
        raise ValueError("Suspicious HTML/script content detected.")
    return value


def validate_photo(photo_data) -> str | None:
    """Перевіряє, що фото — це Base64 PNG або JPG, не більше 10 МБ."""
    if not photo_data:
        return None
    if not isinstance(photo_data, str):
        raise ValueError("Invalid photo format.")
    if not photo_data.startswith(("data:image/png;base64,", "data:image/jpeg;base64,")):
        raise ValueError("Only PNG and JPG images are allowed.")
    # Перевірка розміру (Base64 → ~75% від оригіналу)
    raw_b64 = photo_data.split(",", 1)[-1]
    approx_bytes = len(raw_b64) * 0.75
    if approx_bytes > 10 * 1024 * 1024:
        raise ValueError("Image must be under 10 MB.")
    return photo_data


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def load_banned_ips() -> set:
    if not os.path.exists(BANNED_PATH):
        return set()
    with open(BANNED_PATH) as f:
        return {line.strip() for line in f if line.strip()}


def email_domain_exists(email: str) -> bool:
    try:
        domain = email.strip().split("@")[1].lower()
        if not domain or "." not in domain:
            return False
        socket.setdefaulttimeout(5)
        socket.getaddrinfo(domain, None)
        return True
    except Exception:
        return False


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Вмикаємо WAL-режим та обмеження цілісності
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    NOT NULL CHECK(length(name) <= 60),
                email        TEXT    NOT NULL CHECK(length(email) <= 120),
                text         TEXT    NOT NULL CHECK(length(text) <= 1000),
                photo        TEXT,
                created_at   TEXT    NOT NULL,
                delete_token TEXT    NOT NULL,
                ip           TEXT
            )
        """)
        conn.commit()


def init_stats_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS line_counts (
                lang TEXT PRIMARY KEY,
                lines INTEGER,
                updated_at TEXT
            )
        """)
        conn.commit()


def count_and_save():
    exts = {".html": "HTML", ".css": "CSS", ".js": "JavaScript", ".py": "Python"}
    totals = {}
    base = os.path.dirname(__file__)
    for fname in os.listdir(base):
        ext = os.path.splitext(fname)[1].lower()
        if ext in exts:
            lang = exts[ext]
            try:
                with open(os.path.join(base, fname), encoding="utf-8") as f:
                    totals[lang] = totals.get(lang, 0) + sum(1 for _ in f)
            except Exception:
                pass
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        for lang, lines in totals.items():
            conn.execute(
                "INSERT INTO line_counts (lang, lines, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(lang) DO UPDATE SET lines=excluded.lines, updated_at=excluded.updated_at",
                (lang, lines, now),
            )
        conn.commit()


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────

@app.route("/api/stats")
def get_stats():
    with get_db() as conn:
        # Параметризований запит — захист від SQL-ін'єкцій
        rows = conn.execute("SELECT lang, lines FROM line_counts").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/comments", methods=["GET"])
def get_comments():
    with get_db() as conn:
        # Параметризований запит — email НЕ повертається клієнту (приватність)
        rows = conn.execute(
            "SELECT id, name, email, text, photo, created_at "
            "FROM comments ORDER BY created_at DESC LIMIT 200"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/validate-email", methods=["POST"])
def validate_email_route():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()[:120]

    if not EMAIL_RE.match(email):
        return jsonify({"valid": False, "reason": "Invalid email format."})

    if email_domain_exists(email):
        return jsonify({"valid": True})

    domain = email.split("@")[1] if "@" in email else email
    return jsonify({
        "valid": False,
        "reason": f"The domain '{domain}' does not exist. Check your email.",
    })


@app.route("/api/comments", methods=["POST"])
def post_comment():
    data = request.get_json(silent=True) or {}
    ip = request.headers.get("X-Forwarded-For", request.remote_addr).split(",")[0].strip()

    # ── Перевірка бану ──
    if ip in load_banned_ips():
        return jsonify({"error": "You are banned from posting comments."}), 403

    # ── Санітизація та валідація вхідних даних ──
    try:
        name  = sanitize_text((data.get("name")  or ""), max_len=60)
        email = sanitize_text((data.get("email") or ""), max_len=120)
        text  = sanitize_text((data.get("text")  or ""), max_len=1000)
        photo = validate_photo(data.get("photo"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not name or not email or not text:
        return jsonify({"error": "Missing fields."}), 400

    if not EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email address."}), 400

    if not email_domain_exists(email):
        domain = email.split("@")[1] if "@" in email else email
        return jsonify({
            "error": f"The domain '{domain}' does not exist. Check your email."
        }), 400

    with get_db() as conn:
        # ── Rate limit: 3 коментарі на місяць з одного IP ──
        if get_monthly_comment_count(conn, ip) >= 3:
            return jsonify({
                "error": "Monthly comment limit reached. Try again next month."
            }), 429

        now = datetime.utcnow()
        delete_token = secrets.token_urlsafe(40)
        created_at = now.isoformat()

        # ── Параметризований INSERT — повний захист від SQL-ін'єкцій ──
        cursor = conn.execute(
            "INSERT INTO comments (name, email, text, photo, created_at, delete_token, ip) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, email, text, photo, created_at, delete_token, ip),
        )
        conn.commit()
        comment_id = cursor.lastrowid

    return jsonify({
        "id":           comment_id,
        "name":         name,
        "email":        email,
        "text":         text,
        "photo":        photo,
        "created_at":   created_at,
        "delete_token": delete_token,
    }), 201


@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    token = (
        request.args.get("token")
        or (request.get_json(silent=True) or {}).get("token")
    )

    if not token or not isinstance(token, str) or len(token) > 200:
        return jsonify({"error": "Invalid token."}), 400

    with get_db() as conn:
        # Параметризований SELECT — захист від SQL-ін'єкцій
        row = conn.execute(
            "SELECT delete_token FROM comments WHERE id = ?",
            (comment_id,),
        ).fetchone()

        if not row:
            return jsonify({"error": "Not found."}), 404

        # Порівняння токенів через secrets.compare_digest (захист від timing attack)
        if not secrets.compare_digest(row["delete_token"], token):
            return jsonify({"error": "Forbidden."}), 403

        conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
        conn.commit()

    return jsonify({"success": True})


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file("404.html"), 404


@app.errorhandler(429)
def rate_limited(e):
    return jsonify({"error": "Too many requests."}), 429


if __name__ == "__main__":
    init_db()
    init_stats_db()
    count_and_save()
    app.run(host="0.0.0.0", port=80, debug=False)