'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import AtmosphereSlider from '@/components/UI/AtmosphereSlider';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import styles from './style.module.scss';
import { AtmosphereIndicator, UserAtmospherePreference } from '@/types/users';
import { fetchAtmosphereIndicators, fetchUserAtmospherePreferences } from '@/actions/profile/fetchAtmosphereData';
import { updateAtmospherePreferences } from '@/actions/profile/updateAtmospherePreferences';
import { showToast } from '@/utils/toasts';

interface AtmosphereEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AtmosphereEditModal: React.FC<AtmosphereEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [indicators, setIndicators] = useState<AtmosphereIndicator[]>([]);
  const [preferences, setPreferences] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 雰囲気指標を取得
      const indicatorsResult = await fetchAtmosphereIndicators();
      if (indicatorsResult.success && indicatorsResult.data) {
        setIndicators(indicatorsResult.data);
        
        // 初期値を0に設定
        const initialPreferences: { [key: number]: number } = {};
        indicatorsResult.data.forEach(indicator => {
          initialPreferences[indicator.id] = 0;
        });
        
        // ユーザーの既存の雰囲気好みを取得
        const preferencesResult = await fetchUserAtmospherePreferences();
        if (preferencesResult.success && preferencesResult.data) {
          preferencesResult.data.forEach(pref => {
            initialPreferences[pref.indicator.id] = pref.score;
          });
        }
        
        setPreferences(initialPreferences);
      } else {
        showToast('雰囲気指標の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      showToast('データの取得に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (indicatorId: number, value: number) => {
    setPreferences(prev => ({
      ...prev,
      [indicatorId]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferencesData = Object.entries(preferences).map(([indicatorId, score]) => ({
        indicator_id: parseInt(indicatorId),
        score,
      }));

      const result = await updateAtmospherePreferences({
        preferences: preferencesData,
      });

      if (result.success) {
        showToast('雰囲気の好みを更新しました', 'success');
        onUpdate();
        onClose();
      } else {
        showToast(result.error || '雰囲気の好みの更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('雰囲気好み更新エラー:', error);
      showToast('雰囲気の好みの更新に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="雰囲気の好み">
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <LoadingSpinner />
            <p>雰囲気指標を読み込み中...</p>
          </div>
        ) : (
          <>
            <div className={styles.description}>
              <p>
                あなたの好みの店舗の雰囲気を設定してください。
                <br />
                各指標について、左右どちらの雰囲気がお好みかスライダーで選択できます。
              </p>
            </div>
            
            <div className={styles.sliders}>
              {indicators.map(indicator => (
                <AtmosphereSlider
                  key={indicator.id}
                  indicator={indicator}
                  value={preferences[indicator.id] || 0}
                  onChange={(value) => handleSliderChange(indicator.id, value)}
                  disabled={isSaving}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ModalButtons
        onCancel={handleCancel}
        onSave={handleSave}
        isLoading={isSaving}
        isDisabled={isLoading}
        cancelText="キャンセル"
        saveText="保存"
      />
    </Modal>
  );
};

export default AtmosphereEditModal;
