"""
Django settings — production-hardened configuration.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


# ─── Core ─────────────────────────────────────────────────────────────────────
SECRET_KEY = "django-insecure-dev-key"
if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(50))\""
    )

DEBUG = os.environ.get("DJANGO_DEBUG", "false").strip().lower() == "true"

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '::1',
    '176.105.206.143',
    'toploardgg.duckdns.org',
]

ROOT_URLCONF = "urls"
WSGI_APPLICATION = "wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Apps ─────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "api.apps.ApiConfig",
]

# ─── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
   # "middleware.HttpsRedirectMiddleware",
    "middleware.SecurityHeadersMiddleware",
    "middleware.BannedIpMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "middleware.RateLimitMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": False,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.template.context_processors.csrf",
            ],
            "autoescape": True,
        },
    },
]

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "comments.db",
        "CONN_MAX_AGE": 60,
    }
}

# ─── Static files ─────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# ─── Security settings (auto-switched by DEBUG) ───────────────────────────────
USE_X_FORWARDED_HOST = True

# Кількість довірених проксі перед Django (1 = Cloudflare або 1 nginx)
# Використовується в middleware._get_client_ip() проти IP spoofing.
NUM_PROXIES = int(os.environ.get("NUM_PROXIES", "1"))

if DEBUG:
    SECURE_PROXY_SSL_HEADER = None
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
else:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") # ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = True  # False — щоб JS міг читати токен
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
CSRF_TRUSTED_ORIGINS = [
    'https://toploardgg.duckdns.org',
    'http://toploardgg.duckdns.org',
]

CSRF_TRUSTED_ORIGINS.append('https://176.105.206.143')

# ─── Logging ──────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
        "security_file": {
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "security.log",
            "formatter": "verbose",
            "level": "WARNING",
        },
    },
    "loggers": {
        "django.security": {
            "handlers": ["console", "security_file"],
            "level": "WARNING",
            "propagate": False,
        },
        "api": {
            "handlers": ["console", "security_file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# ─── Internationalisation ─────────────────────────────────────────────────────
LANGUAGE_CODE = "uk"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

# ─── App-specific constants ───────────────────────────────────────────────────
BANNED_IPS_FILE = BASE_DIR / "banned_ips.txt"
MONTHLY_COMMENT_LIMIT = 3
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
