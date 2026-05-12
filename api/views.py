from __future__ import annotations
import json
import logging
import os
import secrets
import socket

from api.models import Comment, LineCount
from api.validators import sanitize_text, validate_email_format, validate_photo
from datetime import datetime, timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils import timezone as dj_timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

logger = logging.getLogger("api")


# ====================== HELPERS ======================
def _get_client_ip(request):
    """Безпечне отримання IP"""
    from middleware import _get_client_ip as _mw_ip
    return _mw_ip(request)


def _parse_json(request):
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, ValueError):
        return {}


def _email_domain_exists(email):
    try:
        domain = email.strip().split("@")[1].lower()
        if not domain or "." not in domain:
            return False
        socket.setdefaulttimeout(5)
        socket.getaddrinfo(domain, None)
        return True
    except Exception:
        return False


def _monthly_comment_count(ip):
    now = dj_timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return Comment.objects.filter(ip=ip, created_at__gte=month_start).count()


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    masked_local = local[0] + "***" if local else "***"
    return f"{masked_local}@{domain}"


# ====================== HTML PAGES ======================
@ensure_csrf_cookie
def home(request):
    return render(request, "index.html")


@ensure_csrf_cookie
def about(request):
    return render(request, "about.html")


@ensure_csrf_cookie
def stats(request):
    return render(request, "stats.html")


def config(request):
    return render(request, "config.html")


# ====================== API ======================
@csrf_exempt
@require_http_methods(["GET"])
def get_stats(request):
    rows = list(LineCount.objects.values("lang", "lines"))
    return JsonResponse(rows, safe=False)


@csrf_exempt
@require_http_methods(["GET"])
def get_comments(request):
    qs = Comment.objects.values(
        "id", "name", "email", "text", "photo", "created_at"
    ).order_by("-created_at")[:200]

    data = []
    for row in qs:
        data.append({
            **row,
            "email": _mask_email(row["email"]),
            "created_at": row["created_at"].isoformat(),
        })
    return JsonResponse(data, safe=False)


# Email validation
@csrf_exempt
@require_http_methods(["POST"])
def validate_email(request):
    data = _parse_json(request)
    email = str(data.get("email") or "").strip()[:120]

    try:
        validate_email_format(email)
    except ValidationError as exc:
        return JsonResponse({"valid": False, "reason": exc.message})

    if _email_domain_exists(email):
        return JsonResponse({"valid": True})

    domain = email.split("@")[1] if "@" in email else email
    return JsonResponse({
        "valid": False,
        "reason": f"The domain '{domain}' does not exist."
    })


# Comments - main endpoint
@csrf_exempt
@require_http_methods(["GET", "POST"])
def comments(request):
    if request.method == "GET":
        return get_comments(request)
    elif request.method == "POST":
        return _post_comment(request)


def _post_comment(request):
    data = _parse_json(request)
    ip = _get_client_ip(request)

    try:
        name = sanitize_text(str(data.get("name") or ""), max_len=60, field="name")
        email = sanitize_text(str(data.get("email") or ""), max_len=120, field="email")
        text = sanitize_text(str(data.get("text") or ""), max_len=1000, field="text")
        photo = validate_photo(data.get("photo"))
    except ValidationError as exc:
        return JsonResponse({"error": exc.message}, status=400)

    if not name or not email or not text:
        return JsonResponse({"error": "Missing required fields."}, status=400)

    try:
        validate_email_format(email)
    except ValidationError as exc:
        return JsonResponse({"error": exc.message}, status=400)

    if not _email_domain_exists(email):
        domain = email.split("@")[1] if "@" in email else email
        return JsonResponse({"error": f"The domain '{domain}' does not exist."}, status=400)

    if _monthly_comment_count(ip) >= getattr(settings, "MONTHLY_COMMENT_LIMIT", 3):
        return JsonResponse({"error": "Monthly comment limit reached. Try again next month."}, status=429)

    delete_token = secrets.token_urlsafe(40)

    comment = Comment.objects.create(
        name=name,
        email=email,
        text=text,
        photo=photo,
        delete_token=delete_token,
        ip=ip,
    )

    logger.info(f"New comment #{comment.pk} from IP {ip}")

    return JsonResponse({
        "id": comment.pk,
        "name": comment.name,
        "email": _mask_email(comment.email),
        "text": comment.text,
        "photo": comment.photo,
        "created_at": comment.created_at.isoformat(),
        "delete_token": delete_token,
    }, status=201)


# Delete comment
@csrf_exempt
@require_http_methods(["DELETE"])
def delete_comment(request, comment_id: int):
    token = request.GET.get("token") or _parse_json(request).get("token") or ""

    if not token or len(token) > 200:
        return JsonResponse({"error": "Invalid token."}, status=400)

    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return JsonResponse({"error": "Not found."}, status=404)

    if not secrets.compare_digest(comment.delete_token, token):
        logger.warning(f"Bad delete token for comment #{comment_id}")
        return JsonResponse({"error": "Forbidden."}, status=403)

    comment.delete()
    logger.info(f"Comment #{comment_id} deleted.")
    return JsonResponse({"success": True})


# Blog likes
@csrf_exempt
@require_http_methods(["GET", "POST", "DELETE"])
def blog_likes(request):
    from api.models import BlogLike
    ip = _get_client_ip(request)

    if request.method == "GET":
        count = BlogLike.objects.count()
        liked = BlogLike.objects.filter(ip=ip).exists()
        return JsonResponse({"count": count, "liked": liked})

    if request.method == "POST":
        if BlogLike.objects.filter(ip=ip).exists():
            return JsonResponse({"error": "Already liked."}, status=400)
        BlogLike.objects.create(ip=ip)
        return JsonResponse({"count": BlogLike.objects.count(), "liked": True})

    if request.method == "DELETE":
        BlogLike.objects.filter(ip=ip).delete()
        return JsonResponse({"count": BlogLike.objects.count(), "liked": False})
    # ====================== ERROR HANDLERS ======================
def handler404(request, exception=None):
    try:
        return render(request, "404.html", status=404)
    except Exception:
        return HttpResponse("Page not found.", status=404)


def handler429(request, exception=None):
    return JsonResponse({"error": "Too many requests."}, status=429)