"""
ORM models.
Django's ORM uses parameterised queries by default — no raw SQL injection risk.
"""
from django.db import models
from django.core.validators import MaxLengthValidator


class Comment(models.Model):
    name         = models.CharField(max_length=60)
    email        = models.EmailField(max_length=120)
    text         = models.TextField(validators=[MaxLengthValidator(1000)])
    photo        = models.TextField(blank=True, null=True)   # base64 data-URI
    created_at   = models.DateTimeField(auto_now_add=True)
    delete_token = models.CharField(max_length=200)
    ip           = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        app_label = "api"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ip", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Comment #{self.pk} by {self.name}"


class LineCount(models.Model):
    lang       = models.CharField(max_length=50, unique=True)
    lines      = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "api"

    def __str__(self):
        return f"{self.lang}: {self.lines} lines"

class BlogLike(models.Model):
    ip = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("ip",)
