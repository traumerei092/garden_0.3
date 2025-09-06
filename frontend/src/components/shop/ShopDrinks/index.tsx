'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wine, Coffee, Sparkles, RefreshCw, Search, Filter, SortAsc, X, Tag, Star, Crown, Zap } from 'lucide-react';
import { Shop, ShopDrink } from '@/types/shops';
import { fetchShopDrinks } from '@/actions/shop/drinks';
import DrinkCard from '@/components/Shop/DrinkCard';
import DrinkRegisterModal from '@/components/Shop/DrinkRegisterModal';
import ButtonGradient from '@/components/UI/ButtonGradient';
import styles from './style.module.scss';

interface ShopDrinksProps {
  shop: Shop;
}

type SortOption = 'popular' | 'latest' | 'name' | 'category';
type ViewMode = 'grid' | 'category';

interface ActiveFilters {
  searchQuery: string;
  categories: number[];
  brands: number[];
  styles: number[];
  isAlcohol: boolean | null;
}

// カテゴリアイコンを取得する関数
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('ビール') || name.includes('beer')) return <Wine className={styles.categoryIcon} />;
  if (name.includes('ワイン') || name.includes('wine')) return <Star className={styles.categoryIcon} />;
  if (name.includes('日本酒') || name.includes('sake')) return <Crown className={styles.categoryIcon} />;
  if (name.includes('焼酎') || name.includes('shochu')) return <Zap className={styles.categoryIcon} />;
  if (name.includes('ウイスキー') || name.includes('whiskey')) return <Wine className={styles.categoryIcon} />;
  if (name.includes('カクテル') || name.includes('cocktail')) return <Sparkles className={styles.categoryIcon} />;
  if (name.includes('ノンアルコール') || name === 'ノンアルコール') return <Coffee className={styles.categoryIcon} />;
  return <Tag className={styles.categoryIcon} />;
};

const ShopDrinks: React.FC<ShopDrinksProps> = ({ shop }) => {
  const [drinks, setDrinks] = useState<ShopDrink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [showFilters, setShowFilters] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    searchQuery: '',
    categories: [],
    brands: [],
    styles: [],
    isAlcohol: null,
  });

  const loadDrinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetchShopDrinks(shop.id);
      setDrinks(response.drinks);
    } catch (error) {
      console.error('ドリンクメニューの読み込みに失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrinks();
  }, [shop.id]);

  const handleDrinkRegistered = (newDrink: ShopDrink) => {
    setDrinks(prev => [newDrink, ...prev]);
  };

  const handleReactionUpdate = (drinkId: number, newCount: number, userHasReacted: boolean) => {
    setDrinks(prev => prev.map(drink => 
      drink.id === drinkId 
        ? { ...drink, reaction_count: newCount, user_has_reacted: userHasReacted }
        : drink
    ));
  };

  // 高度なフィルタリングとソート
  const { filteredDrinks, drinksByCategory, availableFilters } = useMemo(() => {
    let filtered = drinks.filter(drink => {
      // 検索クエリフィルター
      if (activeFilters.searchQuery) {
        const query = activeFilters.searchQuery.toLowerCase();
        const matchesName = drink.name.toLowerCase().includes(query);
        const matchesCategory = drink.alcohol_category?.name.toLowerCase().includes(query) || false;
        const matchesBrand = drink.alcohol_brand?.name.toLowerCase().includes(query) || false;
        const matchesStyle = drink.drink_style?.name.toLowerCase().includes(query) || false;
        
        if (!matchesName && !matchesCategory && !matchesBrand && !matchesStyle) {
          return false;
        }
      }

      // アルコール/ノンアルコールフィルター
      if (activeFilters.isAlcohol !== null && drink.is_alcohol !== activeFilters.isAlcohol) {
        return false;
      }

      // カテゴリフィルター
      if (activeFilters.categories.length > 0 && 
          (!drink.alcohol_category || !activeFilters.categories.includes(drink.alcohol_category.id))) {
        return false;
      }

      // ブランドフィルター
      if (activeFilters.brands.length > 0 && 
          (!drink.alcohol_brand || !activeFilters.brands.includes(drink.alcohol_brand.id))) {
        return false;
      }

      // スタイルフィルター
      if (activeFilters.styles.length > 0 && 
          (!drink.drink_style || !activeFilters.styles.includes(drink.drink_style.id))) {
        return false;
      }

      return true;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.reaction_count - a.reaction_count;
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name, 'ja');
        case 'category':
          const aCat = a.alcohol_category?.name || 'その他';
          const bCat = b.alcohol_category?.name || 'その他';
          return aCat.localeCompare(bCat, 'ja');
        default:
          return 0;
      }
    });

    // カテゴリ別グループ化（見やすさを重視した順序）
    const byCategory = filtered.reduce((acc, drink) => {
      const categoryName = drink.alcohol_category?.name || (drink.is_alcohol ? 'その他のアルコール' : 'ノンアルコール');
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(drink);
      return acc;
    }, {} as Record<string, ShopDrink[]>);

    // カテゴリを人気度と論理的順序でソート
    const sortedCategoryEntries = Object.entries(byCategory).sort(([nameA, drinksA], [nameB, drinksB]) => {
      // ノンアルコールを最後に配置
      if (nameA === 'ノンアルコール') return 1;
      if (nameB === 'ノンアルコール') return -1;
      if (nameA === 'その他のアルコール') return 1;
      if (nameB === 'その他のアルコール') return -1;
      
      // 人気度（ドリンク数とリアクション合計）でソート
      const popularityA = drinksA.length + drinksA.reduce((sum, drink) => sum + drink.reaction_count, 0);
      const popularityB = drinksB.length + drinksB.reduce((sum, drink) => sum + drink.reaction_count, 0);
      
      if (popularityA !== popularityB) {
        return popularityB - popularityA; // 人気順（降順）
      }
      
      // 人気度が同じ場合は名前順
      return nameA.localeCompare(nameB, 'ja');
    });

    const sortedByCategory = Object.fromEntries(sortedCategoryEntries);

    // 利用可能なフィルターオプション
    const categories = Array.from(new Set(drinks.map(d => d.alcohol_category).filter(Boolean)));
    const brands = Array.from(new Set(drinks.map(d => d.alcohol_brand).filter(Boolean)));
    const styles = Array.from(new Set(drinks.map(d => d.drink_style).filter(Boolean)));

    return {
      filteredDrinks: filtered,
      drinksByCategory: sortedByCategory,
      availableFilters: { categories, brands, styles }
    };
  }, [drinks, activeFilters, sortBy]);

  const totalFiltered = filteredDrinks.length;
  const hasActiveFilters = activeFilters.searchQuery || 
    activeFilters.categories.length > 0 || 
    activeFilters.brands.length > 0 || 
    activeFilters.styles.length > 0 || 
    activeFilters.isAlcohol !== null;

  return (
    <div className={styles.container}>
      {/* メインヘッダー */}
      <div className={styles.mainHeader}>
        <div className={styles.titleSection}>
          <div className={styles.titleIcon}>
            <Wine className={styles.titleIconSvg} strokeWidth={1} />
          </div>
          <div className={styles.titleContent}>
            <h3 className={styles.title}>ドリンクメニュー</h3>
            <p>{totalFiltered} / {drinks.length} 件のドリンク</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadDrinks}
            disabled={isLoading}
            className={styles.refreshButton}
          >
            <RefreshCw className={`${styles.refreshIcon} ${isLoading ? styles.spinning : ''}`} strokeWidth={1} />
            更新
          </motion.button>

          <ButtonGradient
            onClick={() => setIsRegisterModalOpen(true)}
            anotherStyle={styles.registerButton}
          >
            <Plus className={styles.addIcon} strokeWidth={1} />
            ドリンク登録
          </ButtonGradient>
        </div>
      </div>

      {/* 検索・フィルター・ソートバー */}
      <div className={styles.searchFilterBar}>
        {/* 検索バー */}
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="ドリンク名、カテゴリ、ブランドで検索..."
            value={activeFilters.searchQuery}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className={styles.searchInput}
          />
          {activeFilters.searchQuery && (
            <button
              onClick={() => setActiveFilters(prev => ({ ...prev, searchQuery: '' }))}
              className={styles.clearSearchButton}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* フィルター・ソートボタン */}
        <div className={styles.controlButtons}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.controlButton} ${showFilters ? styles.active : ''}`}
          >
            <Filter size={16} />
            フィルター
            {hasActiveFilters && <span className={styles.filterBadge}></span>}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={styles.sortSelect}
          >
            <option value="popular">人気順</option>
            <option value="latest">最新順</option>
            <option value="name">名前順</option>
            <option value="category">カテゴリ順</option>
          </select>

          <div className={styles.viewModeToggle}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            >
              グリッド表示
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`${styles.viewButton} ${viewMode === 'category' ? styles.active : ''}`}
            >
              カテゴリ別表示
            </button>
          </div>
        </div>
      </div>

      {/* アクティブフィルターチップス */}
      {hasActiveFilters && (
        <div className={styles.activeFiltersSection}>
          <div className={styles.activeFiltersHeader}>
            <span>適用中のフィルター</span>
            <button
              onClick={() => setActiveFilters({
                searchQuery: '',
                categories: [],
                brands: [],
                styles: [],
                isAlcohol: null,
              })}
              className={styles.clearAllFilters}
            >
              すべてクリア
            </button>
          </div>
          <div className={styles.activeFiltersChips}>
            {activeFilters.isAlcohol !== null && (
              <span className={styles.filterChip}>
                {activeFilters.isAlcohol ? 'アルコール' : 'ノンアルコール'}
                <button onClick={() => setActiveFilters(prev => ({ ...prev, isAlcohol: null }))}>
                  <X size={12} />
                </button>
              </span>
            )}
            {activeFilters.categories.map(catId => {
              const category = availableFilters.categories.find(c => c?.id === catId);
              return category ? (
                <span key={catId} className={styles.filterChip}>
                  {category.name}
                  <button onClick={() => setActiveFilters(prev => ({
                    ...prev,
                    categories: prev.categories.filter(id => id !== catId)
                  }))}>
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
            {activeFilters.brands.map(brandId => {
              const brand = availableFilters.brands.find(b => b?.id === brandId);
              return brand ? (
                <span key={brandId} className={styles.filterChip}>
                  {brand.name}
                  <button onClick={() => setActiveFilters(prev => ({
                    ...prev,
                    brands: prev.brands.filter(id => id !== brandId)
                  }))}>
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
            {activeFilters.styles.map(styleId => {
              const style = availableFilters.styles.find(s => s?.id === styleId);
              return style ? (
                <span key={styleId} className={styles.filterChip}>
                  {style.name}
                  <button onClick={() => setActiveFilters(prev => ({
                    ...prev,
                    styles: prev.styles.filter(id => id !== styleId)
                  }))}>
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* 詳細フィルターパネル */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.filtersPanel}
          >
            <div className={styles.filtersGrid}>
              {/* アルコール/ノンアルコールフィルター */}
              <div className={styles.filterGroup}>
                <h4>タイプ</h4>
                <div className={styles.filterOptions}>
                  <button
                    onClick={() => setActiveFilters(prev => ({ 
                      ...prev, 
                      isAlcohol: prev.isAlcohol === true ? null : true 
                    }))}
                    className={`${styles.filterOption} ${activeFilters.isAlcohol === true ? styles.selected : ''}`}
                  >
                    <Wine size={16} />
                    アルコール
                  </button>
                  <button
                    onClick={() => setActiveFilters(prev => ({ 
                      ...prev, 
                      isAlcohol: prev.isAlcohol === false ? null : false 
                    }))}
                    className={`${styles.filterOption} ${activeFilters.isAlcohol === false ? styles.selected : ''}`}
                  >
                    <Coffee size={16} />
                    ノンアルコール
                  </button>
                </div>
              </div>

              {/* カテゴリフィルター */}
              <div className={styles.filterGroup}>
                <h4>カテゴリ</h4>
                <div className={styles.filterOptions}>
                  {availableFilters.categories.map(category => category ? (
                    <button
                      key={category.id}
                      onClick={() => setActiveFilters(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category.id)
                          ? prev.categories.filter(id => id !== category.id)
                          : [...prev.categories, category.id]
                      }))}
                      className={`${styles.filterOption} ${activeFilters.categories.includes(category.id) ? styles.selected : ''}`}
                    >
                      <Tag size={16} />
                      {category.name}
                    </button>
                  ) : null)}
                </div>
              </div>

              {/* ブランドフィルター */}
              {availableFilters.brands.length > 0 && (
                <div className={styles.filterGroup}>
                  <h4>ブランド</h4>
                  <div className={styles.filterOptions}>
                    {availableFilters.brands.map(brand => brand ? (
                      <button
                        key={brand.id}
                        onClick={() => setActiveFilters(prev => ({
                          ...prev,
                          brands: prev.brands.includes(brand.id)
                            ? prev.brands.filter(id => id !== brand.id)
                            : [...prev.brands, brand.id]
                        }))}
                        className={`${styles.filterOption} ${activeFilters.brands.includes(brand.id) ? styles.selected : ''}`}
                      >
                        <Star size={16} />
                        {brand.name}
                      </button>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* スタイルフィルター */}
              {availableFilters.styles.length > 0 && (
                <div className={styles.filterGroup}>
                  <h4>飲み方・スタイル</h4>
                  <div className={styles.filterOptions}>
                    {availableFilters.styles.map(style => style ? (
                      <button
                        key={style.id}
                        onClick={() => setActiveFilters(prev => ({
                          ...prev,
                          styles: prev.styles.includes(style.id)
                            ? prev.styles.filter(id => id !== style.id)
                            : [...prev.styles, style.id]
                        }))}
                        className={`${styles.filterOption} ${activeFilters.styles.includes(style.id) ? styles.selected : ''}`}
                      >
                        <Sparkles size={16} />
                        {style.name}
                      </button>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ローディング状態 */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <RefreshCw className={styles.loadingIcon} strokeWidth={1} />
            <span>ドリンクメニューを読み込み中...</span>
          </div>
        </div>
      )}

      {/* ドリンク一覧 */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.animateContainer}
          >
            {filteredDrinks.length > 0 ? (
              viewMode === 'grid' ? (
                <div className={styles.drinksGrid}>
                  {filteredDrinks.map((drink, index) => (
                    <motion.div
                      key={drink.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={styles.drinkCardContainer}
                    >
                      <DrinkCard
                        drink={drink}
                        onReactionUpdate={handleReactionUpdate}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.categoryView}>
                  {Object.entries(drinksByCategory).map(([categoryName, categoryDrinks], categoryIndex) => (
                    <motion.div
                      key={categoryName}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.2 }}
                      className={styles.categorySection}
                    >
                      <div className={styles.categoryHeader}>
                        <div className={styles.categoryTitleSection}>
                          {getCategoryIcon(categoryName)}
                          <h4 className={styles.categoryTitle}>{categoryName}</h4>
                        </div>
                        <div className={styles.categoryMeta}>
                          <span className={styles.categoryCount}>{categoryDrinks.length} 件</span>
                          <span className={styles.categoryPopularity}>
                            <Star size={14} />
                            {categoryDrinks.reduce((sum, drink) => sum + drink.reaction_count, 0)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.categoryDrinksGrid}>
                        {categoryDrinks.map((drink, index) => (
                          <motion.div
                            key={drink.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                            className={styles.categoryDrinkCard}
                          >
                            <DrinkCard
                              drink={drink}
                              onReactionUpdate={handleReactionUpdate}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  {activeFilters.isAlcohol === true ? (
                    <Wine className={styles.emptyIconSvg} strokeWidth={1} />
                  ) : activeFilters.isAlcohol === false ? (
                    <Coffee className={styles.emptyIconSvg} strokeWidth={1} />
                  ) : (
                    <Sparkles className={styles.emptyIconSvg} strokeWidth={1} />
                  )}
                </div>
                <h4 className={styles.emptyTitle}>
                  {activeFilters.isAlcohol === true ? 'アルコールドリンクが見つかりません' :
                   activeFilters.isAlcohol === false ? 'ノンアルコールドリンクが見つかりません' :
                   hasActiveFilters ? '条件に一致するドリンクが見つかりません' :
                   'ドリンクメニューがありません'}
                </h4>
                <p className={styles.emptyDescription}>
                  新しいドリンクを登録して、お店のメニューを充実させましょう
                </p>
                <ButtonGradient
                  onClick={() => setIsRegisterModalOpen(true)}
                  anotherStyle={styles.emptyButton}
                >
                  <Plus className={styles.emptyButtonIcon} strokeWidth={1} />
                  最初のドリンクを登録
                </ButtonGradient>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登録モーダル */}
      <DrinkRegisterModal
        shopId={shop.id}
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleDrinkRegistered}
      />
    </div>
  );
};

export default ShopDrinks;
