import { PublicUserProfile } from '@/types/users';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

/**
 * 公開ユーザープロフィールを取得する（認証不要）
 * @param uid ユーザーのUID
 * @returns PublicUserProfile | null
 */
export async function fetchPublicUserProfile(uid: string): Promise<PublicUserProfile | null> {
  try {
    // 公開プロフィールは認証不要なので通常のfetchを使用
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/user/${uid}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('ユーザーが見つかりません');
      }
      throw new Error('プロフィールの取得に失敗しました');
    }

    const data: PublicUserProfile = await response.json();
    return data;
  } catch (error) {
    console.error('Public profile fetch error:', error);
    throw error;
  }
}

/**
 * 自分のプロフィールをプレビューする（他のユーザーからどう見えるか）
 * 認証が必要なのでfetchWithAuthを使用
 * @returns PublicUserProfile | null
 */
export async function fetchProfilePreview(): Promise<PublicUserProfile | null> {
  try {
    const response = await fetchWithAuth('/accounts/profile-preview/');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`プレビューの取得に失敗しました (${response.status}): ${errorText}`);
    }

    const data: PublicUserProfile = await response.json();
    return data;
  } catch (error) {
    console.error('Profile preview fetch error:', error);
    throw error;
  }
}