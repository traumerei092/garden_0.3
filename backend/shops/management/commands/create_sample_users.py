import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import (
    InterestCategory, Interest, BloodType, MBTI, Alcohol, AlcoholCategory,
    AlcoholBrand, DrinkStyle, Hobby, ExerciseHabit, ExerciseFrequency,
    DietaryPreference, BudgetRange, VisitPurpose, SocialPreference,
    UserAtmospherePreference
)
from shops.models import RelationType, Shop, UserShopRelation, Area, AtmosphereIndicator

User = get_user_model()


class Command(BaseCommand):
    help = '50人のサンプルユーザーを作成し、完全なプロフィールデータと店舗関係を設定します'

    def handle(self, *args, **options):
        self.stdout.write('サンプルユーザーの作成を開始します...')
        
        # 基礎データの作成
        self.create_base_data()
        
        # ユーザー作成
        self.create_sample_users()
        
        self.stdout.write(
            self.style.SUCCESS('50人のサンプルユーザーが正常に作成されました')
        )

    def create_base_data(self):
        """必要な基礎データを作成"""
        
        # 興味カテゴリと興味の作成
        music_category, _ = InterestCategory.objects.get_or_create(name='音楽')
        sports_category, _ = InterestCategory.objects.get_or_create(name='スポーツ')
        travel_category, _ = InterestCategory.objects.get_or_create(name='旅行')
        food_category, _ = InterestCategory.objects.get_or_create(name='グルメ')
        
        interests_data = [
            (music_category, ['ジャズ', 'クラシック', 'ロック', 'ポップス', 'エレクトロニック']),
            (sports_category, ['サッカー', '野球', 'テニス', 'バスケットボール', 'ゴルフ']),
            (travel_category, ['国内旅行', '海外旅行', 'キャンプ', '温泉', 'グルメツアー']),
            (food_category, ['和食', 'イタリアン', 'フレンチ', '中華', '韓国料理'])
        ]
        
        for category, interest_names in interests_data:
            for name in interest_names:
                Interest.objects.get_or_create(name=name, category=category)

        # 血液型の作成
        blood_types = ['A型', 'B型', 'O型', 'AB型']
        for bt in blood_types:
            BloodType.objects.get_or_create(name=bt)

        # MBTIの作成
        mbti_types = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
                     'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
        for mbti in mbti_types:
            MBTI.objects.get_or_create(name=mbti)

        # お酒カテゴリの作成
        alcohol_categories = ['ビール', '日本酒', 'ワイン', 'ウイスキー', 'カクテル', '焼酎']
        for category in alcohol_categories:
            AlcoholCategory.objects.get_or_create(name=category)

        # お酒とカクテルの作成
        alcohols = ['生ビール', '赤ワイン', '白ワイン', '日本酒', 'ウイスキー', '焼酎', 'モヒート', 'マルガリータ']
        for alcohol in alcohols:
            Alcohol.objects.get_or_create(name=alcohol)

        # 趣味の作成
        hobbies = ['読書', '映画鑑賞', '料理', '写真', '旅行', 'ゲーム', '音楽', 'スポーツ', 'アート', 'ダンス']
        for hobby in hobbies:
            Hobby.objects.get_or_create(name=hobby)

        # 運動習慣の作成
        exercises = ['ランニング', 'ジム', 'ヨガ', 'サイクリング', '水泳', 'テニス', 'サッカー', '筋トレ']
        for exercise in exercises:
            ExerciseHabit.objects.get_or_create(name=exercise)

        # 運動頻度の作成
        frequencies = [
            ('毎日', 1), ('週4-6回', 2), ('週2-3回', 3), ('週1回', 4), 
            ('月2-3回', 5), ('月1回以下', 6), ('全くしない', 7)
        ]
        for freq, order in frequencies:
            ExerciseFrequency.objects.get_or_create(name=freq, defaults={'order': order})

        # 食事制限・好みの作成
        dietary_prefs = ['特になし', 'ベジタリアン', 'ヴィーガン', 'グルテンフリー', '低糖質', '低塩分']
        for pref in dietary_prefs:
            DietaryPreference.objects.get_or_create(name=pref)

        # 希望予算の作成
        budgets = [
            ('2000円以下', 0, 2000, 1),
            ('2000-3000円', 2000, 3000, 2),
            ('3000-4000円', 3000, 4000, 3),
            ('4000-5000円', 4000, 5000, 4),
            ('5000円以上', 5000, None, 5)
        ]
        for name, min_p, max_p, order in budgets:
            BudgetRange.objects.get_or_create(
                name=name, 
                defaults={'min_price': min_p, 'max_price': max_p, 'order': order}
            )

        # 利用目的の作成
        purposes = [
            ('一人でゆっくり', 1), ('友人との飲み会', 2), ('デート', 3), 
            ('接待・商談', 4), ('記念日・お祝い', 5), ('カジュアルな食事', 6)
        ]
        for purpose, order in purposes:
            VisitPurpose.objects.get_or_create(name=purpose, defaults={'order': order})

        # 交友関係の作成
        social_prefs = ['一人行動が好き', '少人数派', '大勢で楽しむ派', '新しい人との出会いを求める']
        for pref in social_prefs:
            SocialPreference.objects.get_or_create(name=pref)

    def create_sample_users(self):
        """50人のサンプルユーザーを作成"""
        
        # 日本の名前リスト
        first_names = [
            '太郎', '花子', '健太', '美咲', '翔', '愛子', '大輔', '由美', '拓也', '麻衣',
            '勇太', '恵', '裕介', '静香', '慎一', '直美', '亮', '千尋', '啓太', '真理',
            '雄一', '順子', '浩二', '礼子', '智也', '幸子', '和也', '洋子', '光一', '綾子',
            '悠人', '茜', '颯', '優香', '陸', '七海', '蒼空', '結愛', '樹', '桜',
            '大翔', '陽菜', '悠真', '結菜', '朝陽', '美結', '颯太', '莉子', '隼人', '咲良'
        ]
        
        last_names = [
            '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
            '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎',
            '阿部', '森', '池田', '橋本', '山下', '石川', '中島', '前田', '藤田', '後藤',
            '岡田', '長谷川', '村上', '近藤', '坂本', '斎藤', '青木', '今井', '福田', '西村',
            '田村', '小川', '三浦', '中川', '小野', '竹内', '原田', '岡本', '石田', '上田'
        ]

        # 職業データ
        occupations = [
            'エンジニア', 'デザイナー', '営業', 'マーケティング', '経理', '人事', 
            '医師', '看護師', '教師', '弁護士', 'コンサルタント', '研究者',
            'クリエイター', '公務員', '金融関係', 'IT関係', '建築士', '薬剤師'
        ]

        industries = [
            'IT・テクノロジー', '金融', '医療・ヘルスケア', '教育', 'メディア・エンターテイメント',
            '製造業', '建設・不動産', '小売・流通', '飲食・宿泊', 'コンサルティング',
            '公的機関', 'スタートアップ', 'NGO・非営利', '研究機関'
        ]

        positions = ['スタッフ', '主任', '係長', '課長', '部長', '役員', '代表', 'フリーランス']

        # 店舗とリレーションタイプの取得
        shops = list(Shop.objects.all())
        if not shops:
            self.stdout.write(self.style.WARNING('店舗データがありません。先に店舗を作成してください。'))
            return

        favorite_relation = RelationType.objects.filter(name='行きつけ').first()
        if not favorite_relation:
            favorite_relation = RelationType.objects.create(name='行きつけ')

        # エリアの取得
        areas = list(Area.objects.all())

        # 雰囲気指標の取得
        atmosphere_indicators = list(AtmosphereIndicator.objects.all())

        for i in range(50):
            # ランダムな名前を生成
            full_name = f"{random.choice(last_names)} {random.choice(first_names)}"
            email = f"user{i+1:02d}@example.com"
            
            # 年齢（18-65歳）
            age = random.randint(18, 65)
            birthdate = date.today() - timedelta(days=age * 365 + random.randint(0, 365))

            # ユーザー作成
            user = User.objects.create_user(
                email=email,
                name=full_name,
                password='testpass123',
                gender=random.choice(['男性', '女性', 'その他']),
                birthdate=birthdate,
                introduction=f"よろしくお願いします！{random.choice(['お酒好き', 'グルメ好き', '旅行好き', '音楽好き'])}です。",
                occupation=random.choice(occupations),
                industry=random.choice(industries),
                position=random.choice(positions),
                work_info=f"{random.choice(['東京', '大阪', '名古屋', '福岡', '横浜'])}で{random.choice(['チーム', '個人', '部署'])}として働いています。"
            )

            # プロフィール詳細設定
            user.blood_type = random.choice(BloodType.objects.all())
            user.mbti = random.choice(MBTI.objects.all())
            user.exercise_frequency = random.choice(ExerciseFrequency.objects.all())
            user.dietary_preference = random.choice(DietaryPreference.objects.all())
            user.budget_range = random.choice(BudgetRange.objects.all())
            
            user.save()

            # 多対多の関係設定
            # 興味（2-5個）
            interests = random.sample(list(Interest.objects.all()), random.randint(2, 5))
            user.interests.set(interests)

            # お酒の好み（1-3個）
            alcohols = random.sample(list(Alcohol.objects.all()), random.randint(1, 3))
            user.alcohols.set(alcohols)

            # お酒のカテゴリ（1-3個）
            categories = random.sample(list(AlcoholCategory.objects.all()), random.randint(1, 3))
            user.alcohol_categories.set(categories)

            # 趣味（2-4個）
            hobbies = random.sample(list(Hobby.objects.all()), random.randint(2, 4))
            user.hobbies.set(hobbies)

            # 運動習慣（0-3個）
            exercises = random.sample(list(ExerciseHabit.objects.all()), random.randint(0, 3))
            user.exercise_habits.set(exercises)

            # 利用目的（1-3個）
            purposes = random.sample(list(VisitPurpose.objects.all()), random.randint(1, 3))
            user.visit_purposes.set(purposes)

            # 交友関係（1-2個）
            social_prefs = random.sample(list(SocialPreference.objects.all()), random.randint(1, 2))
            user.social_preferences.set(social_prefs)

            # マイエリア設定
            if areas:
                my_areas = random.sample(areas, random.randint(1, min(3, len(areas))))
                user.my_areas.set(my_areas)
                user.primary_area = random.choice(my_areas)
                user.save()

            # 雰囲気の好み設定
            if atmosphere_indicators:
                for indicator in random.sample(atmosphere_indicators, random.randint(3, len(atmosphere_indicators))):
                    UserAtmospherePreference.objects.create(
                        user_profile=user,
                        indicator=indicator,
                        score=random.randint(-2, 2)
                    )

            # 店舗との関係設定（行きつけ店舗）
            # 各ユーザーに2-8店舗の行きつけを設定
            favorite_shops = random.sample(shops, random.randint(2, min(8, len(shops))))
            for shop in favorite_shops:
                UserShopRelation.objects.create(
                    user=user,
                    shop=shop,
                    relation_type=favorite_relation
                )

            if (i + 1) % 10 == 0:
                self.stdout.write(f'{i + 1}人のユーザーを作成しました...')

        self.stdout.write(f'全{50}人のサンプルユーザーを作成完了！')