'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import RowSteps from '@/components/UI/RowSteps';
import AtmosphereSlider from '@/components/UI/AtmosphereSlider';
import InputDefault from '@/components/UI/InputDefault';
import ButtonGradient from '@/components/UI/ButtonGradient';
import ShopImpressionTag from '@/components/Shop/ShopImpressionTag';
import { Star } from 'lucide-react';
import styles from './style.module.scss';
import { Shop } from '@/types/shops';
import { AtmosphereIndicator } from '@/types/search';
import { fetchAtmosphereIndicators } from '@/actions/profile/fetchAtmosphereData';
import { toggleTagReaction } from '@/actions/shop/relation';
import { submitShopFeedback, FeedbackData } from '@/actions/shop/feedback';
import { getUserShopFeedbackFromStorage } from '@/utils/feedbackStorage';
import { saveShopFeedbackToStorage } from '@/utils/feedbackActions';
import { addImpressionTag } from '@/actions/shop/impressionTag';

interface ShopFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  onDataUpdate: () => void; // データ更新コールバック
}


const ShopFeedbackModal: React.FC<ShopFeedbackModalProps> = ({
  isOpen,
  onClose,
  shop,
  onDataUpdate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [atmosphereIndicators, setAtmosphereIndicators] = useState<AtmosphereIndicator[]>([]);
  const [atmosphereScores, setAtmosphereScores] = useState<{ [key: number]: number }>({});
  const [impressionTags, setImpressionTags] = useState<string[]>([]);
  const [newTagValue, setNewTagValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingTags, setExistingTags] = useState(shop.tags || []);

  // モーダルが開かれた時に雰囲気指標と既存データを取得
  useEffect(() => {
    if (isOpen) {
      loadAtmosphereIndicators();
      setExistingTags(shop.tags || []);
      loadUserFeedback();
    }
  }, [isOpen, shop.tags]);

  const loadUserFeedback = async () => {
    try {
      console.log('フィードバック取得開始 - shopId:', shop.id);

      // まずlocalStorageから取得を試行
      const existingFeedback = getUserShopFeedbackFromStorage(shop.id);
      console.log('localStorage取得結果:', existingFeedback);

      if (existingFeedback && existingFeedback.atmosphere_scores) {
        console.log('atmosphere_scores found:', existingFeedback.atmosphere_scores);

        // 既存のフィードバックデータを状態にセット
        const scores: { [key: number]: number } = {};
        Object.entries(existingFeedback.atmosphere_scores).forEach(([indicatorId, score]) => {
          const numericId = parseInt(indicatorId);
          scores[numericId] = score as number;
          console.log(`Setting score for indicator ${numericId}: ${score}`);
        });

        console.log('最終的に設定する雰囲気スコア:', scores);
        setAtmosphereScores(scores);
      } else {
        console.log('既存フィードバックが存在しないか、atmosphere_scoresが空です');
        console.log('existingFeedback:', existingFeedback);
      }
    } catch (error) {
      console.error('既存フィードバック取得エラー:', error);
    }
  };

  const loadAtmosphereIndicators = async () => {
    try {
      setIsLoading(true);
      const result = await fetchAtmosphereIndicators();
      if (result.success && result.data) {
        setAtmosphereIndicators(result.data);
      } else {
        console.error('雰囲気指標の取得に失敗:', result.error);
      }
    } catch (error) {
      console.error('雰囲気指標の取得に失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtmosphereScoreChange = (indicatorId: number, score: number) => {
    setAtmosphereScores(prev => ({
      ...prev,
      [indicatorId]: score
    }));
  };

  const handleAddTag = async () => {
    if (newTagValue.trim() && !impressionTags.includes(newTagValue.trim())) {
      try {
        // タグをサーバーに追加（ShopTagModal統一版）
        const apiResult = await addImpressionTag(shop.id, newTagValue.trim());

        // API結果をShopTag形式に変換して既存タグリストに追加
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

        // 追加したタグリストにも追加
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
      // タグの状態を楽観的に更新
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

      // サーバーにリクエスト送信
      await toggleTagReaction(tagId);
    } catch (error) {
      console.error('タグリアクションエラー:', error);
      // エラーの場合は元の状態に戻す
      setExistingTags(shop.tags || []);
    }
  };

  const handleAtmosphereFeedbackSubmit = async () => {
    try {
      const feedbackData: FeedbackData = {
        atmosphere_scores: atmosphereScores,
        impressionTags: []
      };

      try {
        // まずAPIに送信を試行
        await submitShopFeedback(shop.id, feedbackData);
        console.log('雰囲気フィードバック送信完了');
      } catch (error) {
        // API失敗時はlocalStorageに保存
        console.log('API失敗のためlocalStorageに保存:', error);
        saveShopFeedbackToStorage(shop.id, feedbackData);
      }
    } catch (error) {
      console.error('雰囲気フィードバック送信エラー:', error);
    }
  };

  const handleComplete = () => {
    // 完了ボタンはモーダルを閉じて親コンポーネントのデータ更新を実行
    handleModalClose();
    onDataUpdate(); // 親コンポーネントでデータ更新処理を実行
  };

  const handleModalClose = () => {
    setCurrentStep(0);
    setAtmosphereScores({});
    setImpressionTags([]);
    setNewTagValue('');
    onClose();
  };

  // ステップの定義
  const steps = [
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
      description: 'フィードバックありがとうございました！',
      content: (
        <div className={styles.completeStep}>
          <div className={styles.completionMessage}>
            <Star className={styles.starIcon} size={48} />
            <h3>フィードバック完了</h3>
            <p>{shop.name}へのフィードバックをありがとうございました。</p>
            <p>あなたの評価は他のユーザーの参考情報として活用されます。</p>
          </div>
        </div>
      )
    }
  ];

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // 雰囲気フィードバック
        return Object.keys(atmosphereScores).length > 0;
      case 1: // 印象タグ
        return true; // タグは任意なので常に進める
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // 雰囲気STEPで「更新して次へ」
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
      title={`${shop.name}へのフィードバック`}
      size="2xl"
    >
      <div className={styles.feedbackModal}>
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
                ? '更新して次へ'
                : '次へ'
          }
        />
      </div>
    </CustomModal>
  );
};

export default ShopFeedbackModal;