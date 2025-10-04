'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import RowSteps from '@/components/UI/RowSteps';
import AtmosphereSlider from '@/components/UI/AtmosphereSlider';
import InputDefault from '@/components/UI/InputDefault';
import ButtonGradient from '@/components/UI/ButtonGradient';
import ShopImpressionTag from '@/components/Shop/ShopImpressionTag';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import { Star } from 'lucide-react';
import styles from './style.module.scss';
import { Shop } from '@/types/shops';
import { AtmosphereIndicator } from '@/types/users';
import { VisitPurpose } from '@/types/shops';
import { fetchAtmosphereIndicators } from '@/actions/profile/fetchAtmosphereData';
import { fetchVisitPurposes } from '@/actions/shop/reviews';
import { submitRegularUsageScene } from '@/actions/shop/regularUsageScene';
import { toggleTagReaction } from '@/actions/shop/relation';
import { submitShopFeedback, FeedbackData } from '@/actions/shop/feedback';
import { getUserShopFeedbackFromStorage } from '@/utils/feedbackStorage';
import { saveShopFeedbackToStorage } from '@/utils/feedbackActions';
import { addImpressionTag } from '@/actions/shop/impressionTag';

interface RegularFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  onDataUpdate: () => void;
}

const RegularFeedbackModal: React.FC<RegularFeedbackModalProps> = ({
  isOpen,
  onClose,
  shop,
  onDataUpdate
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: 利用シーン関連
  const [visitPurposes, setVisitPurposes] = useState<VisitPurpose[]>([]);
  const [selectedVisitPurposes, setSelectedVisitPurposes] = useState<string[]>([]);

  // Step 2: 雰囲気フィードバック関連
  const [atmosphereIndicators, setAtmosphereIndicators] = useState<AtmosphereIndicator[]>([]);
  const [atmosphereScores, setAtmosphereScores] = useState<{ [key: number]: number }>({});

  // Step 3: 印象タグ関連
  const [impressionTags, setImpressionTags] = useState<string[]>([]);
  const [newTagValue, setNewTagValue] = useState('');
  const [existingTags, setExistingTags] = useState(shop.tags || []);

  const [isLoading, setIsLoading] = useState(false);

  // モーダルが開かれた時に必要なデータを取得
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setExistingTags(shop.tags || []);
      loadUserFeedback();
    }
  }, [isOpen, shop.tags]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [purposesData, indicatorsResponse] = await Promise.all([
        fetchVisitPurposes(),
        fetchAtmosphereIndicators()
      ]);
      setVisitPurposes(purposesData);

      if (indicatorsResponse.success && indicatorsResponse.data) {
        setAtmosphereIndicators(indicatorsResponse.data);
      } else {
        console.error('雰囲気指標の取得に失敗:', indicatorsResponse.error);
      }
    } catch (error) {
      console.error('初期データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFeedback = async () => {
    try {
      const savedFeedback = getUserShopFeedbackFromStorage(shop.id);
      if (savedFeedback?.atmosphere_scores) {
        setAtmosphereScores(savedFeedback.atmosphere_scores);
      }
    } catch (error) {
      console.error('保存済みフィードバック取得エラー:', error);
    }
  };

  // 利用シーン選択の処理
  const handleVisitPurposeChange = (purposes: string[]) => {
    setSelectedVisitPurposes(purposes);
  };

  // 雰囲気スコア変更の処理
  const handleAtmosphereScoreChange = (indicatorId: number, score: number) => {
    setAtmosphereScores(prev => ({
      ...prev,
      [indicatorId]: score
    }));
  };

  // 印象タグ追加の処理
  const handleAddTag = async () => {
    if (newTagValue.trim() && !impressionTags.includes(newTagValue.trim())) {
      try {
        const apiResult = await addImpressionTag(shop.id, newTagValue.trim());

        const newTag: typeof shop.tags[0] = {
          id: apiResult.id,
          shop: apiResult.shop,
          value: apiResult.value,
          created_at: apiResult.created_at,
          reaction_count: apiResult.reaction_count,
          is_creator: apiResult.is_creator,
          user_has_reacted: apiResult.user_has_reacted,
          created_by: apiResult.created_by
        };
        setExistingTags(prev => [...prev, newTag]);
        setImpressionTags(prev => [...prev, newTagValue.trim()]);
        setNewTagValue('');

        console.log('印象タグ追加完了:', newTagValue.trim(), apiResult);
      } catch (error) {
        console.error('印象タグ追加エラー:', error);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setImpressionTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagReaction = async (tagId: number) => {
    try {
      const updatedTags = existingTags.map(tag => {
        if (tag.id === tagId) {
          const newUserHasReacted = !tag.user_has_reacted;
          const newReactionCount = newUserHasReacted
            ? tag.reaction_count + 1
            : tag.reaction_count - 1;

          return {
            ...tag,
            user_has_reacted: newUserHasReacted,
            reaction_count: newReactionCount
          };
        }
        return tag;
      });

      setExistingTags(updatedTags);
      await toggleTagReaction(tagId);
    } catch (error) {
      console.error('タグリアクションエラー:', error);
      setExistingTags(shop.tags || []);
    }
  };

  // 利用シーン登録処理
  const handleUsageSceneSubmit = async () => {
    try {
      const visitPurposeIds = selectedVisitPurposes.map(id => parseInt(id));
      await submitRegularUsageScene(shop.id, { visit_purpose_ids: visitPurposeIds });
      console.log('利用シーン登録完了');
    } catch (error) {
      console.error('利用シーン登録エラー:', error);
    }
  };

  // 雰囲気フィードバック登録処理
  const handleAtmosphereFeedbackSubmit = async () => {
    try {
      const feedbackData: FeedbackData = {
        atmosphere_scores: atmosphereScores,
        impressionTags: []
      };

      try {
        await submitShopFeedback(shop.id, feedbackData);
        console.log('雰囲気フィードバック送信完了');
      } catch (error) {
        console.log('API失敗のためlocalStorageに保存:', error);
        saveShopFeedbackToStorage(shop.id, feedbackData);
      }
    } catch (error) {
      console.error('雰囲気フィードバック送信エラー:', error);
    }
  };

  const handleComplete = () => {
    handleModalClose();
    onDataUpdate();
  };

  const handleModalClose = () => {
    setCurrentStep(0);
    setSelectedVisitPurposes([]);
    setAtmosphereScores({});
    setImpressionTags([]);
    setNewTagValue('');
    onClose();
  };

  // ステップの定義
  const steps = [
    {
      title: '利用シーン',
      description: 'どのような目的でこの店舗を利用しますか？',
      content: (
        <div className={styles.usageSceneStep}>
          <div className={styles.stepDescription}>
            <p>常連客として、どのような場面でこの店舗を利用するかを選択してください。複数選択可能です。</p>
          </div>
          {isLoading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : (
            <CustomCheckboxGroup
              name="visitPurposes"
              values={selectedVisitPurposes}
              onChange={handleVisitPurposeChange}
              options={visitPurposes.map(purpose => ({
                label: purpose.name,
                value: purpose.id.toString()
              }))}
            />
          )}
        </div>
      )
    },
    {
      title: '雰囲気',
      description: 'この店舗の雰囲気はいかがでしたか？',
      content: (
        <div className={styles.atmosphereStep}>
          <div className={styles.stepDescription}>
            <p>実際に訪れた店舗の雰囲気を評価してください。あなたの評価は他のユーザーの参考情報として活用されます。</p>
          </div>
          {isLoading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : (
            <div className={styles.atmosphereList}>
              {atmosphereIndicators.map(indicator => (
                <AtmosphereSlider
                  key={indicator.id}
                  indicator={indicator}
                  value={atmosphereScores[indicator.id] || 0}
                  onChange={(score) => handleAtmosphereScoreChange(indicator.id, score)}
                />
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: '印象',
      description: 'この店舗の印象を教えてください',
      content: (
        <div className={styles.impressionStep}>
          <div className={styles.stepDescription}>
            <p>店舗の印象をタグで表現してください。既存のタグに共感したり、新しいタグを追加できます。</p>
          </div>

          {/* 既存タグエリア */}
          <div className={styles.existingTags}>
            <h4>既存の印象タグ</h4>
            <div className={styles.tagsContainer}>
              {existingTags && existingTags.length > 0 ? (
                existingTags.map((tag) => (
                  <ShopImpressionTag
                    key={tag.id}
                    id={tag.id}
                    label={tag.value}
                    count={tag.reaction_count}
                    isCreator={tag.is_creator}
                    userHasReacted={tag.user_has_reacted}
                    onClick={() => handleTagReaction(tag.id)}
                  />
                ))
              ) : (
                <p className={styles.placeholder}>まだ印象タグがありません</p>
              )}
            </div>
          </div>

          {/* 新規タグ追加エリア */}
          <div className={styles.newTagArea}>
            <h4>新しい印象タグを追加</h4>
            <div className={styles.tagInput}>
              <InputDefault
                label="印象タグ"
                placeholder="例: アットホーム、おしゃれ、静か"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                type="text"
              />
              <ButtonGradient
                onClick={handleAddTag}
                anotherStyle={!newTagValue.trim() ? styles.disabledButton : ''}
                size="sm"
              >
                追加
              </ButtonGradient>
            </div>

            {impressionTags.length > 0 && (
              <div className={styles.addedTags}>
                <h5>追加したタグ</h5>
                <div className={styles.tagsContainer}>
                  {impressionTags.map((tag, index) => (
                    <div key={index} className={styles.tag}>
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className={styles.removeTag}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: '完了',
      description: '常連フィードバックありがとうございました！',
      content: (
        <div className={styles.completeStep}>
          <div className={styles.completionMessage}>
            <Star className={styles.starIcon} size={48} />
            <h3>常連フィードバック完了</h3>
            <p>{shop.name}への常連フィードバックをありがとうございました。</p>
            <p>あなたの利用シーンと評価は他のユーザーの参考情報として活用されます。</p>
          </div>
        </div>
      )
    }
  ];

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // 利用シーン
        return selectedVisitPurposes.length > 0;
      case 1: // 雰囲気フィードバック
        return Object.keys(atmosphereScores).length > 0;
      case 2: // 印象タグ
        return true; // タグは任意なので常に進める
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // 利用シーンSTEPで登録
      await handleUsageSceneSubmit();
    } else if (currentStep === 1) {
      // 雰囲気STEPで登録
      await handleAtmosphereFeedbackSubmit();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={`${shop.name}の常連フィードバック`}
      size="2xl"
    >
      <div className={styles.regularFeedbackModal}>
        <RowSteps
          steps={steps}
          currentStep={currentStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceedToNext={canProceedToNext()}
          isLastStep={currentStep === steps.length - 1}
          nextButtonText={
            currentStep === steps.length - 1
              ? '完了'
              : currentStep === 0
                ? '登録して次へ'
                : currentStep === 1
                  ? '更新して次へ'
                  : '次へ'
          }
        />
      </div>
    </CustomModal>
  );
};

export default RegularFeedbackModal;