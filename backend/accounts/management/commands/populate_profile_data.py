
from django.core.management.base import BaseCommand
from accounts.models import (
    InterestCategory,
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    Hobby,
    ExerciseHabit,
    SocialPreference,
)

class Command(BaseCommand):
    help = "Populates the database with initial profile data"

    def handle(self, *args, **options):
        self.stdout.write("Populating profile data...")

        # --- Interest Data ---
        interest_categories = {
            "SNS・プラットフォーム": ["Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn"],
            "アウトドア": ["キャンプ", "ハイキング", "釣り", "サイクリング", "サーフィン"],
            "インドア": ["読書", "映画鑑賞", "料理", "ボードゲーム", "DIY"],
            "お出かけ": ["カフェ巡り", "美術館巡り", "ショッピング", "公園でのんびり", "ドライブ"],
            "アート": ["絵画", "写真", "陶芸", "現代アート", "ストリートアート"],
            "音楽": ["J-POP", "ロック", "ジャズ", "クラシック", "EDM"],
            "ウェルネス": ["ヨガ", "瞑想", "ランニング", "サウナ", "アロマテラピー"],
            "ゲーム": ["コンソールゲーム", "PCゲーム", "モバイルゲーム", "eスポーツ", "レトロゲーム"],
            "スポーツ": ["野球", "サッカー", "バスケットボール", "テニス", "ゴルフ"],
            "動画コンテンツ": ["YouTube", "Netflix", "Amazon Prime Video", "Hulu", "アニメ"],
            "価値観": ["環境保護", "社会貢献", "自己成長", "ワークライフバランス", "多様性の尊重"],
            "消費行動": ["ミニマリスト", "最新ガジェット好き", "サステナブルな商品を選ぶ", "コストパフォーマンス重視", "ブランド志向"],
            "仕事・キャリア": ["起業・独立", "専門性を高める", "グローバルに働く", "安定志向", "社会貢献性の高い仕事"],
        }

        for category_name, interests in interest_categories.items():
            category, created = InterestCategory.objects.get_or_create(name=category_name)
            for interest_name in interests:
                Interest.objects.get_or_create(name=interest_name, category=category)

        # --- Personality Data ---
        blood_types = ["A型", "B型", "O型", "AB型"]
        for bt in blood_types:
            BloodType.objects.get_or_create(name=bt)

        mbti_types = [
            "INTJ", "INTP", "ENTJ", "ENTP",
            "INFJ", "INFP", "ENFJ", "ENFP",
            "ISTJ", "ISFJ", "ESTJ", "ESFJ",
            "ISTP", "ISFP", "ESTP", "ESFP",
        ]
        for mbti in mbti_types:
            MBTI.objects.get_or_create(name=mbti)

        # --- Lifestyle Data ---
        alcohols = ["ビール", "ワイン", "日本酒", "焼酎", "カクテル", "飲まない"]
        for alcohol in alcohols:
            Alcohol.objects.get_or_create(name=alcohol)

        hobbies = ["グルメ", "旅行", "ファッション", "美容", "ペット"]
        for hobby in hobbies:
            Hobby.objects.get_or_create(name=hobby)

        exercise_habits = ["ジム", "ランニング", "ヨガ", "ダンス", "特にしない"]
        for eh in exercise_habits:
            ExerciseHabit.objects.get_or_create(name=eh)

        # --- Social Data ---
        social_preferences = ["大人数でわいわい", "少人数でしっぽり", "一人が好き", "インドア派", "アウトドア派"]
        for sp in social_preferences:
            SocialPreference.objects.get_or_create(name=sp)

        self.stdout.write(self.style.SUCCESS("Successfully populated profile data."))
