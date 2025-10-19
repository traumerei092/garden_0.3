'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flag, HelpCircle, Lightbulb, Camera, Store, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '@/components/Layout/Header';
import BackButton from '@/components/UI/BackButton';
import CustomRadioGroup from '@/components/UI/RadioGroup';
import InputDefault from '@/components/UI/InputDefault';
import ButtonGradient from '@/components/UI/ButtonGradient';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import { submitContact } from '@/actions/contact/submitContact';
import { useAuthSession } from '@/hooks/useAuthSession';
import type {
  ContactType,
  ContactCategory,
  ContactSubmissionCreate,
} from '@/types/contact';
import { CATEGORY_OPTIONS, CONTACT_TYPE_LABELS } from '@/types/contact';
import styles from './style.module.scss';

export default function ContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn } = useAuthSession();

  // ステップ管理
  const [currentStep, setCurrentStep] = useState<number>(1);

  // フォームデータ
  const [contactType, setContactType] = useState<ContactType | null>(null);
  const [category, setCategory] = useState<ContactCategory | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [contactEmail, setContactEmail] = useState<string>('');

  // 関連情報（URL パラメータから取得）
  const [shopId, setShopId] = useState<number | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);

  // UI状態
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // URLパラメータから初期値を設定
  useEffect(() => {
    const type = searchParams.get('type') as ContactType | null;
    const cat = searchParams.get('category') as ContactCategory | null;
    const shop = searchParams.get('shopId');
    const shopNameParam = searchParams.get('shopName');
    const review = searchParams.get('reviewId');
    const tag = searchParams.get('tagId');
    const image = searchParams.get('imageId');

    if (type && ['report', 'inquiry', 'request'].includes(type)) {
      setContactType(type);
      setCurrentStep(2);
    }

    if (cat) setCategory(cat);
    if (shop) setShopId(parseInt(shop));
    if (shopNameParam) setShopName(decodeURIComponent(shopNameParam));
    if (review) setReviewId(parseInt(review));
    if (tag) setTagId(parseInt(tag));
    if (image) setImageId(parseInt(image));
  }, [searchParams]);

  const handleTypeSelect = (type: ContactType) => {
    setContactType(type);
    setCategory(null); // カテゴリリセット
    setCurrentStep(2);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value as ContactCategory);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Step 2のバリデーション
      if (!category) {
        setError('カテゴリを選択してください');
        return;
      }
      if (!subject.trim()) {
        setError('件名を入力してください');
        return;
      }
      if (!description.trim()) {
        setError('詳細説明を入力してください');
        return;
      }
      if (!isLoggedIn && !contactEmail.trim()) {
        setError('メールアドレスを入力してください');
        return;
      }
    }

    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!contactType || !category) {
      setError('必要な情報が不足しています');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ContactSubmissionCreate = {
        contact_type: contactType,
        category,
        subject,
        description,
        shop: shopId,
        review: reviewId,
        tag: tagId,
        image: imageId,
        screenshot,
        contact_email: !isLoggedIn ? contactEmail : undefined,
      };

      await submitContact(data);
      setIsComplete(true);
      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: ContactCategory): string => {
    if (!contactType) return '';
    const option = CATEGORY_OPTIONS[contactType].find((opt) => opt.value === cat);
    return option?.label || '';
  };

  return (
    <>
      <Header />
      <div className={styles.contactPage}>
        <div className={styles.container}>
          <BackButton />

          <h1 className={styles.title}>お問い合わせ</h1>

        {/* ステップインジケーター */}
        {!isComplete && (
          <div className={styles.steps}>
            <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>1</div>
              <span>種別選択</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>2</div>
              <span>詳細入力</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>3</div>
              <span>確認</span>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: カテゴリ選択 */}
        {currentStep === 1 && (
          <div className={styles.categorySelection}>
            <div className={styles.categoryCard} onClick={() => handleTypeSelect('report')}>
              <Flag size={28} className={styles.categoryIcon} strokeWidth={1}/>
              <h3>報告</h3>
              <p>不適切なコンテンツや店舗情報の問題</p>
            </div>

            <div className={styles.categoryCard} onClick={() => handleTypeSelect('inquiry')}>
              <HelpCircle size={28} className={styles.categoryIcon} strokeWidth={1}/>
              <h3>問い合わせ</h3>
              <p>使い方やアカウントに関する質問</p>
            </div>

            <div className={styles.categoryCard} onClick={() => handleTypeSelect('request')}>
              <Lightbulb size={28} className={styles.categoryIcon} strokeWidth={1}/>
              <h3>要望</h3>
              <p>新機能のアイデアや改善提案</p>
            </div>
          </div>
        )}

        {/* Step 2: 詳細入力 */}
        {currentStep === 2 && contactType && (
          <div className={styles.detailForm}>
            <h2 className={styles.stepTitle}>
              {CONTACT_TYPE_LABELS[contactType]}の詳細
            </h2>

            {/* 報告対象の表示 */}
            {shopName && (
              <div className={styles.targetInfo}>
                <Store size={16} />
                <span>報告対象店舗: {shopName}</span>
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.label}>
                カテゴリ <span className={styles.required}>*</span>
              </label>
              <CustomRadioGroup
                options={CATEGORY_OPTIONS[contactType].map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                }))}
                value={category || ''}
                onChange={handleCategoryChange}
              />
            </div>

            <InputDefault
              label="件名"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="簡潔に問題を説明してください"
              isRequired
            />

            <div className={styles.formField}>
              <label className={styles.label}>
                詳細説明 <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="詳しい状況を教えてください"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            {/* 未ログインユーザー用のメールアドレス */}
            {!isLoggedIn && (
              <InputDefault
                label="連絡先メールアドレス"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                isRequired
              />
            )}

            {/* スクリーンショットアップロード */}
            <div className={styles.screenshotUpload}>
              <label htmlFor="screenshot" className={styles.uploadLabel}>
                <Camera size={20} />
                <span>スクリーンショットを添付（任意）</span>
              </label>
              <input
                type="file"
                id="screenshot"
                accept="image/*"
                onChange={handleScreenshotChange}
                className={styles.fileInput}
              />
              {screenshot && (
                <div className={styles.fileName}>
                  選択されたファイル: {screenshot.name}
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <ButtonGradientWrapper onClick={handleBack}>
                戻る
              </ButtonGradientWrapper>
              <ButtonGradient onClick={handleNext}>次へ</ButtonGradient>
            </div>
          </div>
        )}

        {/* Step 3: 確認画面 */}
        {currentStep === 3 && contactType && category && (
          <div className={styles.confirmation}>
            <h2 className={styles.stepTitle}>送信内容の確認</h2>
            <p className={styles.confirmationSubtitle}>以下の内容で送信します。よろしいですか？</p>

            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.cardHeader}>
                  <Flag size={18} strokeWidth={1} />
                  <span>問い合わせ情報</span>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>種別</span>
                    <span className={styles.summaryValue}>{CONTACT_TYPE_LABELS[contactType]}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>カテゴリ</span>
                    <span className={styles.summaryValue}>{getCategoryLabel(category)}</span>
                  </div>
                  {shopName && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>報告対象</span>
                      <span className={styles.summaryValue}>{shopName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.cardHeader}>
                  <AlertCircle size={18} strokeWidth={1} />
                  <span>詳細内容</span>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>件名</span>
                    <span className={styles.summaryValue}>{subject}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>詳細説明</span>
                    <p className={styles.summaryDescription}>{description}</p>
                  </div>
                  {screenshot && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>添付ファイル</span>
                      <div className={styles.filePreview}>
                        <Camera size={16} />
                        <span>{screenshot.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isLoggedIn && contactEmail && (
                <div className={styles.summaryCard}>
                  <div className={styles.cardHeader}>
                    <Store size={18} strokeWidth={1} />
                    <span>連絡先情報</span>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>メールアドレス</span>
                      <span className={styles.summaryValue}>{contactEmail}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <ButtonGradientWrapper onClick={handleBack}>
                戻る
              </ButtonGradientWrapper>
              <ButtonGradient onClick={handleSubmit} isDisabled={isSubmitting}>
                {isSubmitting ? '送信中...' : '送信する'}
              </ButtonGradient>
            </div>
          </div>
        )}

        {/* Step 4: 完了画面 */}
        {currentStep === 4 && isComplete && (
          <div className={styles.complete}>
            <div className={styles.completeIcon}>
              <CheckCircle size={64} strokeWidth={1}/>
            </div>
            <h2 className={styles.completeTitle}>送信完了</h2>
            <p className={styles.completeMessage}>
              お問い合わせを受け付けました。
              <br />
              内容を確認の上、順次対応させていただきます。
            </p>
            <ButtonGradient onClick={() => router.push('/')} anotherStyle={styles.homeButton}>
              トップページに戻る
            </ButtonGradient>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
