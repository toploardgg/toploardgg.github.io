#!/usr/bin/env python
"""Django management utility."""
import os
from dotenv import load_dotenv
import sys

load_dotenv()

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Django is not installed. Run: pip install django"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
