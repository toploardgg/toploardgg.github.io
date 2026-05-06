"""
WSGI entry point.
Run with: gunicorn wsgi:application -w 4 -b 0.0.0.0:8000
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
