# Generated by Django 5.0 on 2025-05-20 13:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0002_shoptag_reaction_count"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="shoptag",
            name="reaction_count",
        ),
    ]
