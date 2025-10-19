'use client';

import { fetchWithSession } from '@/app/lib/fetchWithSession';
import { ShopSuggestion, SearchHistory } from '@/types/search';

// キーワードによる店舗候補検索
export const searchShopSuggestions = async (keyword: string): Promise<ShopSuggestion[]> => {
  if (!keyword.trim()) {
    return [];
  }

  try {
    const response = await fetchWithSession(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/search/?keyword=${encodeURIComponent(keyword)}&limit=10`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // レスポンスから店舗リストを抽出してShopSuggestion形式に変換
    return (data.results || []).map((shop: any) => ({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      shop_type: shop.shop_type?.name,
    }));
  } catch (error) {
    console.error('Failed to search shop suggestions:', error);
    return [];
  }
};

// 検索履歴の保存
export const saveSearchHistory = (keyword: string, resultCount?: number): void => {
  if (!keyword.trim()) return;

  try {
    const history = getSearchHistory();
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      keyword: keyword.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    // 重複を削除し、新しいエントリを先頭に追加
    const filteredHistory = history.filter(item => item.keyword !== keyword.trim());
    const updatedHistory = [newEntry, ...filteredHistory].slice(0, 20); // 最大20件

    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

// 検索履歴の取得
export const getSearchHistory = (): SearchHistory[] => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
};

// 検索履歴の削除
export const removeSearchHistory = (id: string): void => {
  try {
    const history = getSearchHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to remove search history:', error);
  }
};

// 検索履歴の全削除
export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem('searchHistory');
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};