"""
Custom middleware stack:
  1. HttpsRedirectMiddleware  — HTTP → HTTPS (production only)
  2. SecurityHeadersMiddleware — CSP, HSTS, X-* headers
  3. BannedIpMiddleware        — block IPs listed in banned_ips.txt
  4. RateLimitMiddleware       — per-IP request throttle (in-memory, thread-safe)
"""
from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict

from django.conf import settings
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect


logger = logging.getLogger("api")

# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _get_client_ip(request) -> str:
    """
    Повертає реальний IP клієнта безпечно.

    Довіряємо лише NUM_PROXIES останнім IP у X-Forwarded-For.
    Це захищає від підробки IP (spoofing) через XFF-заголовок.
    Якщо NUM_PROXIES=1 (Cloudflare/nginx), беремо передостанній IP у ланцюгу.
    """
    num_proxies = getattr(settings, "NUM_PROXIES", 1)
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")

    if xff and num_proxies > 0:
        ips = [ip.strip() for ip in xff.split(",") if ip.strip()]
        # Якщо клієнт надіслав підроблений XFF, реальний proxy дописує свій запис
        # в кінець. Наш довірений проксі додав останній запис — це і є реальний IP.
        # Беремо IP на позиції -(num_proxies) від кінця.
        index = len(ips) - num_proxies
        if index >= 0:
            return ips[index]

    return request.META.get("REMOTE_ADDR", "")


# ─────────────────────────────────────────────────────────────────────────────
# 1. HTTP → HTTPS
# ─────────────────────────────────────────────────────────────────────────────
#class HttpsRedirectMiddleware:
#    """
#    Redirects plain HTTP to HTTPS on production.
#    Skips redirect for localhost / 127.0.0.1 / ::1 and when DEBUG=True.
#    """
#    LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}
#
#    def __init__(self, get_response):
#        self.get_response = get_response
#
#    def __call__(self, request):
#        host = request.get_host().split(":")[0]
#        proto = request.META.get("HTTP_X_FORWARDED_PROTO", "")
#
#        # Використовуємо settings.DEBUG (а не голий DEBUG — це була помилка)
#        if host in self.LOCAL_HOSTS or settings.DEBUG:
#            return self.get_response(request)
#
#        if proto == "http":
#            secure_url = request.build_absolute_uri().replace("http://", "https://", 1)
#            return redirect(secure_url, permanent=True)
#
#        return self.get_response(request)
#

# ─────────────────────────────────────────────────────────────────────────────
# 2. Security Headers
# ─────────────────────────────────────────────────────────────────────────────

_CSP = (
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


class SecurityHeadersMiddleware:
    """Injects security-related HTTP response headers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Frame-Options"] = "DENY"
        response["X-Content-Type-Options"] = "nosniff"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
        response["Content-Security-Policy"] = _CSP

        # HSTS лише на продакшні (на HTTP цей заголовок не має сенсу)
        if not settings.DEBUG:
            response["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Не кешувати API-відповіді
        if request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store"

        return response


# ─────────────────────────────────────────────────────────────────────────────
# 3. IP Ban
# ─────────────────────────────────────────────────────────────────────────────

class BannedIpMiddleware:
    """
    Blocks IPs listed in BANNED_IPS_FILE.
    The list is cached for 60 s to avoid constant disk I/O.
    """

    _cache: set[str] = set()
    _last_load: float = 0.0
    _ttl: float = 60.0
    _lock = threading.Lock()

    def __init__(self, get_response):
        self.get_response = get_response

    @classmethod
    def _get_banned_ips(cls) -> set[str]:
        now = time.monotonic()
        if now - cls._last_load < cls._ttl:
            return cls._cache
        with cls._lock:
            if now - cls._last_load < cls._ttl:
                return cls._cache
            path = getattr(settings, "BANNED_IPS_FILE", None)
            if path and path.exists():
                with open(path) as fh:
                    cls._cache = {ln.strip() for ln in fh if ln.strip()}
            else:
                cls._cache = set()
            cls._last_load = now
        return cls._cache

    def __call__(self, request):
        ip = _get_client_ip(request)
        if ip in self._get_banned_ips():
            logger.warning("Blocked banned IP: %s", ip)
            return JsonResponse({"error": "You are banned from posting comments."}, status=403)
        return self.get_response(request)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Rate Limiting
# ─────────────────────────────────────────────────────────────────────────────

class RateLimitMiddleware:
    """
    Simple sliding-window rate limiter stored in-memory.
    Defaults: 60 requests / 60 seconds per IP.
    """

    WINDOW = 60
    MAX_REQUESTS = 60

    _hits: dict[str, list[float]] = defaultdict(list)
    _lock = threading.Lock()

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = _get_client_ip(request)
        now = time.monotonic()

        with self._lock:
            cutoff = now - self.WINDOW
            self._hits[ip] = [t for t in self._hits[ip] if t > cutoff]
            if len(self._hits[ip]) >= self.MAX_REQUESTS:
                logger.warning("Rate limit exceeded for IP: %s", ip)
                return JsonResponse({"error": "Too many requests."}, status=429)
            self._hits[ip].append(now)

        return self.get_response(request)
