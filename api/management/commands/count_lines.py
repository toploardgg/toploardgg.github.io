from django.core.management.base import BaseCommand
from api.views import count_and_save

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        count_and_save()