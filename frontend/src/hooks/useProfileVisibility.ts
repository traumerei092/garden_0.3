import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { ProfileVisibilitySettings } from '@/types/users';
import { fetchProfileVisibilitySettings, updateProfileVisibilitySettings } from '@/actions/profile/profileVisibility';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';

/**
 * プロフィール公開設定を管理するカスタムフック
 */
export const useProfileVisibility = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 公開設定データを取得
  const { data: visibilitySettings, error, mutate: mutateVisibility } = useSWR<ProfileVisibilitySettings>(
    'profile-visibility-settings',
    async () => {
      const result = await fetchProfileVisibilitySettings();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || '公開設定の取得に失敗しました');
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // 個別の公開設定を更新
  const updateVisibilitySetting = async (field: keyof ProfileVisibilitySettings, value: boolean) => {
    if (!visibilitySettings) return;

    setIsLoading(true);
    try {
      const updates = { [field]: value };
      const result = await updateProfileVisibilitySettings(updates);

      if (result.success && result.data) {
        // ローカル状態を即座に更新
        mutateVisibility({ ...visibilitySettings, ...result.data }, false);
        showProfileUpdateToast();
      } else {
        showErrorToast(result.error || '公開設定の更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    visibilitySettings: visibilitySettings || {
      age: true,
      my_area: true,
      interests: true,
      blood_type: true,
      mbti: true,
      occupation: true,
      industry: true,
      position: true,
      alcohol_preferences: true,
      hobbies: true,
      exercise_frequency: true,
      dietary_preference: true,
      atmosphere_preferences: true,
      visit_purposes: true,
    },
    isLoading: isLoading || !visibilitySettings,
    error,
    updateVisibilitySetting,
  };
};