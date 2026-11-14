import json
from datetime import datetime, time
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from cms.models import Content

class Command(BaseCommand):
    help = "Import existing practices and talks as drafts; never overwrite administrator edits."
    def add_arguments(self, parser):
        parser.add_argument("--file", type=Path, default=Path(__file__).resolve().parents[4] / "content" / "hkl-libraries.json")
    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(options["file"].read_text(encoding="utf-8"))
        created = 0
        for section, kind in [("practices", "practice"), ("talks", "talk")]:
            for index, item in enumerate(data.get(section, [])):
                image = item.get("image", "")
                if image.startswith("/"):
                    image = ""  # Do not save broken relative image URLs on the separate API host.
                defaults = {"title": item["title"], "summary": item.get("summary", ""), "body": item.get("body") or "\n\n".join(item.get("paragraphs", [])), "image_url": image, "video_url": "https://www.youtube.com/watch?v=" + item["video"] if item.get("video") else "", "sort_order": index, "episode": item.get("episode")}
                if item.get("isoDate"):
                    defaults["publish_at"] = timezone.make_aware(datetime.combine(datetime.fromisoformat(item["isoDate"]).date(), time.min))
                _, added = Content.objects.get_or_create(kind=kind, slug=item["slug"], language="en", defaults=defaults)
                created += added
        self.stdout.write(self.style.SUCCESS(f"Imported {created} drafts. Existing content was preserved."))
