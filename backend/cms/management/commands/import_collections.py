import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from cms.models import Content

ROOT = Path(__file__).resolve().parents[4]

class Command(BaseCommand):
    help = "Import conference/profile/publication drafts for review; preserve existing administrator edits."
    def add_arguments(self, parser):
        parser.add_argument("--library", type=Path, default=ROOT / "content/hkl-libraries.json")
        parser.add_argument("--catalog", type=Path, default=ROOT / "content/hkl-source-en.json")
    @transaction.atomic
    def handle(self, *args, **options):
        library = json.loads(options["library"].read_text(encoding="utf-8"))
        catalog = json.loads(options["catalog"].read_text(encoding="utf-8"))
        assets = json.loads((ROOT / "content/hkl-assets.json").read_text(encoding="utf-8"))
        reverse_assets = {value: key for key, value in assets.items()}
        pages = {page["path"]: page for page in catalog.get("pages", [])}
        created = 0
        for section, kind in [("profiles", "speaker"), ("conferences", "event")]:
            for order, item in enumerate(library.get(section, [])):
                page = pages.get(item["path"], {})
                body = "\n\n".join(block.get("text", "") for block in page.get("blocks", []) if block.get("kind") in ["p", "h2", "h3", "li"] and block.get("text") != item["title"])
                image = item.get("image", "")
                if image.startswith("/"):
                    image = reverse_assets.get(image, "")
                defaults = {"title": item["title"], "summary": item.get("description", ""), "body": body, "image_url": image, "sort_order": order, "resource_url": "https://hkl.org" + item["path"], "profile_role": "director" if item["path"].startswith("/board-of-directors/") else "speaker"}
                _, added = Content.objects.get_or_create(kind=kind, slug=slugify(item["path"].strip("/").replace("/", "-")), language="en", defaults=defaults)
                created += added
        publication = pages.get("/the-hkl-time", {})
        for block in publication.get("blocks", []):
            match = re.search(r"Issue\s*#\s*(\d+)", block.get("text", ""), re.I)
            link = re.search(r'href="([^"]+)"', block.get("html", ""))
            if not match or not link:
                continue
            url = html.unescape(link.group(1))
            if urlparse(url).hostname != "covver.com":
                continue
            number = int(match.group(1))
            _, added = Content.objects.get_or_create(kind="publication", slug=f"the-hkl-time-vol-1-issue-{number}", language="en", defaults={"title": block["text"], "issue_number": number, "resource_url": url, "sort_order": 1000 - number})
            created += added
        self.stdout.write(self.style.SUCCESS(f"Imported {created} collection drafts. Review event dates and publication links before publishing. Existing records were preserved."))
