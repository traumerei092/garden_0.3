# Generated by Django 5.0 on 2025-05-20 05:27

import django.db.models.deletion
import shops.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DrinkCategory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name="RelationType",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                ("label", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("sort_order", models.IntegerField(default=0)),
                ("color", models.CharField(blank=True, max_length=10)),
            ],
        ),
        migrations.CreateModel(
            name="ShopLayout",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name="ShopOption",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name="ShopType",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name="Shop",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("zip_code", models.CharField(blank=True, max_length=10, null=True)),
                ("address", models.CharField(max_length=255)),
                ("prefecture", models.CharField(blank=True, max_length=100, null=True)),
                ("city", models.CharField(blank=True, max_length=100, null=True)),
                ("street", models.CharField(blank=True, max_length=100, null=True)),
                ("building", models.CharField(blank=True, max_length=100, null=True)),
                ("area", models.CharField(blank=True, max_length=100, null=True)),
                ("capacity", models.IntegerField(blank=True, default=0, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("latitude", models.FloatField(blank=True, null=True)),
                ("longitude", models.FloatField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_shops",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "shop_layouts",
                    models.ManyToManyField(blank=True, to="shops.shoplayout"),
                ),
                (
                    "shop_options",
                    models.ManyToManyField(blank=True, to="shops.shopoption"),
                ),
                ("shop_types", models.ManyToManyField(blank=True, to="shops.shoptype")),
            ],
            options={
                "db_table": "shops",
                "ordering": ["created_at"],
                "unique_together": {("name", "address")},
            },
        ),
        migrations.CreateModel(
            name="ShopDrink",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                (
                    "category",
                    models.ForeignKey(
                        default=shops.models.get_default_category,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="drinks",
                        to="shops.drinkcategory",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopImage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "image",
                    models.ImageField(blank=True, null=True, upload_to="shop_images/"),
                ),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("is_icon", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="shops.shop",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopMessage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="shops.shop"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopReview",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("comment", models.TextField()),
                ("rating", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="shops.shop"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopReviewReaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("reaction_type", models.CharField(max_length=10)),
                ("reacted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "shop_review",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="shops.shopreview",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopStaff",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("role", models.CharField(max_length=100)),
                ("message", models.TextField(blank=True)),
                (
                    "image",
                    models.ImageField(blank=True, null=True, upload_to="staff_photos/"),
                ),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="shops.shop"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopTag",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("value", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_tags",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tags",
                        to="shops.shop",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "unique_together": {("shop", "value")},
            },
        ),
        migrations.CreateModel(
            name="ShopUpdateLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("updated_column", models.CharField(max_length=100)),
                ("old_value", models.TextField()),
                ("new_value", models.TextField()),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="shops.shop"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ShopUpdateReaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("reaction_type", models.CharField(max_length=10)),
                (
                    "shop_update_log",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="shops.shopupdatelog",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="UserShopRelation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "relation_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="shops.relationtype",
                    ),
                ),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="shops.shop"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="BusinessHour",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "weekday",
                    models.CharField(
                        choices=[
                            ("mon", "月曜日"),
                            ("tue", "火曜日"),
                            ("wed", "水曜日"),
                            ("thu", "木曜日"),
                            ("fri", "金曜日"),
                            ("sat", "土曜日"),
                            ("sun", "日曜日"),
                            ("hol", "祝日"),
                        ],
                        max_length=3,
                    ),
                ),
                ("open_time", models.TimeField(blank=True, null=True)),
                ("close_time", models.TimeField(blank=True, null=True)),
                ("is_closed", models.BooleanField(default=False)),
                (
                    "shop",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="business_hours",
                        to="shops.shop",
                    ),
                ),
            ],
            options={
                "ordering": ["weekday"],
                "unique_together": {("shop", "weekday")},
            },
        ),
        migrations.CreateModel(
            name="ShopTagReaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("reacted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "shop_tag",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reactions",
                        to="shops.shoptag",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tag_reactions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-reacted_at"],
                "unique_together": {("shop_tag", "user")},
            },
        ),
    ]
