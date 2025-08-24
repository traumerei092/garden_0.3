'use client'

import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Spinner,
  ScrollShadow,
  Accordion,
  AccordionItem
} from '@nextui-org/react';
import { 
  Search, 
  MapPin, 
  X, 
  Star,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';
import { Area } from '@/types/areas';
import { searchAreas, getAreaTree } from '@/actions/areas/areaActions';
import ChipSelected from '@/components/UI/ChipSelected';
import styles from './style.module.scss';

interface MyAreaSelectorProps {
  selectedAreas: Area[];
  primaryArea: Area | null;
  onAreasChange: (areas: Area[]) => void;
  onPrimaryAreaChange: (area: Area | null) => void;
  maxAreas?: number;
}

const MyAreaSelector: React.FC<MyAreaSelectorProps> = ({
  selectedAreas,
  primaryArea,
  onAreasChange,
  onPrimaryAreaChange,
  maxAreas = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Area[]>([]);
  const [prefectures, setPrefectures] = useState<Area[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrefectures, setIsLoadingPrefectures] = useState(false);

  // 都道府県データを取得
  useEffect(() => {
    const loadPrefectures = async () => {
      setIsLoadingPrefectures(true);
      try {
        const result = await getAreaTree();
        if (result.success && result.data) {
          setPrefectures(result.data);
        }
      } catch (error) {
        console.error('Failed to load prefectures:', error);
      } finally {
        setIsLoadingPrefectures(false);
      }
    };

    loadPrefectures();
  }, []);

  // 検索機能
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchAreas(searchQuery.trim());
        if (result.success && result.data) {
          setSearchResults(result.data.results);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // エリア追加
  const handleAreaAdd = (area: Area) => {
    if (selectedAreas.length >= maxAreas) {
      return;
    }

    // 重複チェック
    const isAlreadySelected = selectedAreas.some(selected => selected.id === area.id);
    if (isAlreadySelected) {
      return;
    }

    const newAreas = [...selectedAreas, area];
    onAreasChange(newAreas);

    // 初回選択時はプライマリエリアに設定
    if (!primaryArea && newAreas.length === 1) {
      onPrimaryAreaChange(area);
    }
  };

  // エリア削除
  const handleAreaRemove = (areaId: number) => {
    const newAreas = selectedAreas.filter(area => area.id !== areaId);
    onAreasChange(newAreas);

    // プライマリエリアが削除された場合
    if (primaryArea?.id === areaId) {
      onPrimaryAreaChange(newAreas.length > 0 ? newAreas[0] : null);
    }
  };

  // プライマリエリア設定
  const handleSetPrimary = (area: Area) => {
    onPrimaryAreaChange(area);
  };

  // エリアが選択済みかチェック
  const isAreaSelected = (area: Area) => {
    return selectedAreas.some(selected => selected.id === area.id);
  };

  // エリア項目描画
  const renderAreaItem = (area: Area) => (
    <div key={area.id} className={styles.areaItem}>
      <div className={styles.areaInfo}>
        <MapPin size={16} className={styles.areaIcon} />
        <div className={styles.areaText}>
          <span className={styles.areaName}>{area.name}</span>
          <span className={styles.areaFullName}>{area.get_full_name}</span>
        </div>
      </div>
      <div className={styles.areaActions}>
        {isAreaSelected(area) ? (
          <span className={styles.selectedLabel}>選択済み</span>
        ) : (
          selectedAreas.length < maxAreas && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              color="primary"
              onPress={() => handleAreaAdd(area)}
              className={styles.addButton}
            >
              <Plus size={16} />
            </Button>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.myAreaSelector}>
      {/* 選択済みエリア表示 */}
      {selectedAreas.length > 0 && (
        <div className={styles.selectedSection}>
          <h3 className={styles.sectionTitle}>
            選択済みエリア ({selectedAreas.length}/{maxAreas})
          </h3>
          <div className={styles.selectedChipsList}>
            {selectedAreas.map(area => (
              <div key={area.id} className={styles.selectedChipItem}>
                <ChipSelected>
                  {`${area.get_full_name || area.name}${primaryArea?.id === area.id ? ' (メイン)' : ''}`}
                </ChipSelected>
                <div className={styles.chipActions}>
                  {primaryArea?.id !== area.id && (
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => handleSetPrimary(area)}
                      className={styles.miniButton}
                    >
                      メイン
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => handleAreaRemove(area.id)}
                    className={styles.miniButton}
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 検索セクション */}
      <div className={styles.searchSection}>
        <Input
          placeholder="エリア名で検索（例：渋谷区、名古屋市）"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search size={18} />}
          endContent={
            searchQuery && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSearchQuery('')}
              >
                <X size={16} />
              </Button>
            )
          }
          classNames={{
            base: styles.searchInput,
            inputWrapper: styles.searchInputWrapper
          }}
        />

        {/* 検索結果 */}
        {searchQuery && (
          <div className={styles.searchResults}>
            {isSearching ? (
              <div className={styles.loading}>
                <Spinner size="sm" />
                <span>検索中...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <ScrollShadow className={styles.searchResultsList}>
                {searchResults.map(area => renderAreaItem(area))}
              </ScrollShadow>
            ) : (
              <p className={styles.noResults}>検索結果がありません</p>
            )}
          </div>
        )}
      </div>

      {/* 都道府県別選択 */}
      {!searchQuery && (
        <div className={styles.prefecturesSection}>
          <h3 className={styles.sectionTitle}>都道府県から選択</h3>
          {isLoadingPrefectures ? (
            <div className={styles.loading}>
              <Spinner size="sm" />
              <span>読み込み中...</span>
            </div>
          ) : (
            <ScrollShadow className={styles.prefecturesList}>
              <Accordion variant="splitted" className={styles.accordion}>
                {prefectures.map(prefecture => (
                  <AccordionItem
                    key={prefecture.id}
                    title={prefecture.name}
                    startContent={<MapPin size={16} />}
                    classNames={{
                      base: styles.accordionItem,
                      title: styles.accordionTitle,
                      content: styles.accordionContent
                    }}
                  >
                    <div className={styles.citiesList}>
                      {prefecture.children?.map(city => (
                        <div key={city.id} className={styles.cityGroup}>
                          {renderAreaItem(city)}
                          {/* 区レベルがある場合（政令指定都市）*/}
                          {city.children && city.children.length > 0 && (
                            <div className={styles.wardsList}>
                              {city.children.map(ward => renderAreaItem(ward))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollShadow>
          )}
        </div>
      )}
    </div>
  );
};

export default MyAreaSelector;