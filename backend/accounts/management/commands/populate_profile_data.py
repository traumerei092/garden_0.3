
from django.core.management.base import BaseCommand
from accounts.models import (
    InterestCategory,
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    AlcoholCategory,
    AlcoholBrand,
    DrinkStyle,
    Hobby,
    ExerciseHabit,
    SocialPreference,
    ExerciseFrequency,
    DietaryPreference,
    BudgetRange,
    VisitPurpose,
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

        # --- Alcohol Category Data ---
        alcohol_data = {
            "ウイスキー": {
                "brands": ["サントリー角", "ジャックダニエル", "ジェムソン", "マッカラン", "山崎", "白州", "響"],
                "drink_styles": ["ハイボール", "水割り", "ロック", "ストレート", "ウイスキーソーダ"]
            },
            "ジン": {
                "brands": ["ボンベイサファイア", "タンカレー", "ヘンドリックス", "季の美", "翠"],
                "drink_styles": ["ジントニック", "ジンバック", "マティーニ", "ネグローニ", "ジンリッキー"]
            },
            "テキーラ": {
                "brands": ["クエルボ", "パトロン", "ドンフリオ", "オルメカ"],
                "drink_styles": ["テキーラサンライズ", "マルガリータ", "メキシコーク", "ショット", "パロマ"]
            },
            "ブランデー": {
                "brands": ["ヘネシー", "レミーマルタン", "マーテル", "カミュ", "サントリーブランデー"],
                "drink_styles": ["ストレート", "ロック", "水割り", "ソーダ割り", "ブランデーカクテル"]
            },
            "焼酎": {
                "brands": ["いいちこ", "黒霧島", "森伊蔵", "魔王", "村尾", "白波"],
                "drink_styles": ["水割り", "お湯割り", "ロック", "ソーダ割り", "ストレート"]
            },
            "日本酒": {
                "brands": ["獺祭", "久保田", "八海山", "十四代", "而今", "新政"],
                "drink_styles": ["冷酒", "熱燗", "ぬる燗", "常温", "ロック"]
            },
            "ビール": {
                "brands": ["アサヒスーパードライ", "キリン一番搾り", "サッポロ黒ラベル", "サントリープレミアムモルツ", "ハイネケン", "コロナ"],
                "drink_styles": ["生ビール", "瓶ビール", "缶ビール", "クラフトビール"]
            },
            "ワイン": {
                "brands": ["シャトー・マルゴー", "ドンペリニヨン", "オーパスワン", "登美の丘", "グレイスワイン"],
                "drink_styles": ["赤ワイン", "白ワイン", "ロゼワイン", "スパークリングワイン", "ワインカクテル"]
            },
            "ラム": {
                "brands": ["バカルディ", "キャプテンモルガン", "マイヤーズ", "ハバナクラブ"],
                "drink_styles": ["モヒート", "ダイキリ", "ピニャコラーダ", "ラムコーク", "ラムパンチ"]
            },
            "ウォッカ": {
                "brands": ["スミノフ", "アブソルート", "グレイグース", "ベルヴェデール"],
                "drink_styles": ["モスコミュール", "ウォッカトニック", "ブラッディマリー", "ショット", "ウォッカソーダ"]
            }
        }

        for category_name, data in alcohol_data.items():
            category, created = AlcoholCategory.objects.get_or_create(name=category_name)
            
            # ブランドを追加
            for brand_name in data["brands"]:
                AlcoholBrand.objects.get_or_create(name=brand_name, category=category)
            
            # 飲み方を追加
            for style_name in data["drink_styles"]:
                DrinkStyle.objects.get_or_create(name=style_name, category=category)

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

        # --- Exercise Frequency Data ---
        exercise_frequencies = [
            ("毎日", 1),
            ("週に5~6回", 2),
            ("週に3~4回", 3),
            ("週に1~2回", 4),
            ("月に数回", 5),
            ("たまに", 6),
            ("全くしない", 7),
        ]
        for name, order in exercise_frequencies:
            ExerciseFrequency.objects.get_or_create(name=name, defaults={'order': order})

        # --- Dietary Preference Data ---
        dietary_preferences = [
            ("特になし", "特に制限や好みはありません"),
            ("ヴィーガン", "動物性食品を一切摂取しません"),
            ("ベジタリアン", "肉類を摂取しません"),
            ("ペスカタリアン", "魚介類は摂取しますが、肉類は摂取しません"),
            ("肉中心", "肉料理を好みます"),
            ("魚中心", "魚料理を好みます"),
            ("野菜中心", "野菜料理を好みます"),
            ("グルテンフリー", "グルテンを含む食品を避けます"),
            ("糖質制限", "糖質を制限しています"),
            ("アレルギー対応", "特定の食材にアレルギーがあります"),
        ]
        for name, description in dietary_preferences:
            DietaryPreference.objects.get_or_create(name=name, defaults={'description': description})

        # --- Budget Range Data ---
        budget_ranges = [
            ("1,000円以下", 0, 1000, 1),
            ("1,000円～2,000円", 1000, 2000, 2),
            ("2,000円～3,000円", 2000, 3000, 3),
            ("3,000円～4,000円", 3000, 4000, 4),
            ("4,000円～5,000円", 4000, 5000, 5),
            ("5,000円～7,000円", 5000, 7000, 6),
            ("7,000円～10,000円", 7000, 10000, 7),
            ("10,000円以上", 10000, None, 8),
        ]
        for name, min_price, max_price, order in budget_ranges:
            BudgetRange.objects.get_or_create(
                name=name, 
                defaults={'min_price': min_price, 'max_price': max_price, 'order': order}
            )

        # --- Visit Purpose Data ---
        visit_purposes = [
            ("仕事終わりの一杯", "仕事帰りにリラックスしたい", 1),
            ("友人との飲み会", "友人と楽しく過ごしたい", 2),
            ("デート", "恋人や気になる人との時間", 3),
            ("一人飲み", "一人でゆっくり過ごしたい", 4),
            ("接待・商談", "ビジネス関連の会食", 5),
            ("記念日・お祝い", "特別な日のお祝い", 6),
            ("新しい出会い", "新しい人との出会いを求めて", 7),
            ("趣味の情報交換", "共通の趣味を持つ人との交流", 8),
            ("ストレス発散", "日頃のストレスを発散したい", 9),
            ("グルメ探求", "美味しい料理やお酒を楽しみたい", 10),
        ]
        for name, description, order in visit_purposes:
            VisitPurpose.objects.get_or_create(
                name=name, 
                defaults={'description': description, 'order': order}
            )

        self.stdout.write(self.style.SUCCESS("Successfully populated profile data."))
