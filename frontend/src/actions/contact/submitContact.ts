'use client';

import { fetchWithSession } from '@/app/lib/fetchWithSession';
import type { ContactSubmission, ContactSubmissionCreate } from '@/types/contact';

/**
 * 問い合わせを送信する
 */
export async function submitContact(
  data: ContactSubmissionCreate
): Promise<ContactSubmission> {
  try {
    const formData = new FormData();

    // 基本情報
    formData.append('contact_type', data.contact_type);
    formData.append('category', data.category);
    formData.append('subject', data.subject);
    formData.append('description', data.description);

    // 関連情報（存在する場合のみ）
    if (data.shop !== undefined && data.shop !== null) {
      formData.append('shop', data.shop.toString());
    }
    if (data.review !== undefined && data.review !== null) {
      formData.append('review', data.review.toString());
    }
    if (data.tag !== undefined && data.tag !== null) {
      formData.append('tag', data.tag.toString());
    }
    if (data.image !== undefined && data.image !== null) {
      formData.append('image', data.image.toString());
    }
    if (data.reported_user !== undefined && data.reported_user !== null) {
      formData.append('reported_user', data.reported_user.toString());
    }

    // スクリーンショット
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }

    // 連絡先メールアドレス（未ログインユーザー用）
    if (data.contact_email) {
      formData.append('contact_email', data.contact_email);
    }

    const response = await fetchWithSession('/contact-submissions/', {
      method: 'POST',
      body: formData,
      // Content-Typeは自動設定されるため指定しない
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `問い合わせの送信に失敗しました: ${response.status}`
      );
    }

    const result: ContactSubmission = await response.json();
    return result;
  } catch (error) {
    console.error('Contact submission error:', error);
    throw error instanceof Error
      ? error
      : new Error('問い合わせの送信中に予期しないエラーが発生しました');
  }
}

/**
 * 問い合わせ一覧を取得する（管理者用）
 */
export async function fetchContactSubmissions(): Promise<ContactSubmission[]> {
  try {
    const response = await fetchWithSession('/contact-submissions/', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`問い合わせ一覧の取得に失敗しました: ${response.status}`);
    }

    const data: ContactSubmission[] = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch contact submissions error:', error);
    return [];
  }
}
