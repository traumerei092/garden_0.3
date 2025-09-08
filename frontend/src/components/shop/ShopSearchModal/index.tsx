'use client';

import React, { useState, useEffect } from 'react';
import { Button, Chip, Divider, Input, ScrollShadow } from '@nextui-org/react';
import CustomModal from '@/components/UI/Modal';
import CustomTabs, { TabItem } from '@/components/UI/CustomTabs';
import AtmosphereSlider from '@/components/UI/AtmosphereSlider';
import CheckboxCustom from '@/components/UI/CheckboxCustom';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import CustomRadioGroup from '@/components/UI/RadioGroup';
import ButtonGradient from '@/components/UI/ButtonGradient';
import CheckboxGroup from "@/components/UI/CheckboxGroup";
import MyAreaSelector from '@/components/Account/MyAreaSelector';
import styles from './style.module.scss';
import { Users, Heart, Settings, MapPin, Coffee, Wine, Filter } from 'lucide-react';
import { fetchUserProfile as fetchProfile } from '@/actions/profile/fetchProfile';
import { fetchProfileOptions } from '@/actions/profile/fetchProfileOptions';
import { fetchAtmosphereIndicators } from '@/actions/shop/search';
import { fetchShopTypes } from '@/actions/shop/fetchShopTypes';
import { fetchShopLayouts } from "@/actions/shop/fetchShopLayouts";
import { fetchShopOptions } from "@/actions/shop/fetchShopOptions";
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { ShopType, ShopLayout, ShopOption } from "@/types/shops";
import { Area } from '@/types/areas';
import {
  SearchFilters,
  ShopSearchModalProps,
  AtmosphereIndicator,
  UserProfile,
  SearchCategory
} from '@/types/search';


const ShopSearchModal: React.FC<ShopSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  isLoading = false
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [atmosphereIndicators, setAtmosphereIndicators] = useState<AtmosphereIndicator[]>([]);
  const [useProfileData, setUseProfileData] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('regulars');
  const [profileOptions, setProfileOptions] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ id: number; value: string }>>([]);
  const [allTags, setAllTags] = useState<Array<{ id: number; value: string }>>([]);
  const [drinkInput, setDrinkInput] = useState('');
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [drinkSuggestions, setDrinkSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [allDrinks, setAllDrinks] = useState<Array<{ id: number; name: string }>>([]);
  const user = useAuthStore((state) => state.user);
  const [shopTypeOptions, setShopTypeOptions] = useState<ShopType[]>([]);
  const [shopLayoutOptions, setShopLayoutOptions] = useState<ShopLayout[]>([]);
  const [shopOptionOptions, setShopOptionOptions] = useState<ShopOption[]>([]);
  const [alcoholBrands, setAlcoholBrands] = useState<Array<{ id: number; name: string; category: { id: number; name: string } }>>([]);
  const [alcoholCategories, setAlcoholCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [primaryArea, setPrimaryArea] = useState<Area | null>(null);
  const [shopCount, setShopCount] = useState<number>(0);

  // 検索カテゴリの定義
  const searchCategories = [
    {
      key: 'regulars' as SearchCategory,
      label: '常連さん',
      icon: Users,
      description: '常連さんとの共通点で探す'
    },
    {
      key: 'atmosphere' as SearchCategory,
      label: '雰囲気・印象',
      icon: Heart,
      description: '好みの雰囲気で探す'
    },
    {
      key: 'area' as SearchCategory,
      label: 'エリア',
      icon: MapPin,
      description: '地域・エリアで探す'
    },
    {
      key: 'basic' as SearchCategory,
      label: '基本条件',
      icon: Settings,
      description: '予算・営業時間・座席数で探す'
    },
    {
      key: 'features' as SearchCategory,
      label: 'お店の特徴',
      icon: Coffee,
      description: 'タイプ・座席・設備で探す'
    },
    {
      key: 'drinks' as SearchCategory,
      label: 'ドリンク',
      icon: Wine,
      description: 'お酒の種類・銘柄で探す'
    }
  ];

  // 雰囲気指標データの取得
  useEffect(() => {
    const fetchAtmosphereIndicatorsData = async () => {
      try {
        const indicators = await fetchAtmosphereIndicators();
        setAtmosphereIndicators(indicators);
      } catch (error) {
        console.error('雰囲気指標の取得に失敗:', error);
      }
    };

    const fetchTagsData = async () => {
      const tags = await fetchAllTags();
      setAllTags(tags);
    };

    const fetchDrinksData = async () => {
      // 一般的なドリンク名のサンプルデータを設定
      const commonDrinks = [
        { id: 1, name: '山崎' },
        { id: 2, name: '白州' },
        { id: 3, name: 'マッカラン' },
        { id: 4, name: 'バランタイン' },
        { id: 5, name: 'ヘネシー' },
        { id: 6, name: '獺祭' },
        { id: 7, name: '森伊蔵' },
        { id: 8, name: 'タンカレー' },
        { id: 9, name: 'グレイグース' },
        { id: 10, name: 'バカルディ' },
        { id: 11, name: 'パトロン' },
        { id: 12, name: 'エビス' },
        { id: 13, name: 'ハイネケン' },
        { id: 14, name: 'シャンパン' },
        { id: 15, name: '赤ワイン' },
        { id: 16, name: '白ワイン' },
        { id: 17, name: 'モヒート' },
        { id: 18, name: 'マルガリータ' },
        { id: 19, name: 'ジントニック' },
        { id: 20, name: 'カシスオレンジ' }
      ];
      setAllDrinks(commonDrinks);
    };

    
    if (isOpen) {
      fetchAtmosphereIndicatorsData();
      fetchProfileOptionsData();
      fetchTagsData();
      fetchDrinksData();
      fetchShopCount(filters); // 初期件数取得
      if (user) {
        fetchUserProfileData();
      }
    }
  }, [isOpen, user]);

  // profileOptionsが取得できたらアルコール関連データを設定
  useEffect(() => {
    if (profileOptions) {
      if (profileOptions.alcohol_categories) {
        setAlcoholCategories(profileOptions.alcohol_categories);
      }
      if (profileOptions.alcohol_brands) {
        setAlcoholBrands(profileOptions.alcohol_brands);
      }
    }
  }, [profileOptions]);

  // ユーザープロフィール取得
  const fetchUserProfileData = async () => {
    try {
      const profile = await fetchProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('プロフィールの取得に失敗:', error);
    }
  };

  // プロフィール選択肢データ取得
  const fetchProfileOptionsData = async () => {
    try {
      const response = await fetchProfileOptions();
      if (response.success && response.data) {
        setProfileOptions(response.data);
        console.log('プロフィールオプション取得成功:', response.data);
      } else {
        console.error('プロフィールオプション取得失敗:', response.error);
      }
    } catch (error) {
      console.error('プロフィールオプションの取得に失敗:', error);
    }
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({});
    setUseProfileData(false);
  };

  // プロフィールデータ自動入力
  useEffect(() => {
    if (useProfileData && userProfile) {
      const profileFilters: SearchFilters = {};

      // 年齢・性別を自動入力
      if (userProfile.birthdate) {
        const age = calculateAge(userProfile.birthdate);
        const ageGroup = getAgeGroup(age);
        if (ageGroup) {
          profileFilters.regular_age_groups = [ageGroup];
        }
      }


      // 利用シーンを自動入力（visit_purposes）
      if (userProfile.visit_purposes && userProfile.visit_purposes.length > 0) {
        profileFilters.visit_purposes = userProfile.visit_purposes.map(p => p.name);
      }

      // メインエリアのみを自動入力
      if (userProfile.my_area && typeof userProfile.my_area === 'object') {
        setSelectedAreas([userProfile.my_area]);
        setPrimaryArea(userProfile.my_area);
        profileFilters.area_ids = [userProfile.my_area.id];
      }

      // プロフィールオプションからの自動入力
      if (profileOptions) {
        // 興味・趣味
        if (userProfile.interests && userProfile.interests.length > 0) {
          const interestIds = userProfile.interests
            .map((interest: any) => interest.id?.toString() || interest)
            .filter(Boolean);
          if (interestIds.length > 0) {
            profileFilters.regular_interests = interestIds;
          }
        }

        // お酒の好み（アルコールカテゴリ）
        if (userProfile.alcohol_categories && userProfile.alcohol_categories.length > 0) {
          const alcoholCategoryIds = userProfile.alcohol_categories
            .map((cat: any) => cat.id || cat)
            .filter(Boolean);
          if (alcoholCategoryIds.length > 0) {
            profileFilters.alcohol_categories = alcoholCategoryIds;
          }
        }

        // お酒の銘柄
        if (userProfile.alcohol_brands && userProfile.alcohol_brands.length > 0) {
          const brandIds = userProfile.alcohol_brands
            .map((brand: any) => brand.id || brand)
            .filter(Boolean);
          if (brandIds.length > 0) {
            profileFilters.alcohol_brands = brandIds;
          }
        }

        // 血液型
        if (userProfile.blood_type) {
          const bloodTypeId = typeof userProfile.blood_type === 'object' 
            ? userProfile.blood_type.id?.toString()
            : userProfile.blood_type.toString();
          if (bloodTypeId) {
            profileFilters.regular_blood_types = [bloodTypeId];
          }
        }

        // MBTI
        if (userProfile.mbti_type) {
          const mbtiId = typeof userProfile.mbti_type === 'object' 
            ? userProfile.mbti_type.id?.toString()
            : userProfile.mbti_type.toString();
          if (mbtiId) {
            profileFilters.regular_mbti_types = [mbtiId];
          }
        }

        // 運動頻度
        if (userProfile.exercise_frequency) {
          const exerciseId = typeof userProfile.exercise_frequency === 'object' 
            ? userProfile.exercise_frequency.id?.toString()
            : userProfile.exercise_frequency.toString();
          if (exerciseId) {
            profileFilters.regular_exercise_frequency = [exerciseId];
          }
        }

        // 食事制限・好み
        if (userProfile.dietary_preferences && userProfile.dietary_preferences.length > 0) {
          const dietaryIds = userProfile.dietary_preferences
            .map((pref: any) => pref.id?.toString() || pref)
            .filter(Boolean);
          if (dietaryIds.length > 0) {
            profileFilters.regular_dietary_preferences = dietaryIds;
          }
        }

        // 職業・業種
        if (userProfile.occupation) {
          profileFilters.occupation = userProfile.occupation;
        }

        if (userProfile.industry) {
          profileFilters.industry = userProfile.industry;
        }
      }


      setFilters(prev => ({
        ...prev,
        ...profileFilters
      }));
    } else if (!useProfileData) {
      // プロフィール自動入力をOFFにした場合、関連する項目をクリア
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters.regular_age_groups;
        delete newFilters.visit_purposes;
        delete newFilters.area_ids;
        return newFilters;
      });
    }
  }, [useProfileData, userProfile]);

  const updateFilters = (key: keyof SearchFilters, value: unknown) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    
    // 件数を更新（デバウンス）
    const timeoutId = setTimeout(() => {
      fetchShopCount(newFilters);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  // 店舗件数を取得する関数
  const fetchShopCount = async (searchFilters: SearchFilters) => {
    try {
      // 件数のみを取得するためのクエリパラメータを構築
      const queryParams = new URLSearchParams();
      
      // 基本的な検索条件を追加
      if (searchFilters.welcome_min !== undefined) {
        queryParams.append('welcome_min', searchFilters.welcome_min.toString());
      }
      if (searchFilters.area_ids?.length) {
        searchFilters.area_ids.forEach(areaId => {
          queryParams.append('area_ids', areaId.toString());
        });
      }
      if (searchFilters.budget_min !== undefined) {
        queryParams.append('budget_min', searchFilters.budget_min.toString());
      }
      if (searchFilters.budget_max !== undefined) {
        queryParams.append('budget_max', searchFilters.budget_max.toString());
      }
      
      // 件数のみ取得するパラメータを追加
      queryParams.append('count_only', 'true');
      
      const response = await fetchWithAuth(`/shops/search/?${queryParams.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShopCount(data.count || 0);
      }
    } catch (error) {
      console.error('店舗件数取得エラー:', error);
      setShopCount(0);
    }
  };

  const handleAtmosphereChange = (indicatorId: number, value: number) => {
    console.log('雰囲気変更:', indicatorId, value);
    const atmosphere_filters = { ...(filters.atmosphere_filters || {}) };
    atmosphere_filters[indicatorId.toString()] = { min: value - 0.5, max: value + 0.5 };
    console.log('更新後のフィルター:', atmosphere_filters);
    updateFilters('atmosphere_filters', atmosphere_filters);
  };

  // タグ入力時の候補表示
  useEffect(() => {
    if (tagInput.trim().length > 0) {
      const matchingTags = allTags.filter(tag => 
        tag.value.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(tag.value)
      );
      setTagSuggestions(matchingTags.slice(0, 10)); // 最大10個まで
    } else {
      setTagSuggestions([]);
    }
  }, [tagInput, allTags, selectedTags]);

  // タグ選択時の処理
  const handleTagSelection = (tagValue: string) => {
    if (!selectedTags.includes(tagValue)) {
      const newSelectedTags = [...selectedTags, tagValue];
      setSelectedTags(newSelectedTags);
      updateFilters('impression_tags', newSelectedTags.join(','));
    }
    setTagInput('');
    setTagSuggestions([]);
  };

  // タグ削除時の処理
  const handleTagRemoval = (tagValue: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag !== tagValue);
    setSelectedTags(newSelectedTags);
    updateFilters('impression_tags', newSelectedTags.length > 0 ? newSelectedTags.join(',') : undefined);
  };

  // ドリンク検索の処理
  const handleDrinkSearch = (value: string) => {
    setDrinkInput(value);
    if (value.trim()) {
      const filtered = allDrinks.filter(drink =>
        drink.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedDrinks.includes(drink.name)
      ).slice(0, 10);
      setDrinkSuggestions(filtered);
    } else {
      setDrinkSuggestions([]);
    }
  };

  const addDrink = (drink: string) => {
    if (!selectedDrinks.includes(drink)) {
      const newDrinks = [...selectedDrinks, drink];
      setSelectedDrinks(newDrinks);
      updateFilters('drink_names', newDrinks);
    }
    setDrinkInput('');
    setDrinkSuggestions([]);
  };

  const removeDrink = (drink: string) => {
    const newDrinks = selectedDrinks.filter(d => d !== drink);
    setSelectedDrinks(newDrinks);
    updateFilters('drink_names', newDrinks.length > 0 ? newDrinks : undefined);
  };

  // エリア変更処理
  const handleAreasChange = (areas: Area[]) => {
    setSelectedAreas(areas);
    updateFilters('area_ids', areas.length > 0 ? areas.map(a => a.id) : undefined);
  };

  const handlePrimaryAreaChange = (area: Area | null) => {
    setPrimaryArea(area);
  };

  // 選択済み条件をタグ化する関数
  const generateConditionTags = () => {
    const tags: { key: string; label: string; category: string }[] = [];

    // 常連さんの条件
    if (filters.welcome_min) {
      tags.push({ key: 'welcome_min', label: `常連数：${filters.welcome_min}人以上`, category: '常連さん' });
    }

    if (filters.regular_count_min) {
      tags.push({ key: 'regular_count_min', label: `常連数：${filters.regular_count_min}人以上`, category: '常連さん' });
    }

    if (filters.regular_age_groups?.length) {
      filters.regular_age_groups.forEach(age => {
        tags.push({ key: `age_${age}`, label: age, category: '年代' });
      });
    }

    if (filters.regular_interests?.length) {
      const interestNames = filters.regular_interests.map(id => {
        const interest = profileOptions?.interests?.find((i: any) => i.id.toString() === id);
        return interest?.name || id;
      }).slice(0, 3); // 最初の3つまで表示
      if (interestNames.length) {
        tags.push({ key: 'interests', label: interestNames.join('、'), category: '興味' });
      }
    }

    // エリア条件
    if (selectedAreas.length) {
      const areaNames = selectedAreas.map(area => area.name).slice(0, 3);
      tags.push({ key: 'areas', label: areaNames.join('、'), category: 'エリア' });
    }

    // 予算条件
    if (filters.budget_min || filters.budget_max) {
      const budgetText = filters.budget_min && filters.budget_max 
        ? `${filters.budget_min}〜${filters.budget_max}円`
        : filters.budget_min 
        ? `${filters.budget_min}円以上`
        : `${filters.budget_max}円以下`;
      tags.push({ key: 'budget', label: budgetText, category: '予算' });
    }

    // 雰囲気条件
    if (filters.atmosphere_filters) {
      const atmosphereLabels = Object.entries(filters.atmosphere_filters).map(([indicatorId, range]) => {
        const indicator = atmosphereIndicators.find(i => i.id.toString() === indicatorId);
        const avgValue = Math.round((range.min + range.max) / 2);
        return indicator ? `${indicator.name}：${avgValue}` : null;
      }).filter(Boolean).slice(0, 2); // 最初の2つまで
      
      if (atmosphereLabels.length) {
        tags.push({ key: 'atmosphere', label: atmosphereLabels.join('、'), category: '雰囲気' });
      }
    }

    // 座席数条件
    if (filters.seat_count_min) {
      tags.push({ key: 'seat_count', label: `${filters.seat_count_min}席以上`, category: '座席' });
    }

    // ドリンク条件
    if (selectedDrinks.length) {
      const drinkText = selectedDrinks.slice(0, 2).join('、');
      tags.push({ key: 'drinks', label: drinkText, category: 'ドリンク' });
    }

    return tags;
  };

  // ヘルパー関数
  const calculateAge = (birthdate: string): number => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeGroup = (age: number): string | null => {
    if (age < 20) return "10代";
    if (age < 30) return "20代";
    if (age < 40) return "30代";
    if (age < 50) return "40代";
    if (age < 60) return "50代";
    return "60代以上";
  };

  // 興味をカテゴリごとにグループ化
  const groupInterestsByCategory = (interests: any[]) => {
    const groups: { [categoryName: string]: any[] } = {};
    
    interests?.forEach((interest: any) => {
      const categoryName = interest.category?.name || '未分類';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(interest);
    });
    
    return groups;
  };

  // 全タグを取得する関数
  const fetchAllTags = async (): Promise<Array<{ id: number; value: string }>> => {
    try {
      // 認証なしでトライ
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/shop-tags/`;
      
      let response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      // 認証なしで失敗した場合、認証ありで再トライ
      if (!response.ok) {
        response = await fetchWithAuth('/shop-tags/', {
          method: 'GET',
          cache: 'no-store'
        });
      }

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      // データ構造を確認して適切にマッピング
      const tags = data.results || data;
      const mappedTags = Array.isArray(tags) ? tags.map((tag: any) => ({
        id: tag.id,
        value: tag.value
      })) : [];
      
      return mappedTags;
    } catch (error) {
      console.error('Tags fetch error:', error);
      return [];
    }
  };

  // 各カテゴリの検索コンテンツをレンダリング
  const renderRegularsSearch = () => (
    <div className={styles.searchCategory}>
      <div className={styles.categoryDescription}>
        <p>お店の常連さんとの共通点で、あなたにマッチするお店を見つけられます</p>
      </div>
      
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Filter size={16} strokeWidth={1}/>
          歓迎度レベル
        </h4>
        <div className={styles.welcomeLevelOptions}>
          {[
            { value: 0, label: '全てのお店', description: '制限なし' },
            { value: 5, label: '新規歓迎', description: '5人以上がウェルカム' },
            { value: 15, label: '人気店', description: '15人以上がウェルカム' },
            { value: 30, label: '超人気店', description: '30人以上がウェルカム' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => updateFilters('welcome_min', option.value || undefined)}
              className={`${styles.optionButton} ${
                (filters.welcome_min || 0) === option.value ? styles.active : ''
              }`}
            >
              <div className={styles.optionLabel}>{option.label}</div>
              <div className={styles.optionDesc}>{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Users size={16} strokeWidth={1}/>
          常連さんの数
        </h4>
        <div className={styles.regularCountOptions}>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={filters.regular_count_min || 3}
            onChange={(e) => updateFilters('regular_count_min', parseInt(e.target.value))}
            className={styles.rangeSlider}
            style={{
              background: `linear-gradient(to right, rgba(0, 255, 255, 1) 0%, rgba(0, 255, 255, 1) ${((filters.regular_count_min || 3) - 1) / (50 - 1) * 100}%, rgba(255, 255, 255, 0.1) ${((filters.regular_count_min || 3) - 1) / (50 - 1) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          <div className={styles.rangeValue}>
            <span className={styles.rangeCount}>{filters.regular_count_min || 3}人</span>
            以上の常連さんがいるお店
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Users size={16} strokeWidth={1}/>
          常連さんの年代
        </h4>
        <div className={styles.attributeSelection}>
          <div className={styles.subGroup}>
            <span className={styles.subTitle}>年代</span>
            <CustomCheckboxGroup
              name="regular_age_groups"
              values={filters.regular_age_groups || []}
              onChange={(values) => updateFilters('regular_age_groups', values.length > 0 ? values : undefined)}
              options={[
                { label: '10代', value: '10代' },
                { label: '20代', value: '20代' },
                { label: '30代', value: '30代' },
                { label: '40代', value: '40代' },
                { label: '50代', value: '50代' },
                { label: '60代以上', value: '60代以上' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Heart size={16} strokeWidth={1} />
          常連さんの興味
        </h4>
        <div className={styles.subGroup}>
          {Object.entries(groupInterestsByCategory(profileOptions?.interests || [])).map(([categoryName, interests]) => (
            <div key={categoryName} style={{ marginBottom: '1rem' }}>
              <div className={styles.subTitle}>{categoryName}</div>
              <CustomCheckboxGroup
                name={`regular_interests_${categoryName}`}
                values={filters.regular_interests || []}
                onChange={(values) => updateFilters('regular_interests', values.length > 0 ? values : undefined)}
                options={interests.map((interest: any) => ({
                  label: interest.name,
                  value: interest.id.toString()
                }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Wine size={16} strokeWidth={1} />
          お酒の好み
        </h4>
        <div className={styles.subGroup}>
          <CustomCheckboxGroup
            name="regular_alcohol_preferences"
            values={filters.regular_alcohol_preferences || []}
            onChange={(values) => updateFilters('regular_alcohol_preferences', values.length > 0 ? values : undefined)}
            options={profileOptions?.alcohol_categories?.map((category: any) => ({
              label: category.name,
              value: category.id.toString()
            })) || []}
          />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Settings size={16} strokeWidth={1} />
          ライフスタイル
        </h4>
        <div className={styles.lifestyleOptions}>
          <div className={styles.subGroup}>
            <span className={styles.subTitle}>血液型</span>
            <CustomCheckboxGroup
              name="regular_blood_types"
              values={filters.regular_blood_types || []}
              onChange={(values) => updateFilters('regular_blood_types', values.length > 0 ? values : undefined)}
              options={profileOptions?.blood_types?.map((bloodType: any) => ({
                label: bloodType.name,
                value: bloodType.id.toString()
              })) || []}
            />
          </div>

          <div className={styles.subGroup}>
            <span className={styles.subTitle}>MBTI</span>
            <CustomCheckboxGroup
              name="regular_mbti_types"
              values={filters.regular_mbti_types || []}
              onChange={(values) => updateFilters('regular_mbti_types', values.length > 0 ? values : undefined)}
              options={profileOptions?.mbti_types?.map((mbti: any) => ({
                label: mbti.name,
                value: mbti.id.toString()
              })) || []}
            />
          </div>

          <div className={styles.subGroup}>
            <span className={styles.subTitle}>運動頻度</span>
            <CustomCheckboxGroup
              name="regular_exercise_frequency"
              values={filters.regular_exercise_frequency || []}
              onChange={(values) => updateFilters('regular_exercise_frequency', values.length > 0 ? values : undefined)}
              options={profileOptions?.exercise_frequencies?.map((frequency: any) => ({
                label: frequency.name,
                value: frequency.id.toString()
              })) || []}
            />
          </div>

          <div className={styles.subGroup}>
            <span className={styles.subTitle}>食事制限・好み</span>
            <CustomCheckboxGroup
              name="regular_dietary_preferences"
              values={filters.regular_dietary_preferences || []}
              onChange={(values) => updateFilters('regular_dietary_preferences', values.length > 0 ? values : undefined)}
              options={profileOptions?.dietary_preferences?.map((preference: any) => ({
                label: preference.name,
                value: preference.id.toString()
              })) || []}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Settings size={16} strokeWidth={1} />
          常連さんの職業・業種
        </h4>
        <div className={styles.occupationInputs}>
          <Input
            type="text"
            placeholder="職業を入力（例：エンジニア、営業）"
            value={filters.occupation || ''}
            onChange={(e) => updateFilters('occupation', e.target.value || undefined)}
            className={styles.textInput}
            classNames={{
              inputWrapper: styles.tagInputWrapper,
              input: styles.tagInputElement,
            }}
          />
          <Input
            type="text"
            placeholder="業種を入力（例：IT、金融）"
            value={filters.industry || ''}
            onChange={(e) => updateFilters('industry', e.target.value || undefined)}
            className={styles.textInput}
            classNames={{
              inputWrapper: styles.tagInputWrapper,
              input: styles.tagInputElement,
            }}
          />
        </div>
      </div>

    </div>
  );

  const renderAtmosphereSearch = () => (
    <div className={styles.searchCategory}>
      <div className={styles.categoryDescription}>
        <p>お店の雰囲気やあなたの利用シーンに合わせて検索できます</p>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>印象タグ</h4>
        
        {/* 選択されたタグの表示 */}
        {selectedTags.length > 0 && (
          <div className={styles.selectedTags}>
            <p className={styles.selectedTagsTitle}>選択されたタグ:</p>
            <div className={styles.tagChips}>
              {selectedTags.map(tag => (
                <Chip
                  key={tag}
                  onClose={() => handleTagRemoval(tag)}
                  className={styles.selectedTagChip}
                  variant="flat"
                  color="primary"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* タグ入力 */}
        <Input
          placeholder="お店の印象を入力（例：おしゃれ、アットホーム、静か）"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          size='lg'
          className={styles.textInput}
          classNames={{
            inputWrapper: styles.tagInputWrapper,
            input: styles.tagInputElement,
          }}
        />
        
        {/* 候補タグの表示 */}
        {tagSuggestions.length > 0 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>似たタグ:</p>
            <div className={styles.suggestionChips}>
              {tagSuggestions.map(tag => (
                <Chip
                  key={tag.id}
                  onClick={() => handleTagSelection(tag.value)}
                  className={styles.suggestionChip}
                  variant="flat"
                  color="secondary"
                >
                  {tag.value}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>雰囲気の好み</h4>
        {atmosphereIndicators.map((indicator) => {
          // 現在の雰囲気フィルターから値を取得（デフォルトは0）
          const filterKey = indicator.id.toString();
          const currentFilter = filters.atmosphere_filters?.[filterKey];
          const currentValue = currentFilter 
            ? Math.round((currentFilter.min + currentFilter.max) / 2)
            : 0;
          
          console.log(`指標 ${indicator.name} (ID: ${indicator.id})の現在値:`, currentValue);
            
          return (
            <AtmosphereSlider
              key={indicator.id}
              indicator={indicator}
              value={currentValue}
              onChange={(value) => handleAtmosphereChange(indicator.id, value)}
            />
          );
        })}
      </div>


    </div>
  );

  const renderAreaSearch = () => (
    <div className={styles.searchCategory}>
      <div className={styles.categoryDescription}>
        <p>地域・エリアを選択して検索</p>
      </div>
      
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>エリア選択</h4>
        <MyAreaSelector
          selectedAreas={selectedAreas}
          primaryArea={primaryArea}
          onAreasChange={handleAreasChange}
          onPrimaryAreaChange={handlePrimaryAreaChange}
          maxAreas={5}
        />
      </div>
    </div>
  );

  const renderBasicSearch = () => (
    <div className={styles.searchCategory}>
      <div className={styles.categoryDescription}>
        <p>現在地からの距離・予算などの条件で検索</p>
      </div>
      
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>予算目安</h4>
        <div className={styles.budgetSelection}>
          <CustomRadioGroup
            options={[
              { value: 'weekday', label: '平日料金', description: '月〜木曜日の料金で検索' },
              { value: 'weekend', label: '休日料金', description: '金〜日曜日・祝日の料金で検索' }
            ]}
            value={filters.budget_type || 'weekday'}
            onChange={(value) => updateFilters('budget_type', value as 'weekday' | 'weekend')}
            name="budget_type"
          />
          <div className={styles.rangeGroup}>
            <Input
              type="number"
              placeholder="下限"
              value={filters.budget_min?.toString() || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                updateFilters('budget_min', !isNaN(value) ? value : undefined);
              }}
              className={styles.numberInput}
              classNames={{
                inputWrapper: styles.numberInputBase,
              }}
              size="sm"
              min={0}
            />
            <span>〜</span>
            <Input
              type="number"
              placeholder="上限"
              value={filters.budget_max?.toString() || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                updateFilters('budget_max', !isNaN(value) ? value : undefined);
              }}
              className={styles.numberInput}
              classNames={{
                inputWrapper: styles.numberInputBase,
              }}
              size="sm"
              min={0}
            />
            <span>円</span>
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>現在地からの距離</h4>
        <div className={styles.distanceSelection}>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={filters.distance_km || 0.3}
            onChange={(e) => updateFilters('distance_km', parseFloat(e.target.value))}
            className={styles.rangeSlider}
            style={{
              background: `linear-gradient(to right, rgba(0, 255, 255, 1) 0%, rgba(0, 255, 255, 1) ${((filters.distance_km || 0.3) - 0.1) / (3 - 0.1) * 100}%, rgba(255, 255, 255, 0.1) ${((filters.distance_km || 0.3) - 0.1) / (3 - 0.1) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          <div className={styles.rangeValue}>
            {filters.distance_km || 0.3}km以内
          </div>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>座席数</h4>
        <div className={styles.rangeGroup}>
          <Input
            type="number"
            placeholder="最小"
            value={filters.seat_count_min?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              updateFilters('seat_count_min', !isNaN(value) ? value : undefined);
            }}
            className={styles.numberInput}
            classNames={{
              inputWrapper: styles.numberInputBase,
            }}
            size="sm"
            min={1}
          />
          <span>　席以上</span>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={filters.open_now || false}
            onChange={(e) => updateFilters('open_now', e.target.checked || undefined)}
            className={styles.toggleInput}
          />
          <span className={styles.toggleSlider}></span>
          <div className={styles.toggleContent}>
            <span className={styles.toggleText}>今すぐ入れるお店</span>
            <small className={styles.toggleDesc}>現在営業中のお店のみ表示</small>
          </div>
        </label>
      </div>
    </div>
  );

  // ショップタイプ・レイアウト・オプションの選択肢データをAPIから取得
  useEffect(() => {
    const load = async () => {
      try {
          const types = await fetchShopTypes();
          setShopTypeOptions(types);
      } catch (err) {
          console.error('ショップタイプ取得失敗:', err);
      }

      try {
          const layouts = await fetchShopLayouts();
          setShopLayoutOptions(layouts);
      } catch (err) {
          console.error('ショップレイアウト取得失敗:', err);
      }

      try {
          const options = await fetchShopOptions();
          setShopOptionOptions(options);
      } catch (err) {
          console.error('ショップオプション取得失敗:', err);
      }
    };

    load();
  }, []);


  //店舗の特徴での検索コンテンツ
  const renderFeaturesSearch = () => {

    return (
      <div className={styles.searchCategory}>
        <div className={styles.categoryDescription}>
          <p>お店のタイプ・座席・設備などの特徴で検索</p>
        </div>
        
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>お店のタイプ</h4>
          <div className={styles.categoryGrid}>
            <CheckboxGroup
              name="shopTypes"
              values={filters.shop_types?.map(id => id.toString()) || []}
              onChange={(values) => updateFilters('shop_types', values.length > 0 ? values.map(v => parseInt(v)) : undefined)}
              options={shopTypeOptions.map((type) => ({
                label: type.name,
                value: type.id.toString(),
              }))}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>座席・レイアウト</h4>
          <div className={styles.categoryGrid}>
            <CheckboxGroup
              name="shopLayouts"
              values={filters.shop_layouts?.map(id => id.toString()) || []}
              onChange={(values) => updateFilters('shop_layouts', values.length > 0 ? values.map(v => parseInt(v)) : undefined)}
              options={shopLayoutOptions.map((layout) => ({
                label: layout.name,
                value: layout.id.toString(),
              }))}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>設備・サービス</h4>
          <div className={styles.categoryGrid}>
            <CheckboxGroup
              name="shopOptions"
              values={filters.shop_options?.map(id => id.toString()) || []}
              onChange={(values) => updateFilters('shop_options', values.length > 0 ? values.map(v => parseInt(v)) : undefined)}
              options={shopOptionOptions.map((option) => ({
                label: option.name,
                value: option.id.toString(),
              }))}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDrinksSearch = () => {
    return (
      <div className={styles.searchCategory}>
        <div className={styles.categoryDescription}>
          <p>ドリンクの銘柄や人気度で検索</p>
        </div>
        
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>ドリンク検索</h4>
          <Input
            type="text"
            placeholder="ドリンク名で検索（例：山崎、ヘネシー、獺祭）"
            value={drinkInput}
            onChange={(e) => handleDrinkSearch(e.target.value)}
            className={styles.tagInputElement}
            classNames={{
              inputWrapper: styles.tagInputWrapper,
            }}
            size="sm"
          />

          {selectedDrinks.length > 0 && (
            <div className={styles.selectedTags}>
              <span className={styles.selectedTagsTitle}>選択中のドリンク</span>
              <div className={styles.tagChips}>
                {selectedDrinks.map((drink) => (
                  <Chip
                    key={drink}
                    onClose={() => removeDrink(drink)}
                    variant="flat"
                    className={styles.selectedTagChip}
                    style={{
                      background: 'rgba(0, 194, 255, 0.2)',
                      color: '#00c2ff',
                      border: '1px solid rgba(0, 194, 255, 0.4)'
                    }}
                  >
                    {drink}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {drinkSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              <span className={styles.suggestionsTitle}>候補のドリンク</span>
              <div className={styles.suggestionChips}>
                {drinkSuggestions.map((drink) => (
                  <Chip
                    key={drink.id}
                    onClick={() => addDrink(drink.name)}
                    variant="bordered"
                    className={styles.suggestionChip}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    {drink.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>人気度で絞り込み</h4>
          <div className={styles.rangeGroup}>
            <span>いいね数</span>
            <Input
              type="number"
              placeholder="最小"
              value={filters.drink_likes_min?.toString() || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                updateFilters('drink_likes_min', !isNaN(value) ? value : undefined);
              }}
              className={styles.numberInput}
              classNames={{
                inputWrapper: styles.numberInputBase,
              }}
              size="sm"
              min={0}
            />
            <span>以上</span>
          </div>
        </div>

        {alcoholCategories.map((category) => {
          const categoryBrands = alcoholBrands.filter(brand => brand.category.id === category.id);
          if (categoryBrands.length === 0) return null;

          return (
            <div key={category.id} className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>{category.name}</h4>
              <div className={styles.categoryGrid}>
                <CheckboxGroup
                  name={`alcoholBrands_${category.id}`}
                  values={filters.alcohol_brands?.map(id => id.toString()) || []}
                  onChange={(values) => updateFilters('alcohol_brands', values.length > 0 ? values.map(v => parseInt(v)) : undefined)}
                  options={categoryBrands.map((brand) => ({
                    label: brand.name,
                    value: brand.id.toString(),
                  }))}
                />
              </div>
            </div>
          );
        })}
        
      </div>
    );
  };


  const modalFooter = (
    <div className={styles.modalFooter}>
      <div className={styles.shopCountDisplay}>
        <span className={styles.shopCountText}>
          該当する店舗：<strong>{shopCount}件</strong>
        </span>
      </div>
      <Button
        variant="flat"
        onPress={handleReset}
        className={styles.resetButton}
      >
        リセット
      </Button>
      <ButtonGradient
        onClick={handleSearch}
        anotherStyle={styles.searchButton}
      >
        {isLoading ? '検索中...' : 'この条件で探す'}
      </ButtonGradient>

      {/* モバイル用ボタン */}
      <div className={styles.mobileShopCount}>
        <span className={styles.shopCountText}>
          該当する店舗：<strong>{shopCount}件</strong>
        </span>
      </div>
      <Button
        variant="flat"
        onPress={handleReset}
        className={styles.mobileResetButton}
        size='sm'
      >
        リセット
      </Button>
      <ButtonGradient
        onClick={handleSearch}
        anotherStyle={styles.mobileSearchButton}
        size='sm'
      >
        {isLoading ? '検索中...' : 'この条件で探す'}
      </ButtonGradient>
    </div>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="こだわり条件で探す"
      size="full"
      footer={modalFooter}
      scrollBehavior="inside"
    >
      {/* 設定済み条件表示 */}
      {generateConditionTags().length > 0 && (
        <div className={styles.selectedConditions}>
          <div className={styles.selectedConditionsHeader}>
            <span className={styles.selectedConditionsTitle}>設定済み条件</span>
            <Button
              size="sm"
              variant="light"
              onPress={() => setFilters({})}
              className={styles.clearAllButton}
            >
              すべて削除
            </Button>
          </div>
          <ScrollShadow orientation="horizontal" className={styles.conditionsScroll}>
            <div className={styles.conditionsTags}>
              {generateConditionTags().map((tag) => (
                <Chip
                  key={tag.key}
                  variant="flat"
                  onClose={() => {
                    // 個別の条件削除ロジック（後で実装）
                  }}
                  className={styles.conditionTag}
                  style={{
                    background: 'rgba(0, 194, 255, 0.15)',
                    color: '#00c2ff',
                    border: '1px solid rgba(0, 194, 255, 0.3)'
                  }}
                >
                  <span className={styles.tagCategory}>{tag.category}</span>
                  <span className={styles.tagLabel}>{tag.label}</span>
                </Chip>
              ))}
            </div>
          </ScrollShadow>
        </div>
      )}
      <div className={styles.searchContent}>
        
        {/* プロフィール自動入力 - ログイン時のみ表示 */}
        {user && (
          <div className={styles.profileSection}>
            <div className={styles.profileToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={useProfileData}
                  onChange={(e) => setUseProfileData(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
                <div className={styles.toggleContent}>
                  <span className={styles.toggleText}>
                    自分の好みを反映する
                  </span>
                  <span className={styles.toggleDesc}>同じ傾向の常連さんがいる店舗を探せます。</span>
                </div>
              </label>
            </div>
          </div>
        )}

        <Divider className={styles.divider} />

        {/* 検索カテゴリタブ */}
        <div className={styles.searchTabs}>
          <CustomTabs
            items={searchCategories.map((category): TabItem => {
              const IconComponent = category.icon;
              const getContentForCategory = () => {
                switch (category.key) {
                  case 'regulars':
                    return renderRegularsSearch();
                  case 'atmosphere':
                    return renderAtmosphereSearch();
                  case 'area':
                    return renderAreaSearch();
                  case 'basic':
                    return renderBasicSearch();
                  case 'features':
                    return renderFeaturesSearch();
                  case 'drinks':
                    return renderDrinksSearch();
                  default:
                    return renderRegularsSearch();
                }
              };
              
              return {
                key: category.key,
                title: (
                  <div className={styles.tabTitle}>
                    <IconComponent size={16} strokeWidth={1} />
                    <span>{category.label}</span>
                  </div>
                ),
                content: getContentForCategory()
              };
            })}
            selectedKey={activeCategory}
            onSelectionChange={(key) => setActiveCategory(key as SearchCategory)}
            variant="solid"
            size="sm"
            fullWidth={true}
          />
        </div>
      </div>
    </CustomModal>
  );
};

export default ShopSearchModal;