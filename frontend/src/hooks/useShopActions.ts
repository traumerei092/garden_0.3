'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shop, ShopStats } from '@/types/shops';
import { toggleShopRelation, fetchShopStats } from '@/actions/shop/relation';

// デフォルトのリレーションタイプ定義（APIレスポンスと一致）
export const DEFAULT_RELATIONS = {
  favorite: {
    id: 1,
    name: 'favorite',
    label: '行きつけ',
    count: 0,
    color: '#00ffff'
  },
  visited: {
    id: 2,
    name: 'visited',
    label: '行った',
    count: 0,
    color: '#ffc107'
  },
  interested: {
    id: 3,
    name: 'interested',
    label: '行きたい',
    count: 0,
    color: '#ef4444'
  }
};

interface UseShopActionsProps {
  shops: Shop[];
  onFeedbackModalOpen?: (shopId: number) => void;
}

interface ShopActionState {
  shopStats: { [key: number]: ShopStats };
  loadingRelations: { [key: number]: boolean };
  isLoading: boolean;
}

export const useShopActions = ({ shops, onFeedbackModalOpen }: UseShopActionsProps) => {
  const [state, setState] = useState<ShopActionState>({
    shopStats: {},
    loadingRelations: {},
    isLoading: true
  });

  // 各店舗の統計データを取得
  const loadShopStats = useCallback(async () => {
    if (!shops.length) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    const newShopStats: { [key: number]: ShopStats } = {};

    for (const shop of shops) {
      try {
        const stats = await fetchShopStats(shop.id.toString());
        newShopStats[shop.id] = stats;
      } catch (error) {
        console.error(`店舗${shop.id}の統計データ取得に失敗:`, error);
        // デフォルトの統計データを設定
        newShopStats[shop.id] = {
          counts: [
            { id: 1, name: 'favorite', label: '行きつけ', count: 0, color: '#00ffff' },
            { id: 2, name: 'visited', label: '行った', count: 0, color: '#ffc107' },
            { id: 3, name: 'interested', label: '行きたい', count: 0, color: '#ef4444' }
          ],
          user_relations: []
        };
      }
    }

    setState(prev => ({
      ...prev,
      shopStats: newShopStats,
      isLoading: false
    }));
  }, [shops]);

  // 店舗データが変更されたら統計データを再取得
  useEffect(() => {
    loadShopStats();
  }, [loadShopStats]);

  // リレーションの切り替え処理（統一ロジック）
  const handleRelationToggle = useCallback(async (shopId: number, relationTypeId: number) => {
    console.log('🔥 useShopActions handleRelationToggle:', {
      shopId,
      relationTypeId,
      isVisited: relationTypeId === DEFAULT_RELATIONS.visited.id,
      currentStats: state.shopStats[shopId]
    });

    if (state.loadingRelations[relationTypeId]) return;

    // 現在のリレーション状態を確認
    const currentStats = state.shopStats[shopId];
    const userRelations: { [key: number]: boolean } = {};
    if (currentStats?.user_relations) {
      currentStats.user_relations.forEach((relId: number) => {
        userRelations[relId] = true;
      });
    }

    // visitedRelation（「行った」ボタン）の特別処理
    const isVisited = userRelations[DEFAULT_RELATIONS.visited.id] || false;

    if (relationTypeId === DEFAULT_RELATIONS.visited.id) {
      if (!isVisited) {
        // 未訪問 → 訪問済み: リレーション設定 + モーダル表示
        console.log('🔥 Setting visited relation and opening feedback modal');

        // まずリレーション設定
        setState(prev => ({
          ...prev,
          loadingRelations: { ...prev.loadingRelations, [relationTypeId]: true }
        }));

        try {
          await toggleShopRelation(shopId.toString(), relationTypeId);

          // 統計データを更新
          const updatedStats = await fetchShopStats(shopId.toString());
          setState(prev => ({
            ...prev,
            shopStats: { ...prev.shopStats, [shopId]: updatedStats },
            loadingRelations: { ...prev.loadingRelations, [relationTypeId]: false }
          }));

          // フィードバックモーダルを開く
          if (onFeedbackModalOpen) {
            onFeedbackModalOpen(shopId);
          }
        } catch (error) {
          console.error('visitedリレーションの設定に失敗:', error);
          setState(prev => ({
            ...prev,
            loadingRelations: { ...prev.loadingRelations, [relationTypeId]: false }
          }));
        }

        return;
      } else {
        // 訪問済み → 未訪問: リレーション解除のみ
        console.log('🔥 Removing visited relation');
      }
    }

    // 通常のリレーション切り替え処理
    setState(prev => ({
      ...prev,
      loadingRelations: { ...prev.loadingRelations, [relationTypeId]: true }
    }));

    try {
      await toggleShopRelation(shopId.toString(), relationTypeId);

      // 統計データを更新
      const updatedStats = await fetchShopStats(shopId.toString());
      setState(prev => ({
        ...prev,
        shopStats: { ...prev.shopStats, [shopId]: updatedStats }
      }));
    } catch (error) {
      console.error('リレーションの切り替えに失敗:', error);
    } finally {
      setState(prev => ({
        ...prev,
        loadingRelations: { ...prev.loadingRelations, [relationTypeId]: false }
      }));
    }
  }, [state.shopStats, state.loadingRelations, onFeedbackModalOpen]);

  // 指定された店舗のユーザーリレーション情報を取得
  const getUserRelations = useCallback((shopId: number): { [key: number]: boolean } => {
    const stats = state.shopStats[shopId];
    const userRelations: { [key: number]: boolean } = {};

    if (stats?.user_relations) {
      stats.user_relations.forEach((relationTypeId: number) => {
        userRelations[relationTypeId] = true;
      });
    }

    return userRelations;
  }, [state.shopStats]);

  // 統計データ更新後のコールバック（フィードバック完了時など）
  const refreshShopStats = useCallback(async (shopId: number) => {
    try {
      const updatedStats = await fetchShopStats(shopId.toString());
      setState(prev => ({
        ...prev,
        shopStats: { ...prev.shopStats, [shopId]: updatedStats }
      }));
    } catch (error) {
      console.error('統計データの更新に失敗:', error);
    }
  }, []);

  return {
    shopStats: state.shopStats,
    loadingRelations: state.loadingRelations,
    isLoading: state.isLoading,
    handleRelationToggle,
    getUserRelations,
    refreshShopStats,
    relations: DEFAULT_RELATIONS
  };
};