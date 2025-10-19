# 問い合わせ・報告・要望機能 - Claude Code開発記録

## 📋 実装概要

ユーザーから運営者への連絡手段を提供する統合問い合わせシステム。不適切なコンテンツの報告、使い方の質問、新機能要望など、あらゆるユーザーフィードバックを一元管理する。

**実装日**: 2025-10-19
**Claude Code Version**: Sonnet 4.5

## 🎯 ユーザー要望（オリジナル）

### 背景・目的
ユーザーが店舗情報や店舗フィードバックを登録できる仕様のため、場合によっては不適切な投稿や店舗情報が誤っていることなども出てくる。そのためのユーザーからサービス運営者への連絡機能が必要。

### 想定される問い合わせ内容
1. 登録店舗の閉店・休店・移転報告
2. 誤った店舗画像や不適切・卑猥な店舗画像の報告
3. 口コミや印象タグでの誹謗中傷や不適切・卑猥な投稿の報告
4. プロフィール情報を外部ユーザーに見せたくない問い合わせ
5. 使い方に関する問い合わせ
6. 悪質ユーザーの報告
7. 新規機能要望
8. 機能のバグや不具合の報告

### 要件
- ユーザーの使いやすさを重視した導線設計
- 運営サイド（管理者）の管理のしやすさ
- コンテキストに応じた適切な問い合わせフロー
- 本番環境では管理用メールアドレスに通知
- 将来的に「よくあるご質問」ページで対応省力化

## 🏗️ システム設計

### ジャンル分類（3つのメインカテゴリ）

#### 1. 🚨 報告（Report） - 緊急性・重要性が高い
- 店舗情報の問題（閉店・休店・移転）
- 不適切なコンテンツ（画像・口コミ・タグ）
- 悪質ユーザー・迷惑行為

#### 2. 💬 問い合わせ（Inquiry） - サポートが必要
- 使い方・操作方法
- アカウント・プライバシー設定
- 技術的な問題・エラー

#### 3. 💡 要望（Request） - 改善提案
- 新機能の要望
- 既存機能の改善提案
- デザイン・UI/UXの提案

## 🎨 導線設計：コンテキストアウェアな問い合わせ

### A. 店舗詳細ページ (`/shops/[id]`)
**配置**: ヘッダー右上に控えめなFlagアイコン

```tsx
<Popover>
  <PopoverTrigger>
    <button className={styles.reportButton}>
      <Flag size={18} strokeWidth={1} />
    </button>
  </PopoverTrigger>
  <PopoverContent>
    <div className={styles.reportMenu}>
      <button onClick={() => handleReport('shop_closed')}>
        <Store size={16} /> この店舗を報告
      </button>
      <button onClick={() => handleReport('shop_info_error')}>
        <AlertCircle size={16} /> 店舗情報の誤り
      </button>
    </div>
  </PopoverContent>
</Popover>
```

**遷移**: `/contact?type=report&category=shop&shopId=123`
**特徴**: 店舗情報が自動入力された状態で問い合わせページに遷移

### B. 口コミカード (`ShopReviews`)
**配置**: 各口コミの右上に3点リーダーメニュー

```tsx
<Popover>
  <PopoverTrigger>
    <button className={styles.reviewMenuButton}>
      <MoreVertical size={16} strokeWidth={1} />
    </button>
  </PopoverTrigger>
  <PopoverContent>
    <button onClick={() => handleReportReview(reviewId)}>
      <Flag size={14} /> この口コミを報告
    </button>
  </PopoverContent>
</Popover>
```

**遷移**: `/contact?type=report&category=review&reviewId=456`
**UX考慮**: 口コミカード上に直接「報告」リンクを表示すると口コミ投稿の躊躇に繋がる可能性があるため、アイコンクリックでポップオーバー表示

### C. 印象タグ (`ShopImpressionTag`)
**配置**: タグホバー時に報告アイコン表示

```tsx
<div className={styles.tagWithReport}>
  <Chip>{tag.value}</Chip>
  <button
    className={styles.tagReportIcon}
    onClick={() => handleReportTag(tag.id)}
  >
    <AlertCircle size={12} />
  </button>
</div>
```

**遷移**: `/contact?type=report&category=tag&tagId=789`

### D. 店舗画像カルーセル (`ShopImageCarousel`)
**配置**: 画像ホバー時に右上にFlagアイコン

```tsx
<div className={styles.imageWithFlag}>
  <Image src={image.url} />
  <button
    className={styles.imageFlagButton}
    onClick={() => handleReportImage(image.id)}
  >
    <Flag size={16} />
  </button>
</div>
```

**遷移**: `/contact?type=report&category=image&imageId=101`

### E. グローバルヘッダー (`Layout/Header`)
**配置**: 常に「お問い合わせ」リンクを配置

```tsx
<nav className={styles.headerNav}>
  <Link href="/contact" className={styles.contactLink}>
    <Mail size={18} strokeWidth={1} />
    <span>お問い合わせ</span>
  </Link>
</nav>
```

**遷移**: `/contact`（カテゴリ未選択状態）

### F. フッター（将来実装）
**配置**: 全ページ共通フッター
**注**: フッターは別途要件を固めてから実装予定

## 🗄️ データベース設計

### ContactSubmission モデル

```python
class ContactSubmission(models.Model):
    """問い合わせ・報告・要望の統一モデル"""

    CONTACT_TYPE_CHOICES = [
        ('report', '報告'),
        ('inquiry', '問い合わせ'),
        ('request', '要望'),
    ]

    CATEGORY_CHOICES = [
        # 報告カテゴリ
        ('shop_closed', '店舗閉店・休店・移転'),
        ('inappropriate_image', '不適切な店舗画像'),
        ('inappropriate_review', '不適切な口コミ'),
        ('inappropriate_tag', '不適切な印象タグ'),
        ('malicious_user', '悪質ユーザー'),

        # 問い合わせカテゴリ
        ('how_to_use', '使い方'),
        ('account_privacy', 'アカウント・プライバシー'),
        ('technical_issue', '技術的問題・バグ'),
        ('other_inquiry', 'その他の問い合わせ'),

        # 要望カテゴリ
        ('new_feature', '新機能要望'),
        ('improvement', '既存機能改善'),
        ('design_ux', 'デザイン・UI/UX'),
        ('other_request', 'その他の要望'),
    ]

    STATUS_CHOICES = [
        ('pending', '未対応'),
        ('in_progress', '対応中'),
        ('resolved', '解決済み'),
        ('closed', 'クローズ'),
    ]

    # 基本情報
    user = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='送信者'
    )
    contact_type = models.CharField(
        max_length=20,
        choices=CONTACT_TYPE_CHOICES,
        verbose_name='問い合わせ種別'
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        verbose_name='カテゴリ'
    )
    subject = models.CharField(
        max_length=200,
        verbose_name='件名'
    )
    description = models.TextField(
        verbose_name='詳細説明'
    )

    # 関連オブジェクト（報告対象の自動参照）
    shop = models.ForeignKey(
        'Shop',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='関連店舗'
    )
    review = models.ForeignKey(
        'ShopReview',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='関連口コミ'
    )
    tag = models.ForeignKey(
        'ShopTag',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='関連タグ'
    )
    image = models.ForeignKey(
        'ShopImage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='関連画像'
    )
    reported_user = models.ForeignKey(
        UserAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_against',
        verbose_name='報告対象ユーザー'
    )

    # スクリーンショット（問題の証拠）
    screenshot = models.ImageField(
        upload_to='contact_screenshots/',
        null=True,
        blank=True,
        verbose_name='スクリーンショット'
    )

    # 連絡先（未ログインユーザー対応）
    contact_email = models.EmailField(
        null=True,
        blank=True,
        verbose_name='連絡先メールアドレス'
    )

    # ステータス管理
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='対応状況'
    )
    admin_note = models.TextField(
        blank=True,
        verbose_name='管理者メモ'
    )

    # メタデータ
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解決日時')

    class Meta:
        verbose_name = '問い合わせ'
        verbose_name_plural = '問い合わせ'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['contact_type', 'status']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.get_contact_type_display()}] {self.subject}"
```

## 📧 メール通知システム

### Django Email設定

```python
# settings.py

# 開発環境: コンソール出力
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # 本番環境: Gmail SMTP or SendGrid
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@example.com')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
```

### 管理者通知メール

```python
# views.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

class ContactSubmissionViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()

        # 管理者にメール送信
        subject = f'[{submission.get_contact_type_display()}] {submission.subject}'
        message = render_to_string('emails/contact_notification.html', {
            'submission': submission,
            'user': submission.user,
            'admin_url': f'{settings.SITE_URL}/admin/shops/contactsubmission/{submission.id}/change/'
        })

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],
            html_message=message,
        )

        # ユーザーに自動返信メール送信
        self.send_auto_reply(submission)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def send_auto_reply(self, submission):
        """ユーザーへの自動返信メール"""
        user_email = submission.user.email if submission.user else submission.contact_email

        if not user_email:
            return

        subject = f'お問い合わせを受け付けました - {submission.subject}'
        message = render_to_string('emails/contact_auto_reply.html', {
            'submission': submission,
        })

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=message,
        )
```

### 管理者通知メールテンプレート

```html
<!-- templates/emails/contact_notification.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: rgb(10,11,28);
            color: rgb(255,255,255);
        }
        .header {
            background: linear-gradient(135deg, rgb(0,198,255) 0%, rgb(235,14,242) 100%);
            color: rgb(255,255,255);
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            background: rgba(0,0,0,0.6);
            border: 1px solid rgba(0,255,255,0.3);
            border-radius: 0 0 8px 8px;
        }
        .label {
            font-weight: bold;
            color: rgb(0,255,255);
        }
        .value {
            margin-bottom: 15px;
            padding-left: 10px;
        }
        .admin-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: rgb(0,255,255);
            color: rgb(10,11,28);
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>新しい{{ submission.get_contact_type_display }}が届きました</h2>
    </div>
    <div class="content">
        <div class="value">
            <span class="label">種別:</span>
            {{ submission.get_contact_type_display }}
        </div>
        <div class="value">
            <span class="label">カテゴリ:</span>
            {{ submission.get_category_display }}
        </div>
        <div class="value">
            <span class="label">件名:</span>
            {{ submission.subject }}
        </div>
        <div class="value">
            <span class="label">送信者:</span>
            {% if user %}
                {{ user.name }} ({{ user.email }})
            {% else %}
                未ログインユーザー ({{ submission.contact_email }})
            {% endif %}
        </div>
        <div class="value">
            <span class="label">詳細:</span>
            <p>{{ submission.description|linebreaks }}</p>
        </div>

        {% if submission.shop %}
        <div class="value">
            <span class="label">関連店舗:</span>
            {{ submission.shop.name }}
        </div>
        {% endif %}

        {% if submission.review %}
        <div class="value">
            <span class="label">関連口コミID:</span>
            {{ submission.review.id }}
        </div>
        {% endif %}

        {% if submission.tag %}
        <div class="value">
            <span class="label">関連タグ:</span>
            {{ submission.tag.value }}
        </div>
        {% endif %}

        <a href="{{ admin_url }}" class="admin-link">管理画面で確認</a>
    </div>
</body>
</html>
```

### ユーザー自動返信メールテンプレート

```html
<!-- templates/emails/contact_auto_reply.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: rgb(10,11,28);
            color: rgb(255,255,255);
        }
        .header {
            background: linear-gradient(135deg, rgb(0,198,255) 0%, rgb(235,14,242) 100%);
            color: rgb(255,255,255);
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 30px;
            background: rgba(0,0,0,0.6);
            border: 1px solid rgba(0,255,255,0.3);
            border-radius: 0 0 8px 8px;
            line-height: 1.8;
        }
        .highlight {
            color: rgb(0,255,255);
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>お問い合わせを受け付けました</h2>
    </div>
    <div class="content">
        <p>この度はお問い合わせいただき、誠にありがとうございます。</p>

        <p>以下の内容で受け付けいたしました。</p>

        <p>
            <span class="highlight">種別:</span> {{ submission.get_contact_type_display }}<br>
            <span class="highlight">件名:</span> {{ submission.subject }}<br>
            <span class="highlight">受付日時:</span> {{ submission.created_at|date:"Y年m月d日 H:i" }}
        </p>

        <p>内容を確認の上、順次対応させていただきます。</p>

        <p>今後とも当サービスをよろしくお願いいたします。</p>

        <hr style="border: 1px solid rgba(255,255,255,0.2); margin: 20px 0;">

        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">
            ※このメールは自動送信されています。<br>
            ご返信いただいても対応できませんので、ご了承ください。
        </p>
    </div>
</body>
</html>
```

## 🎨 UI/UX設計（Netflix級デザイン）

### `/contact` ページレイアウト

#### 3ステップフォーム構成

**Step 1: カテゴリ選択**
```tsx
<div className={styles.categorySelection}>
  <div
    className={styles.categoryCard}
    onClick={() => selectType('report')}
  >
    <Flag size={32} className={styles.categoryIcon} />
    <h3>報告</h3>
    <p>不適切なコンテンツや店舗情報の問題</p>
  </div>

  <div
    className={styles.categoryCard}
    onClick={() => selectType('inquiry')}
  >
    <HelpCircle size={32} />
    <h3>問い合わせ</h3>
    <p>使い方やアカウントに関する質問</p>
  </div>

  <div
    className={styles.categoryCard}
    onClick={() => selectType('request')}
  >
    <Lightbulb size={32} />
    <h3>要望</h3>
    <p>新機能のアイデアや改善提案</p>
  </div>
</div>
```

**Step 2: 詳細入力（カテゴリごとに動的変更）**
```tsx
{contactType === 'report' && (
  <div className={styles.reportForm}>
    <CustomRadioGroup
      label="報告内容"
      options={reportCategories}
      value={category}
      onChange={setCategory}
    />

    {/* 報告対象の自動表示 */}
    {shop && (
      <div className={styles.targetInfo}>
        <Store size={16} />
        <span>報告対象: {shop.name}</span>
      </div>
    )}

    <InputDefault
      label="件名"
      value={subject}
      onChange={setSubject}
      placeholder="簡潔に問題を説明してください"
    />

    <textarea
      className={styles.description}
      placeholder="詳しい状況を教えてください"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />

    {/* スクリーンショットアップロード */}
    <div className={styles.screenshotUpload}>
      <label htmlFor="screenshot">
        <Camera size={20} />
        スクリーンショットを添付（任意）
      </label>
      <input
        type="file"
        id="screenshot"
        accept="image/*"
        onChange={handleScreenshotUpload}
      />
    </div>
  </div>
)}
```

**Step 3: 確認画面**
```tsx
<div className={styles.confirmation}>
  <div className={styles.summaryCard}>
    <h3>送信内容の確認</h3>
    <dl>
      <dt>種別</dt>
      <dd>{getTypeLabel(contactType)}</dd>
      <dt>カテゴリ</dt>
      <dd>{getCategoryLabel(category)}</dd>
      <dt>件名</dt>
      <dd>{subject}</dd>
      <dt>詳細</dt>
      <dd>{description}</dd>
    </dl>
  </div>

  <ButtonGradient onClick={handleSubmit}>
    送信する
  </ButtonGradient>
</div>
```

### デザイン仕様（SCSS）

```scss
// カテゴリカード
.categoryCard {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgb(0, 255, 255);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 255, 255, 0.2);
  }

  .categoryIcon {
    color: rgb(0, 255, 255);
    margin-bottom: 1rem;
  }

  h3 {
    color: rgb(255, 255, 255);
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
  }
}

// 報告対象情報
.targetInfo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  margin-bottom: 1.5rem;

  svg {
    color: rgb(0, 255, 255);
  }

  span {
    color: rgb(255, 255, 255);
    font-weight: 500;
  }
}

// 詳細説明テキストエリア
.description {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  color: rgb(255, 255, 255);
  font-size: 1rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgb(0, 255, 255);
    box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

// スクリーンショットアップロード
.screenshotUpload {
  margin-top: 1.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px dashed rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    color: rgb(255, 255, 255);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgb(0, 255, 255);
      background: rgba(0, 255, 255, 0.1);
    }

    svg {
      color: rgb(0, 255, 255);
    }
  }

  input[type="file"] {
    display: none;
  }
}

// 確認画面サマリーカード
.summaryCard {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;

  h3 {
    color: rgb(0, 255, 255);
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
  }

  dl {
    dt {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    dd {
      color: rgb(255, 255, 255);
      font-size: 1rem;
      margin-bottom: 1.5rem;
      padding-left: 0.5rem;
      border-left: 2px solid rgb(0, 255, 255);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
```

## 📁 ファイル構成

### バックエンド
```
backend/
├── shops/
│   ├── models.py                    # ContactSubmission モデル追加
│   ├── serializers.py               # ContactSubmissionSerializer
│   ├── views.py                     # ContactSubmissionViewSet
│   ├── urls.py                      # /api/contact-submissions/ エンドポイント
│   └── admin.py                     # Django管理画面カスタマイズ
└── templates/
    └── emails/
        ├── contact_notification.html    # 管理者通知メール
        └── contact_auto_reply.html      # ユーザー自動返信メール
```

### フロントエンド
```
frontend/src/
├── app/
│   └── contact/
│       └── page.tsx                 # 問い合わせページ
├── components/
│   └── Contact/
│       ├── ContactForm/
│       │   ├── index.tsx            # 問い合わせフォーム
│       │   └── style.module.scss
│       └── CategorySelection/
│           ├── index.tsx            # カテゴリ選択UI
│           └── style.module.scss
├── actions/
│   └── contact/
│       └── submitContact.ts         # API通信関数
└── types/
    └── contact.ts                   # ContactSubmission型定義
```

## 🔧 実装手順

### Phase 1: バックエンド（Django）
1. ✅ ContactSubmission モデル作成
2. ✅ マイグレーション実行
3. ✅ ContactSubmissionSerializer 実装
4. ✅ ContactSubmissionViewSet 実装
5. ✅ URLルーティング設定
6. ✅ メール送信機能実装（管理者通知 + ユーザー自動返信）
7. ✅ メールテンプレート作成
8. ✅ Django管理画面カスタマイズ

### Phase 2: フロントエンド（Next.js）
1. ✅ 型定義作成 (`types/contact.ts`)
2. ✅ API通信関数作成 (`actions/contact/submitContact.ts`)
3. ✅ ContactForm コンポーネント実装
4. ✅ CategorySelection コンポーネント実装
5. ✅ `/contact` ページ実装
6. ✅ スタイル実装（Netflix級デザイン）

### Phase 3: 導線設置
1. ✅ 店舗詳細ページに報告ボタン追加
2. ✅ 口コミカードに報告メニュー追加
3. ✅ 印象タグに報告アイコン追加
4. ✅ 画像カルーセルに報告ボタン追加
5. ✅ ヘッダーに問い合わせリンク追加
6. ⏸️ フッター実装（別途要件確定後）

### Phase 4: テスト・調整
1. ✅ 開発環境でメール送信テスト（コンソール確認）
2. ✅ 各導線からの遷移テスト
3. ✅ UI/UX最終調整
4. ✅ レスポンシブ対応確認

### Phase 5: FAQ準備（将来）
1. ⏸️ よくある質問データ収集
2. ⏸️ FAQページ実装
3. ⏸️ 検索機能実装

## 💡 実装する追加機能

### ユーザー自動返信メール
- ✅ 問い合わせ受付確認メールの自動送信
- ✅ 受付日時・件名・種別の記載
- ✅ 対応予定の案内
- ✅ 安心感を提供するデザイン

## 🚫 今回実装しない機能（将来検討）

### 1. リアルタイム通知（Slack連携）
**理由**: 専用Slack未準備のため将来実装

### 3. ステータス追跡ページ
**理由**: 初期リリースでは優先度低

### 4. AIによる自動カテゴライズ
**理由**: データ蓄積後に検討

### 5. フッター実装
**理由**: 別途要件を固めてから実装予定

## 🎯 開発ガイドライン準拠

### カラールール
- **ベースカラー**: `rgb(10,11,28)` - 主に背景色
- **第一強調色**: `rgb(0,255,255)` - 通常のコンポーネントや強調部分
- **第二強調色**: `rgb(0,198,255)`と`rgb(235,14,242)`のグラデーション - ボタンやグラデーション

### アイコンルール
- **lucide-react** のアイコンのみ使用
- `strokeWidth={1}` で統一

### レイアウトルール
- 意味のないpaddingは使用しない
- コンパクト性重視
- ファーストビューでの情報訴求

### コンポーネントルール
- モーダル: `CustomModal` を使用
- ボタン: `ButtonGradient` を使用
- 戻るボタン: `BackButton` コンポーネントを使用

### API連携パターン
- 認証必要: `fetchWithSession` 使用
- データ処理: `actions/` 配下に集約

## 🐛 想定される技術課題と対策

### 1. 画像アップロード処理
**課題**: スクリーンショットの安全なアップロードと保存
**対策**: Cloudinary連携、ファイルサイズ制限、拡張子チェック

### 2. スパム対策
**課題**: 大量の不正問い合わせ送信
**対策**: レート制限、認証必須化、reCAPTCHA検討

### 3. メール送信失敗
**課題**: SMTP設定エラーや到達性問題
**対策**: try-catchでのエラーハンドリング、ログ記録、管理画面での確認

### 4. 未ログインユーザー対応
**課題**: アカウント未登録ユーザーからの問い合わせ
**対策**: contact_emailフィールドで対応、ログイン状態で条件分岐

## 📊 運用・分析指標

### 管理画面で確認できる情報
- 問い合わせ種別ごとの件数
- カテゴリ別の傾向分析
- 対応状況（未対応・対応中・解決済み）
- 平均解決時間
- ユーザー別問い合わせ履歴

### 将来的な分析
- よくある問い合わせのFAQ化
- 不適切コンテンツの傾向分析
- システム改善のためのフィードバック活用

## 🔄 今後の拡張案

### 短期的改善
- [ ] 問い合わせステータス追跡ページ
- [ ] 管理画面での返信機能
- [ ] テンプレート返信機能

### 中期的機能追加
- [ ] FAQページとの連携
- [ ] 問い合わせ履歴のエクスポート
- [ ] カテゴリ別の対応優先度設定

### 長期的ビジョン
- [ ] AIによる自動分類・優先度付け
- [ ] Slack/Discord連携
- [ ] リアルタイムチャットサポート

---

**最終更新**: 2025-10-19
**バージョン**: v1.0
**担当**: Claude Code Implementation
