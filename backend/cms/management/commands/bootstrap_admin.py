import os
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = "Create the first superuser from private environment variables; never replace existing accounts."
    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("An administrator already exists; no account changes made.")
            return
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")
        if not all([username, email, password]):
            raise CommandError("Set all three DJANGO_SUPERUSER_* environment variables privately before bootstrapping.")
        if User.objects.filter(username=username).exists():
            raise CommandError("That username already exists. No permissions or passwords were changed.")
        user = User(username=username, email=email, is_staff=True, is_superuser=True)
        try:
            user.full_clean(exclude=["password"])
            validate_password(password, user)
        except ValidationError:
            # Never echo submitted credentials or validator input in deploy logs.
            raise CommandError("Administrator details failed validation. Use a valid username/email and a strong password.")
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS("Initial administrator created. Remove bootstrap credentials from the service environment."))
