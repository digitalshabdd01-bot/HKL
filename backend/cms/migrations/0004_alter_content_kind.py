from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0003_content_last_edited_by_content_published_by_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="content",
            name="kind",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("practice", "Weekly practice"),
                    ("talk", "Story / talk"),
                    ("event", "Conference / walk"),
                    ("publication", "HKL Time issue"),
                    ("speaker", "Speaker / director"),
                    ("page", "Website page"),
                    ("notice", "Notice / update"),
                ],
            ),
        ),
    ]
