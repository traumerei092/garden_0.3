'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Link, Chip, Divider, ScrollShadow, Popover, PopoverTrigger, PopoverContent, Listbox, ListboxItem } from '@nextui-org/react';
import CustomModal from '@/components/UI/Modal';
import CustomTabs, { TabItem } from '@/components/UI/CustomTabs';
import AtmosphereRadio from '@/components/UI/AtmosphereRadio';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import CheckboxCustom from '@/components/UI/CheckboxCustom';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import CustomRadioGroup from '@/components/UI/RadioGroup';
import ButtonGradient from '@/components/UI/ButtonGradient';
import CheckboxGroup from "@/components/UI/CheckboxGroup";
import MyAreaSelector from '@/components/Account/MyAreaSelector';
import InputDefault from '@/components/UI/InputDefault';
import StyledAutocomplete from '@/components/UI/StyledAutocomplete';
import styles from './style.module.scss';
import { Users, Heart, Settings, MapPin, Coffee, Wine, Filter, ChevronDown } from 'lucide-react';
import { fetchUserProfile } from '@/actions/profile/fetchProfile';
import { fetchProfileOptions } from '@/actions/profile/fetchProfileOptions';
import { fetchAtmosphereIndicators } from '@/actions/profile/fetchAtmosphereData';
import { fetchShopTypes } from '@/actions/shop/fetchShopTypes';
import { fetchShopLayouts } from "@/actions/shop/fetchShopLayouts";
import { fetchShopOptions } from "@/actions/shop/fetchShopOptions";
import { searchShops, fetchShopTags } from '@/actions/shop/search';
import { useAuthSession } from '@/hooks/useAuthSession';
import { ShopType, ShopLayout, ShopOption } from "@/types/shops";
import { Area } from '@/types/areas';
import { getCurrentPosition } from '@/utils/location';
import {
  SearchFilters,
  ShopSearchModalProps,
  AtmosphereIndicator,
  AtmospherePreference,
  UserProfile,
  SearchCategory,
  ShopSuggestion,
  SearchHistory
} from '@/types/search';
import { ProfileOptions } from '@/types/users';
import KeywordInput from '@/components/UI/KeywordInput';
import { searchShopSuggestions, getSearchHistory, removeSearchHistory, saveSearchHistory } from '@/actions/shop/keywordSearch';
import { Search, Clock, X } from 'lucide-react';


const ShopSearchModal: React.FC<ShopSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialFilters = {},
  isLoading = false,
  openMode
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [atmosphereIndicators, setAtmosphereIndicators] = useState<AtmosphereIndicator[]>([]);
  const [useProfileData, setUseProfileData] = useState(false);
  const [useMyAreaOnly, setUseMyAreaOnly] = useState(false);
  const [selectedMyArea, setSelectedMyArea] = useState<Area | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('regulars');
  const [profileOptions, setProfileOptions] = useState<ProfileOptions | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ id: number; value: string }>>([]);
  const [allTags, setAllTags] = useState<Array<{ id: number; value: string }>>([]);
  const [drinkInput, setDrinkInput] = useState('');
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [drinkSuggestions, setDrinkSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [allDrinks, setAllDrinks] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<string>('SNS・プラットフォーム');
  const [selectedLifestyleCategory, setSelectedLifestyleCategory] = useState<string>('血液型');
  
  // 興味カテゴリ定義
  const interestCategories = [
    { label: 'スポーツ', value: 'sports' },
    { label: 'エンタメ', value: 'entertainment' },
    { label: 'テクノロジー', value: 'technology' },
    { label: 'グルメ', value: 'gourmet' },
    { label: '旅行', value: 'travel' },
    { label: 'ライフスタイル', value: 'lifestyle' },
    { label: 'ビジネス', value: 'business' },
    { label: 'アート・文化', value: 'culture' }
  ];
  
  const { user } = useAuthSession();
  const [shopTypeOptions, setShopTypeOptions] = useState<ShopType[]>([]);
  const [shopLayoutOptions, setShopLayoutOptions] = useState<ShopLayout[]>([]);
  const [shopOptionOptions, setShopOptionOptions] = useState<ShopOption[]>([]);
  const [alcoholBrands, setAlcoholBrands] = useState<Array<{ id: number; name: string; category: { id: number; name: string } }>>([]);
  const [alcoholCategories, setAlcoholCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [primaryArea, setPrimaryArea] = useState<Area | null>(null);
  const [shopCount, setShopCount] = useState<number>(0);
  const [debugShops, setDebugShops] = useState<Array<{ id: number; name: string }>>([]);
  const [countAnimated, setCountAnimated] = useState<boolean>(false);
  const [displayCount, setDisplayCount] = useState<number>(0);

  // キーワード検索関連のstate
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(openMode?.keywordMode || false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [shopSuggestions, setShopSuggestions] = useState<ShopSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [suggestionsCount, setSuggestionsCount] = useState<number>(0);

  // openModeが変更されたときに入力フォーカス状態を更新
  useEffect(() => {
    if (openMode?.keywordMode) {
      setIsInputFocused(true);
      // 検索履歴を読み込み
      const history = getSearchHistory();
      setSearchHistory(history);
    }
  }, [openMode?.keywordMode]);

  // デバウンス用のタイムアウト管理
  const fetchCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keywordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // カウンターアップアニメーション関数
  const animateCountUp = (start: number, end: number) => {
    // 差が小さい場合はアニメーションをスキップ
    if (Math.abs(end - start) <= 1) {
      setDisplayCount(end);
      return;
    }

    const duration = 400; // 0.4秒間
    const steps = Math.min(Math.abs(end - start), 50); // 最大50ステップ
    const stepTime = duration / steps;
    const increment = (end - start) / steps;

    let current = start;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step === steps) {
        setDisplayCount(end);
        clearInterval(timer);
      } else {
        current += increment;
        setDisplayCount(Math.floor(current));
      }
    }, stepTime);
  };

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
        const result = await fetchAtmosphereIndicators();
        if (result.success && result.data) {
          console.log('🔥🔥🔥 取得した雰囲気指標:', result.data);
          setAtmosphereIndicators(result.data);
        } else {
          console.error('雰囲気指標の取得に失敗:', result.error);
        }
      } catch (error) {
        console.error('雰囲気指標の取得に失敗:', error);
      }
    };

    const fetchTagsData = async () => {
      const tags = await fetchAllTags();
      setAllTags(tags);
    };


    if (isOpen) {
      fetchAtmosphereIndicatorsData();
      fetchProfileOptionsData();
      fetchTagsData();
      // ドリンクデータは検索時に動的に取得するため、初期読み込みは不要
      // 初期件数取得はinitialFiltersの処理後に実行されるため、ここでは実行しない
      if (user) {
        fetchUserProfileData();
      }
    }
  }, [isOpen, user]);

  // initialFilters の安定化
  const stableInitialFilters = useMemo(() => {
    return initialFilters && Object.keys(initialFilters).length > 0 ? initialFilters : {};
  }, [JSON.stringify(initialFilters)]);

  // 状態同期関数
  const syncUIState = useCallback((filters: SearchFilters) => {
    console.log('状態同期開始:', filters);

    // ドリンクの状態を同期
    if (filters.drink_names) {
      setSelectedDrinks(Array.isArray(filters.drink_names) ? filters.drink_names : [filters.drink_names]);
    } else {
      setSelectedDrinks([]);
    }

    // 印象タグの状態を同期
    if (filters.impression_tags) {
      const tags = typeof filters.impression_tags === 'string'
        ? filters.impression_tags.split(',').filter(t => t.trim())
        : [];
      setSelectedTags(tags);
    } else {
      setSelectedTags([]);
    }

    // エリア選択の状態を同期
    if (filters.area_ids && filters.area_ids.length > 0) {
      console.log('エリアの復元は後で処理します');
    } else {
      setSelectedAreas([]);
      setPrimaryArea(null);
    }

    // マイエリア検索の状態を同期
    setUseMyAreaOnly(Boolean(filters.use_my_area_only));
  }, []);

  // initialFiltersが変更された時に設定を同期
  useEffect(() => {
    console.log('=== initialFilters useEffect実行 ===');
    console.log('isOpen:', isOpen);
    console.log('stableInitialFilters:', stableInitialFilters);

    if (isOpen && Object.keys(stableInitialFilters).length > 0) {
      try {
        console.log('initialFiltersを設定中...');
        setFilters(stableInitialFilters);
        syncUIState(stableInitialFilters);

        // initialFiltersが設定された時に店舗数を更新
        fetchShopCount(stableInitialFilters);
        console.log('initialFilters設定完了');
      } catch (error) {
        console.error('initialFilters設定エラー:', error);
      }
    }
  }, [isOpen, stableInitialFilters, syncUIState]);

  // profileOptionsが取得できたらアルコール関連データを設定し、初期フィルターを再同期
  useEffect(() => {
    if (profileOptions) {
      if (profileOptions.alcohol_categories) {
        setAlcoholCategories(profileOptions.alcohol_categories);
      }
      if (profileOptions.alcohol_brands) {
        setAlcoholBrands(profileOptions.alcohol_brands);
      }

      // profileOptionsが読み込まれた後、initialFiltersが存在する場合は再同期
      // これにより、タグ生成に必要なprofileOptionsデータが利用可能になる
      if (isOpen && initialFilters && Object.keys(initialFilters).length > 0) {
        console.log('profileOptions読み込み後のinitialFilters再同期:', { profileOptions, initialFilters });

        // エリア情報の復元（profileOptionsにエリアデータがある場合）
        if (initialFilters.area_ids && initialFilters.area_ids.length > 0 && profileOptions.areas) {
          const restoredAreas = profileOptions.areas.filter((area) =>
            initialFilters.area_ids?.includes(area.id)
          );
          if (restoredAreas.length > 0) {
            setSelectedAreas(restoredAreas as Area[]);
            // 最初のエリアをprimaryAreaとして設定
            setPrimaryArea(restoredAreas[0] as Area);
            console.log('エリア情報を復元:', restoredAreas);
          }
        }

        // この時点でprofileOptionsが利用可能なので、店舗数を再計算
        // ただし、すでにfetchShopCountが呼ばれている可能性があるので、重複を避ける
        console.log('profileOptions読み込み完了により店舗数を再計算');
        fetchShopCount(initialFilters);
      }
    }
  }, [profileOptions, isOpen, JSON.stringify(initialFilters)]);

  // ユーザープロフィール取得
  const fetchUserProfileData = async () => {
    try {
      console.log('=== ユーザープロフィール取得開始 ===');
      console.log('user (from useAuthSession):', user);

      const profile = await fetchUserProfile();

      console.log('=== プロフィール取得結果 ===');
      console.log('取得したプロフィール:', profile);
      console.log('profile keys:', profile ? Object.keys(profile) : 'null');
      console.log('profile.my_area:', profile?.my_area);
      console.log('profile.my_area type:', typeof profile?.my_area);

      // 他のフィールドもチェック
      console.log('profile.name:', profile?.name);
      console.log('profile.email:', profile?.email);

      setUserProfile(profile as UserProfile);
      // プライマリエリアまたは最初のマイエリアを初期選択として設定（型安全性確保）
      if ((profile as any)?.primary_area &&
          typeof (profile as any).primary_area === 'object' &&
          (profile as any).primary_area !== null &&
          'id' in (profile as any).primary_area &&
          'name' in (profile as any).primary_area &&
          typeof (profile as any).primary_area.id === 'number' &&
          typeof (profile as any).primary_area.name === 'string') {
        setSelectedMyArea((profile as any).primary_area as Area);
      } else if ((profile as any)?.my_areas && Array.isArray((profile as any).my_areas) && (profile as any).my_areas.length > 0) {
        const firstArea = (profile as any).my_areas[0];
        if (firstArea &&
            typeof firstArea === 'object' &&
            firstArea !== null &&
            'id' in firstArea &&
            'name' in firstArea &&
            typeof firstArea.id === 'number' &&
            typeof firstArea.name === 'string') {
          setSelectedMyArea(firstArea as Area);
        }
      }
      console.log('プロフィール設定完了');
    } catch (error) {
      console.error('=== プロフィールの取得に失敗 ===');
      console.error('エラー詳細:', error);
      console.error('エラー名:', (error as any)?.name);
      console.error('エラーメッセージ:', (error as any)?.message);
      console.error('エラースタック:', (error as any)?.stack);
    }
  };

  // プロフィール選択肢データ取得
  const fetchProfileOptionsData = async () => {
    try {
      const response = await fetchProfileOptions();
      if (response?.success && response?.data) {
        setProfileOptions(response.data);
        console.log('プロフィールオプション取得成功:', response.data);
        if (response.data &&
            typeof response.data === 'object' &&
            response.data !== null &&
            'areas' in response.data) {
          console.log('プロフィールオプション - areas:', response.data.areas);
          console.log('areasの型:', typeof response.data.areas);
          console.log('areasは配列か:', Array.isArray(response.data.areas));
        }
      } else {
        console.error('プロフィールオプション取得失敗:', response?.error || 'レスポンスが無効です');
      }
    } catch (error) {
      console.error('プロフィールオプションの取得に失敗:', error);
    }
  };

  const handleSearch = () => {
    console.log('検索実行:', filters);
    console.log('フィルター詳細:', JSON.stringify(filters, null, 2));

    // 親コンポーネントの検索ハンドラーを呼び出し
    onSearch(filters);
  };

  const handleReset = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    setUseProfileData(false);
    setSelectedTags([]);
    setSelectedAreas([]);
    // キーワード検索もクリア
    setKeywordInput('');
    setShopSuggestions([]);
    setSuggestionsCount(0);
    setPrimaryArea(null);
    setSelectedDrinks([]);

    // リセット後に店舗数を更新
    fetchShopCount(emptyFilters);
  };

  // 個別条件削除機能
  const handleRemoveCondition = (conditionKey: string) => {
    const newFilters = { ...filters };
    
    if (conditionKey === 'distance_km') {
      delete newFilters.distance_km;
    } else if (conditionKey === 'open_now') {
      delete newFilters.open_now;
    } else if (conditionKey === 'welcome_min') {
      delete newFilters.welcome_min;
    } else if (conditionKey === 'regular_count_min') {
      delete newFilters.regular_count_min;
    } else if (conditionKey.startsWith('dominant_age_')) {
      delete newFilters.dominant_age_group;
    } else if (conditionKey.startsWith('interest_')) {
      const interestIdToRemove = conditionKey.replace('interest_', '');
      newFilters.regular_interests = newFilters.regular_interests?.filter(id => id !== interestIdToRemove);
      if (newFilters.regular_interests?.length === 0) {
        delete newFilters.regular_interests;
      }
    } else if (conditionKey === 'genders') {
      delete newFilters.regular_genders;
    } else if (conditionKey === 'blood_types') {
      delete newFilters.regular_blood_types;
    } else if (conditionKey === 'mbti_types') {
      delete newFilters.regular_mbti_types;
    } else if (conditionKey === 'exercise_frequency') {
      delete newFilters.regular_exercise_frequency;
    } else if (conditionKey === 'dietary_preferences') {
      delete newFilters.regular_dietary_preferences;
    } else if (conditionKey === 'occupation') {
      delete newFilters.occupation;
    } else if (conditionKey === 'industry') {
      delete newFilters.industry;
    } else if (conditionKey === 'areas') {
      setSelectedAreas([]);
      setPrimaryArea(null);
      delete newFilters.area_ids;
    } else if (conditionKey === 'budget') {
      delete newFilters.budget_min;
      delete newFilters.budget_max;
    } else if (conditionKey === 'atmosphere') {
      delete newFilters.atmosphere_simple;
    } else if (conditionKey.startsWith('atmosphere_')) {
      // 個別雰囲気条件の削除
      const indicatorId = conditionKey.replace('atmosphere_', '');
      if (newFilters.atmosphere_simple) {
        const updated = { ...newFilters.atmosphere_simple };
        delete updated[indicatorId];
        newFilters.atmosphere_simple = Object.keys(updated).length > 0 ? updated : undefined;
      }
    } else if (conditionKey === 'seat_count') {
      delete newFilters.seat_count_min;
    } else if (conditionKey === 'shop_types') {
      delete newFilters.shop_types;
    } else if (conditionKey === 'shop_layouts') {
      delete newFilters.shop_layouts;
    } else if (conditionKey === 'shop_options') {
      delete newFilters.shop_options;
    } else if (conditionKey === 'impression_tags') {
      setSelectedTags([]);
      delete newFilters.impression_tags;
    } else if (conditionKey === 'drinks') {
      setSelectedDrinks([]);
      delete newFilters.drink_names;
    } else if (conditionKey === 'drink_likes_min') {
      delete newFilters.drink_likes_min;
    } else if (conditionKey === 'use_my_area_only') {
      // マイエリア検索をOFFにする
      setUseMyAreaOnly(false);
      delete newFilters.use_my_area_only;
      // プロフィール反映がOFFの場合のみ area_ids もクリア
      if (!useProfileData) {
        delete newFilters.area_ids;
      }
    } else if (conditionKey === 'area_ids') {
      // エリア選択をクリア
      setSelectedAreas([]);
      setPrimaryArea(null);
      delete newFilters.area_ids;
    }

    setFilters(newFilters);

    // 条件削除後に店舗数を更新
    fetchShopCount(newFilters);
  };

  // キーワード検索関連のハンドラー
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeywordInput(value);

    // デバウンス処理で店舗候補検索
    if (keywordTimeoutRef.current) {
      clearTimeout(keywordTimeoutRef.current);
    }

    keywordTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        setIsSuggestionsLoading(true);
        try {
          const suggestions = await searchShopSuggestions(value);
          setShopSuggestions(suggestions);
          setSuggestionsCount(suggestions.length);
        } catch (error) {
          console.error('候補検索エラー:', error);
          setShopSuggestions([]);
          setSuggestionsCount(0);
        } finally {
          setIsSuggestionsLoading(false);
        }
      } else {
        setShopSuggestions([]);
        setSuggestionsCount(0);
        setIsSuggestionsLoading(false);
      }
    }, 300);
  };

  // エンターキー押下時の処理
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      handleKeywordSearch(keywordInput);
    }
  };

  const handleKeywordFocus = () => {
    setIsInputFocused(true);
    // 検索履歴を読み込み
    const history = getSearchHistory();
    setSearchHistory(history);
  };

  const handleKeywordBlur = () => {
    // 少し遅延させてからフォーカス状態を解除（候補クリック時の処理のため）
    setTimeout(() => {
      setIsInputFocused(false);
    }, 200);
  };

  const handleKeywordClear = () => {
    setKeywordInput('');
    setShopSuggestions([]);
    setSuggestionsCount(0);
  };

  const handleHistoryItemClick = (keyword: string) => {
    setKeywordInput(keyword);
    handleKeywordSearch(keyword);
  };

  const handleSuggestionClick = (shop: ShopSuggestion) => {
    // 店舗詳細ページに直接遷移
    setIsInputFocused(false);
    onClose();
    // Next.jsのrouter.pushを使用して遷移
    window.location.href = `/shops/${shop.id}`;
  };

  const handleKeywordSearch = (keyword: string) => {
    if (!keyword.trim()) return;

    // 検索履歴に保存
    saveSearchHistory(keyword.trim());

    // フィルターにキーワードを設定して検索実行
    const searchFilters: SearchFilters = {
      ...filters,
      keyword: keyword.trim(),
    };

    setIsInputFocused(false);
    onSearch(searchFilters);
    onClose();
  };

  const handleRemoveHistoryItem = (id: string) => {
    removeSearchHistory(id);
    const updatedHistory = getSearchHistory();
    setSearchHistory(updatedHistory);
  };

  // プロフィールデータ自動入力
  useEffect(() => {
    if (useProfileData && userProfile) {
      const profileFilters: SearchFilters = {};

      // 年齢は自動入力しない（ユーザーの好みではないため）


      // 利用シーンを自動入力（visit_purposes）
      if (userProfile.visit_purposes && Array.isArray(userProfile.visit_purposes) && userProfile.visit_purposes.length > 0) {
        profileFilters.visit_purposes = userProfile.visit_purposes.map((p) => p.name);
      }

      // プライマリエリアまたは最初のマイエリアを自動入力
      if (userProfile.primary_area) {
        setSelectedAreas([userProfile.primary_area as any]);
        setPrimaryArea(userProfile.primary_area as any);
        profileFilters.area_ids = [userProfile.primary_area.id];
      } else if (userProfile.my_areas && userProfile.my_areas.length > 0) {
        const firstArea = userProfile.my_areas[0];
        setSelectedAreas([firstArea as any]);
        setPrimaryArea(firstArea as any);
        profileFilters.area_ids = [firstArea.id];
      }

      // プロフィールオプションからの自動入力
      if (profileOptions) {
        // 興味・趣味
        const interests = (userProfile as Record<string, unknown>).interests;
        if (interests && Array.isArray(interests) && interests.length > 0) {
          const interestIds = (interests as Record<string, unknown>[])
            .map((interest: Record<string, unknown>) => interest.id?.toString() || interest)
            .filter(Boolean) as string[];
          if (interestIds.length > 0) {
            profileFilters.regular_interests = interestIds;
          }
        }


        // お酒の銘柄
        const alcoholBrands = (userProfile as Record<string, unknown>).alcohol_brands;
        if (alcoholBrands && Array.isArray(alcoholBrands) && alcoholBrands.length > 0) {
          const brandIds = (alcoholBrands as Record<string, unknown>[])
            .map((brand: Record<string, unknown>) => brand.id || brand)
            .filter(Boolean) as string[];
          if (brandIds.length > 0) {
            profileFilters.alcohol_brands = brandIds.map(id => parseInt(id.toString()));
          }
        }

        // お酒のカテゴリ（常連さんの好み）
        const alcoholCategories = (userProfile as Record<string, unknown>).alcohol_categories;
        if (alcoholCategories && Array.isArray(alcoholCategories) && alcoholCategories.length > 0) {
          const categoryIds = (alcoholCategories as Record<string, unknown>[])
            .map((category: Record<string, unknown>) => category.id || category)
            .filter(Boolean) as string[];
          if (categoryIds.length > 0) {
            profileFilters.regular_alcohol_preferences = categoryIds.map(id => parseInt(id.toString()));
          }
        }

        // 血液型
        const bloodType = (userProfile as any).blood_type;
        if (bloodType) {
          const bloodTypeId = typeof bloodType === 'object' 
            ? bloodType.id?.toString()
            : bloodType.toString();
          if (bloodTypeId) {
            profileFilters.regular_blood_types = [bloodTypeId];
          }
        }

        // MBTI
        const mbtiType = (userProfile as any).mbti_type;
        if (mbtiType) {
          const mbtiId = typeof mbtiType === 'object' 
            ? mbtiType.id?.toString()
            : mbtiType.toString();
          if (mbtiId) {
            profileFilters.regular_mbti_types = [mbtiId];
          }
        }

        // 運動頻度
        const exerciseFrequency = (userProfile as any).exercise_frequency;
        if (exerciseFrequency) {
          const exerciseId = typeof exerciseFrequency === 'object' 
            ? exerciseFrequency.id?.toString()
            : exerciseFrequency.toString();
          if (exerciseId) {
            profileFilters.regular_exercise_frequency = [exerciseId];
          }
        }

        // 食事制限・好み
        const dietaryPreferences = (userProfile as Record<string, unknown>).dietary_preferences;
        if (dietaryPreferences && Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0) {
          const dietaryIds = (dietaryPreferences as Record<string, unknown>[])
            .map((pref: Record<string, unknown>) => pref.id?.toString() || pref)
            .filter(Boolean) as string[];
          if (dietaryIds.length > 0) {
            profileFilters.regular_dietary_preferences = dietaryIds;
          }
        }

        // 職業・業種
        const occupation = (userProfile as any).occupation;
        if (occupation) {
          profileFilters.occupation = occupation;
        }

        const industry = (userProfile as any).industry;
        if (industry) {
          profileFilters.industry = industry;
        }
      }


      console.log('=== プロフィール反映ON ===');
      console.log('userProfile:', userProfile);
      console.log('profileOptions:', profileOptions);
      console.log('生成されたprofileFilters:', profileFilters);
      console.log('適用前のfilters:', filters);
      setFilters(prev => {
        const newFilters = { ...prev, ...profileFilters };
        console.log('適用後のfilters:', newFilters);
        // プロフィール反映後に店舗数を更新
        fetchShopCount(newFilters);
        return newFilters;
      });
    } else if (!useProfileData) {
      // プロフィール自動入力をOFFにした場合、関連する項目をクリア
      setFilters(prev => {
        const newFilters = { ...prev };

        // プロフィールから自動設定される項目をすべて削除
        delete newFilters.dominant_age_group;
        delete newFilters.visit_purposes;
        delete newFilters.area_ids;
        delete newFilters.regular_interests;
        delete newFilters.alcohol_brands;          // alcohol_brandsという名前で設定される
        delete newFilters.regular_alcohol_preferences; // お酒の好みカテゴリ（常連さんの好み）
        delete newFilters.regular_mbti_types;
        delete newFilters.regular_blood_types;
        delete newFilters.regular_exercise_frequency;
        delete newFilters.regular_dietary_preferences;
        delete newFilters.drink_names;
        delete newFilters.occupation;              // 職業データを追加
        delete newFilters.industry;                // 業種データを追加

        console.log('プロフィール反映OFF: フィルターをクリア', newFilters);
        // プロフィール反映OFF後に店舗数を更新
        fetchShopCount(newFilters);
        return newFilters;
      });

      // 画面の選択状態もクリア
      setSelectedTags([]);
      setSelectedDrinks([]);
    }
  }, [useProfileData, userProfile]);

  // マイエリア検索の切り替え処理
  useEffect(() => {
    if (useMyAreaOnly) {
      console.log('=== マイエリア検索ON ===');
      console.log('userProfile.primary_area:', userProfile?.primary_area);
      console.log('userProfile.my_areas:', userProfile?.my_areas);

      // プライマリエリアまたは最初のマイエリアを使用
      let areaId: number | null = null;

      if (userProfile?.primary_area?.id) {
        areaId = userProfile.primary_area.id;
        console.log('プライマリエリアを使用:', areaId);
      } else if (userProfile?.my_areas && userProfile.my_areas.length > 0) {
        areaId = userProfile.my_areas[0].id;
        console.log('最初のマイエリアを使用:', areaId);
      }

      if (areaId) {
        setFilters(prev => {
          const newFilters = { ...prev, use_my_area_only: true, area_ids: [areaId] };
          console.log('マイエリア適用後のfilters:', newFilters);
          fetchShopCount(newFilters);
          return newFilters;
        });
      } else {
        console.log('マイエリアデータが見つかりません');
      }
    } else if (!useMyAreaOnly) {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters.use_my_area_only;
        // プロフィール反映がOFFの場合のみ area_ids もクリア
        if (!useProfileData) {
          delete newFilters.area_ids;
        }
        console.log('マイエリア検索OFF: フィルター更新', newFilters);
        fetchShopCount(newFilters);
        return newFilters;
      });
    }
  }, [useMyAreaOnly, userProfile?.primary_area, userProfile?.my_areas, useProfileData]);

  // プロフィールオプション読み込み後、興味カテゴリのデフォルト選択
  useEffect(() => {
    if (profileOptions?.interests && !selectedInterestCategory) {
      const categories = Object.keys(groupInterestsByCategory(profileOptions.interests));
      if (categories.length > 0) {
        setSelectedInterestCategory(categories[0]);
      }
    }
  }, [profileOptions?.interests, selectedInterestCategory]);

  // ドリンクデータ取得関数をコンポーネントレベルに移動
  const fetchDrinksData = async (query = '') => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/search_drinks/${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      console.log('ドリンク検索API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      console.log('ドリンク検索レスポンス:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('ドリンク検索データ:', data);
        
        // レスポンス形式を柔軟に対応
        let drinks = [];
        if (Array.isArray(data)) {
          drinks = data;
        } else if (data.drinks && Array.isArray(data.drinks)) {
          drinks = data.drinks;
        } else if (data.results && Array.isArray(data.results)) {
          drinks = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          drinks = data.data;
        }
        
        console.log('処理後のドリンクデータ:', drinks);
        setAllDrinks(drinks);
        return drinks;
      } else {
        console.error('ドリンクデータの取得に失敗しました:', response.status, response.statusText);
        setAllDrinks([]);
        return [];
      }
    } catch (error) {
      console.error('ドリンクAPI呼び出しエラー:', error);
      setAllDrinks([]);
      return [];
    }
  };

  const updateFilters = (key: keyof SearchFilters, value: unknown) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    
    // 印象タグの同期
    if (key === 'impression_tags') {
      const tagString = value as string;
      setSelectedTags(tagString ? tagString.split(',') : []);
    }

    // 前のタイムアウトをクリア
    if (fetchCountTimeoutRef.current) {
      clearTimeout(fetchCountTimeoutRef.current);
    }

    // 件数を更新（デバウンス）
    fetchCountTimeoutRef.current = setTimeout(() => {
      console.log('=== updateFilters API呼び出し ===');
      console.log('key:', key, 'value:', value);
      console.log('newFilters:', newFilters);
      console.log('🎯 fetchShopCountを呼び出します');
      fetchShopCount(newFilters);
    }, 100);
  };

  // 店舗件数を取得する関数
  const fetchShopCount = async (searchFilters: SearchFilters) => {
    try {
      console.log('=== fetchShopCount呼び出し ===');
      console.log('searchFilters:', searchFilters);

      // Handle location data if needed
      let processedFilters = { ...searchFilters };

      // Handle location data for distance-based searches
      if (searchFilters.distance_km !== undefined) {
        try {
          const position = await getCurrentPosition();
          processedFilters.user_lat = position.coords.latitude;
          processedFilters.user_lng = position.coords.longitude;
        } catch (error) {
          console.warn('位置情報の取得に失敗:', error);
          // デフォルト位置（東京駅）を使用
          processedFilters.user_lat = 35.6812;
          processedFilters.user_lng = 139.7671;
        }
      }
      
      // Use centralized searchShops function
      const data = await searchShops(processedFilters);
      console.log('フェッチ結果:', data); // デバッグログ

      const newCount = data.count || 0;
      if (newCount !== shopCount) {
        // カウンターアップアニメーション
        animateCountUp(shopCount, newCount);
      }
      setShopCount(newCount);

      // デバッグ用に店舗名も保存
      if (data.shops && Array.isArray(data.shops)) {
        // Use shops array from centralized API response
        setDebugShops(data.shops.slice(0, 10).map((shop: any) => ({
          id: shop.id,
          name: shop.name
        })));
      } else {
        console.log('店舗データの形式が不明:', data);
        setDebugShops([]);
      }
    } catch (error) {
      console.error('店舗件数取得エラー:', error);
      setShopCount(0);
    }
  };

  const handleMyAreaChange = (area: Area | null) => {
    console.log('!!! マイエリア変更:', area);
    // 型安全性チェック
    if (area && typeof area === 'object' && 'id' in area && 'name' in area) {
      setSelectedMyArea(area);
      // マイエリア変更時に検索フィルターを更新（常に実行）
      if (useMyAreaOnly) {
        console.log('!!! マイエリアフィルター更新:', area.id, area.name);
        const newFilters = { ...filters, area_ids: [area.id] };
        setFilters(newFilters);
        // 即座に検索を実行
        fetchShopCount(newFilters);
      }
    } else if (area === null) {
      setSelectedMyArea(null);
      if (useMyAreaOnly) {
        console.log('!!! マイエリアフィルター削除');
        const newFilters = { ...filters, area_ids: [] };
        setFilters(newFilters);
        fetchShopCount(newFilters);
      }
    }
  };

  const handleUseMyAreaToggle = (value: boolean) => {
    setUseMyAreaOnly(value);
    if (value && selectedMyArea) {
      // マイエリア検索をONにして、選択されたエリアで検索
      updateFilters('use_my_area_only', true);
      updateFilters('area_ids', [selectedMyArea.id]);
    } else {
      // マイエリア検索をOFFにする
      updateFilters('use_my_area_only', false);
      updateFilters('area_ids', []);
    }
  };

  const handleAtmosphereChange = (indicatorId: number, preference: AtmospherePreference | null) => {
    console.log('🔥🔥🔥 handleAtmosphereChange呼ばれた:', indicatorId, preference);
    alert('DEBUG: handleAtmosphereChange called: ' + indicatorId + ', ' + preference);

    // 新しい3択雰囲気フィルターを使用
    const atmosphere_simple = { ...(filters.atmosphere_simple || {}) };

    if (preference === null) {
      delete atmosphere_simple[indicatorId.toString()];
    } else {
      atmosphere_simple[indicatorId.toString()] = preference;
    }

    // 空のオブジェクトの場合はundefinedに設定
    const finalFilter = Object.keys(atmosphere_simple).length > 0 ? atmosphere_simple : undefined;

    console.log('🚀 雰囲気フィルター更新:', finalFilter);

    // 直接 setFilters を呼び出して fetchShopCount も即座に実行
    setFilters(prev => {
      const newFilters = { ...prev, atmosphere_simple: finalFilter };
      console.log('🔥 新しいフィルターでAPI呼び出し:', newFilters);

      // 直接 fetchShopCount を呼び出し
      setTimeout(() => {
        fetchShopCount(newFilters);
      }, 100);

      return newFilters;
    });
  };

  // タグ入力時の候補表示
  useEffect(() => {
    if (tagInput.trim().length > 0) {
      // filters.impression_tagsから現在選択中のタグを取得
      const currentImpressionsTagsString = filters.impression_tags || '';
      const currentImpressionsTags = currentImpressionsTagsString ? currentImpressionsTagsString.split(',') : [];
      
      const matchingTags = allTags.filter(tag => 
        tag.value.toLowerCase().includes(tagInput.toLowerCase()) &&
        !currentImpressionsTags.includes(tag.value)
      );
      setTagSuggestions(matchingTags.slice(0, 10)); // 最大10個まで
    } else {
      setTagSuggestions([]);
    }
  }, [tagInput, allTags, filters.impression_tags]);

  // タグ選択時の処理
  const handleTagSelection = (tagValue: string) => {
    const currentImpressionsTagsString = filters.impression_tags || '';
    const currentImpressionsTags = currentImpressionsTagsString ? currentImpressionsTagsString.split(',') : [];
    
    if (!currentImpressionsTags.includes(tagValue)) {
      const newSelectedTags = [...currentImpressionsTags, tagValue];
      setSelectedTags(newSelectedTags);
      updateFilters('impression_tags', newSelectedTags.join(','));
    }
    setTagInput('');
    setTagSuggestions([]);
  };


  // ドリンク検索の処理
  const handleDrinkSearch = (value: string) => {
    setDrinkInput(value);
    
    if (value.trim()) {
      // API検索を実行（リアルタイム検索）
      fetchDrinksData(value.trim()).then((drinks) => {
        // 検索結果から既に選択済みのドリンクを除外
        const filtered = drinks.filter((drink: { id: number; name: string }) =>
          !selectedDrinks.includes(drink.name)
        ).slice(0, 10);
        setDrinkSuggestions(filtered);
      });
    } else {
      setDrinkSuggestions([]);
    }
  };

  const addDrink = (drink: string) => {
    if (!selectedDrinks.includes(drink)) {
      const newDrinks = [...selectedDrinks, drink];
      setSelectedDrinks(newDrinks);
      updateFilters('drink_names', newDrinks);
      
      // alcohol_brandsとも同期する
      const matchingBrand = alcoholBrands.find(brand => brand.name === drink);
      if (matchingBrand) {
        const currentAlcoholBrands = filters.alcohol_brands || [];
        if (!currentAlcoholBrands.includes(matchingBrand.id)) {
          updateFilters('alcohol_brands', [...currentAlcoholBrands, matchingBrand.id]);
        }
      }
    }
    setDrinkInput('');
    setDrinkSuggestions([]);
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

    // 基本条件
    if (filters.distance_km) {
      tags.push({ key: 'distance_km', label: `${filters.distance_km}km以内`, category: '距離' });
    }

    if (filters.open_now) {
      tags.push({ key: 'open_now', label: '今すぐ入れるお店', category: '営業時間' });
    }

    // 常連さんの条件
    if (filters.welcome_min) {
      tags.push({ key: 'welcome_min', label: `常連数：${filters.welcome_min}人以上`, category: '常連さん' });
    }

    if (filters.regular_count_min) {
      tags.push({ key: 'regular_count_min', label: `常連数：${filters.regular_count_min}人以上`, category: '常連さん' });
    }

    if (filters.dominant_age_group) {
      tags.push({ key: `dominant_age_${filters.dominant_age_group}`, label: `${filters.dominant_age_group}が最多`, category: '年代' });
    }

    if (filters.regular_interests?.length) {
      filters.regular_interests.forEach(id => {
        const interest = profileOptions?.interests?.find((i) => i.id.toString() === id);
        const labelName = interest ? interest.name : `ID:${id}`;
        tags.push({ key: `interest_${id}`, label: `興味：${labelName}`, category: '興味' });
      });
    }

    if (filters.regular_genders?.length) {
      tags.push({ key: 'genders', label: filters.regular_genders.join('、'), category: '性別' });
    }

    if (filters.regular_blood_types?.length) {
      const bloodTypeNames = filters.regular_blood_types.map(id => {
        const bloodType = profileOptions?.blood_types?.find((bt) => bt.id.toString() === id);
        return bloodType?.name || `ID:${id}`;
      });
      tags.push({ key: 'blood_types', label: bloodTypeNames.join('、'), category: '血液型' });
    }

    if (filters.regular_mbti_types?.length) {
      const mbtiNames = filters.regular_mbti_types.map(id => {
        const mbti = profileOptions?.mbti_types?.find((m) => m.id.toString() === id);
        return mbti?.name || `ID:${id}`;
      });
      tags.push({ key: 'mbti_types', label: mbtiNames.join('、'), category: 'MBTI' });
    }

    if (filters.regular_exercise_frequency?.length) {
      const exerciseNames = filters.regular_exercise_frequency.map(id => {
        const exercise = profileOptions?.exercise_frequencies?.find((e) => e.id.toString() === id);
        return exercise?.name || `ID:${id}`;
      });
      tags.push({ key: 'exercise_frequency', label: exerciseNames.join('、'), category: '運動頻度' });
    }

    if (filters.regular_dietary_preferences?.length) {
      const dietaryNames = filters.regular_dietary_preferences.map(id => {
        const dietary = profileOptions?.dietary_preferences?.find((d) => d.id.toString() === id);
        return dietary?.name || `ID:${id}`;
      });
      tags.push({ key: 'dietary_preferences', label: dietaryNames.join('、'), category: '食事制限' });
    }

    if (filters.occupation) {
      tags.push({ key: 'occupation', label: filters.occupation, category: '職業' });
    }

    if (filters.industry) {
      tags.push({ key: 'industry', label: filters.industry, category: '業種' });
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

    // 雰囲気条件 - 3択システム
    if (filters.atmosphere_simple) {
      Object.entries(filters.atmosphere_simple).forEach(([indicatorId, preference]) => {
        const indicator = atmosphereIndicators.find(i => i.id.toString() === indicatorId);
        if (indicator) {
          // 3択の表示名を生成
          const getPreferenceLabel = (pref: AtmospherePreference) => {
            switch (pref) {
              case 'quiet': return '静かな/落ち着いた';
              case 'neutral': return 'どちらでもOK';
              case 'social': return '賑やか/社交的';
              default: return pref;
            }
          };
          const preferenceLabel = getPreferenceLabel(preference);
          tags.push({
            key: `atmosphere_${indicatorId}`,
            label: `${indicator.name}：${preferenceLabel}`,
            category: '雰囲気'
          });
        }
      });
    }

    // 印象タグ条件
    if (filters.impression_tags) {
      const tagNames = filters.impression_tags.split(',').slice(0, 3);
      tags.push({ key: 'impression_tags', label: tagNames.join('、'), category: '印象' });
    }

    // 座席数条件
    if (filters.seat_count_min) {
      tags.push({ key: 'seat_count', label: `${filters.seat_count_min}席以上`, category: '座席' });
    }

    // 特徴条件
    if (filters.shop_types?.length) {
      const typeNames = filters.shop_types.map(id => {
        const type = shopTypeOptions.find(t => t.id === id);
        return type?.name || `ID:${id}`;
      });
      tags.push({ key: 'shop_types', label: typeNames.join('、'), category: 'タイプ' });
    }

    if (filters.shop_layouts?.length) {
      const layoutNames = filters.shop_layouts.map(id => {
        const layout = shopLayoutOptions.find(l => l.id === id);
        return layout?.name || `ID:${id}`;
      });
      tags.push({ key: 'shop_layouts', label: layoutNames.join('、'), category: 'レイアウト' });
    }

    if (filters.shop_options?.length) {
      const optionNames = filters.shop_options.map(id => {
        const option = shopOptionOptions.find(o => o.id === id);
        return option?.name || `ID:${id}`;
      });
      tags.push({ key: 'shop_options', label: optionNames.join('、'), category: '設備・サービス' });
    }

    // ドリンク条件
    const drinkNames = filters.drink_names || selectedDrinks;
    if (drinkNames.length) {
      const drinkText = drinkNames.slice(0, 2).join('、');
      tags.push({ key: 'drinks', label: drinkText, category: 'ドリンク' });
    }

    if (filters.drink_likes_min) {
      tags.push({ key: 'drink_likes_min', label: `いいね数：${filters.drink_likes_min}以上`, category: 'ドリンク人気度' });
    }

    // エリア条件
    if (filters.use_my_area_only) {
      // 選択されたマイエリアがある場合はそれを表示、なければuserProfileから取得
      const areaName = selectedMyArea?.name ||
                      userProfile?.primary_area?.name ||
                      (userProfile?.my_areas && userProfile.my_areas.length > 0 ? userProfile.my_areas[0]?.name : 'マイエリア');
      tags.push({ key: 'use_my_area_only', label: `マイエリア: ${areaName}`, category: 'エリア' });
    } else if (filters.area_ids?.length) {
      // 通常のエリア選択（マイエリアOFF時）
      const areaNames = filters.area_ids.map(id => {
        const area = selectedAreas.find(a => a.id === id) || profileOptions?.areas?.find((a: any) => a.id === id);
        return area?.name || `ID:${id}`;
      });
      if (areaNames.length > 0) {
        tags.push({ key: 'area_ids', label: areaNames.join('、'), category: 'エリア' });
      }
    }

    return tags;
  };

  // ヘルパー関数

  // 興味をカテゴリごとにグループ化
  const groupInterestsByCategory = (interests: Array<{ id: number; name: string; category: { id: number; name: string } }>) => {
    const groups: { [categoryName: string]: Array<{ id: number; name: string; category: { id: number; name: string } }> } = {};

    interests?.forEach((interest) => {
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
      // Use centralized fetchShopTags function
      const tags = await fetchShopTags();

      // Map to the expected format if needed
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
        <h2>常連さんの情報で絞り込む</h2>
      </div>
      
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Filter size={16} strokeWidth={1}/>
          歓迎度レベル
        </h4>
        <div className={`${styles.welcomeLevelOptions} ${styles.twoColumnGrid}`}>
          {[
            { value: 0, label: '指定なし', description: '' },
            { value: 5, label: '5人以上', description: 'がウェルカム' },
            { value: 15, label: '10人以上', description: 'がウェルカム' },
            { value: 30, label: '20人以上', description: 'がウェルカム' }
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
            <span className={styles.rangeCount}>{filters.regular_count_min || 3}人　</span>
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
            <span className={styles.subTitle}>最も多い年代</span>
            <CustomRadioGroup
              name="dominant_age_group"
              value={filters.dominant_age_group || ''}
              onChange={(value) => updateFilters('dominant_age_group', value || undefined)}
              className={styles.radioGridLayout}
              options={[
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
          <div className={styles.subTitle}>興味カテゴリを選択</div>
          <StyledAutocomplete
            options={Object.keys(groupInterestsByCategory(profileOptions?.interests || [])).map(categoryName => ({
              key: categoryName,
              label: categoryName,
              value: categoryName
            }))}
            defaultSelectedKey={selectedInterestCategory}
            onSelectionChange={(key) => setSelectedInterestCategory(key || 'SNS・プラットフォーム')}
          />
          
          {selectedInterestCategory && (
            <div style={{ marginTop: '0.2rem' }}>
              <div className={styles.subTitle}>{selectedInterestCategory}</div>
              <CustomCheckboxGroup
                name="regular_interests"
                values={filters.regular_interests || []}
                onChange={(values) => updateFilters('regular_interests', values.length > 0 ? values : undefined)}
                options={groupInterestsByCategory(profileOptions?.interests || [])[selectedInterestCategory]?.map((interest: any) => ({
                  label: interest.name,
                  value: interest.id.toString()
                })) || []}
              />
            </div>
          )}
        </div>
      </div>


      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Settings size={16} strokeWidth={1} />
          ライフスタイル
        </h4>
        <div className={styles.subGroup}>
          <div className={styles.subTitle}>ライフスタイルカテゴリを選択</div>
          <StyledAutocomplete
            options={[
              { key: '血液型', label: '血液型', value: '血液型' },
              { key: 'MBTI', label: 'MBTI', value: 'MBTI' },
              { key: '運動頻度', label: '運動頻度', value: '運動頻度' },
              { key: '食事制限・好み', label: '食事制限・好み', value: '食事制限・好み' }
            ]}
            defaultSelectedKey={selectedLifestyleCategory}
            onSelectionChange={(key) => setSelectedLifestyleCategory(key || '血液型')}
            placeholder="ライフスタイルカテゴリを選択してください"
          />
          
          {selectedLifestyleCategory === '血液型' && (
            <div style={{ marginTop: '0.2rem' }}>
              <div className={styles.subTitle}>血液型</div>
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
          )}

          {selectedLifestyleCategory === 'MBTI' && (
            <div style={{ marginTop: '0.2rem' }}>
              <div className={styles.subTitle}>MBTI</div>
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
          )}

          {selectedLifestyleCategory === '運動頻度' && (
            <div style={{ marginTop: '0.2rem' }}>
              <div className={styles.subTitle}>運動頻度</div>
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
          )}

          {selectedLifestyleCategory === '食事制限・好み' && (
            <div style={{ marginTop: '0.2rem' }}>
              <div className={styles.subTitle}>食事制限・好み</div>
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
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>
          <Settings size={16} strokeWidth={1} />
          常連さんの職業・業種
        </h4>
        <div className={styles.occupationInputs}>
          <InputDefault
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
          <InputDefault
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
        <h2>雰囲気・印象の情報で絞り込む</h2>
      </div>

      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>印象タグ</h4>
        

        {/* タグ入力 */}
        <InputDefault
          type="text"
          placeholder="お店の印象を入力（例：おしゃれ、アットホーム、静か）"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          size="lg"
          className={styles.textInput}
          classNames={{
            inputWrapper: styles.tagInputWrapper,
            input: styles.tagInputElement,
          }}
        />
        
        {/* 候補タグの表示 */}
        {tagSuggestions.length > 0 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>候補</p>
            <div className={styles.suggestionChips}>
              {tagSuggestions.map(tag => (
                <Chip
                  key={tag.id}
                  onClick={() => handleTagSelection(tag.value)}
                  className={styles.suggestionChip}
                  variant="flat"
                  color="primary"
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
          // 現在の雰囲気フィルターから値を取得（3択の場合）
          const filterKey = indicator.id.toString();
          const currentPreference = filters.atmosphere_simple?.[filterKey] || null;

          console.log(`指標 ${indicator.name} (ID: ${indicator.id})の現在値:`, currentPreference);
          console.log('🔥🔥🔥 filters.atmosphere_simple:', filters.atmosphere_simple);

          return (
            <AtmosphereRadio
              key={indicator.id}
              indicator={indicator}
              value={currentPreference}
              onChange={(preference: AtmospherePreference | null) => handleAtmosphereChange(indicator.id, preference)}
            />
          );
        })}
      </div>


    </div>
  );

  const renderAreaSearch = () => (
    <div className={styles.searchCategory}>
      <div className={styles.categoryDescription}>
        <h2>エリアで絞り込む</h2>
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
        <h2>店舗の基本情報で絞り込む</h2>
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
          <InputDefault
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
          <div className={styles.budgetRangeGrid}>
            <button
              type="button"
              className={`${styles.budgetRangeButton} ${filters.budget_max === 2000 && !filters.budget_min ? styles.active : ''}`}
              onClick={() => {
                updateFilters('budget_min', undefined);
                updateFilters('budget_max', 2000);
              }}
            >
              2000円以下
            </button>
            <button
              type="button"
              className={`${styles.budgetRangeButton} ${filters.budget_min === 2000 && filters.budget_max === 4000 ? styles.active : ''}`}
              onClick={() => {
                updateFilters('budget_min', 2000);
                updateFilters('budget_max', 4000);
              }}
            >
              2000〜4000円
            </button>
            <button
              type="button"
              className={`${styles.budgetRangeButton} ${filters.budget_min === 4000 && filters.budget_max === 6000 ? styles.active : ''}`}
              onClick={() => {
                updateFilters('budget_min', 4000);
                updateFilters('budget_max', 6000);
              }}
            >
              4000〜6000円
            </button>
            <button
              type="button"
              className={`${styles.budgetRangeButton} ${filters.budget_min === 6000 && filters.budget_max === 8000 ? styles.active : ''}`}
              onClick={() => {
                updateFilters('budget_min', 6000);
                updateFilters('budget_max', 8000);
              }}
            >
              6000〜8000円
            </button>
            <button
              type="button"
              className={`${styles.budgetRangeButton} ${filters.budget_min === 8000 && !filters.budget_max ? styles.active : ''}`}
              onClick={() => {
                updateFilters('budget_min', 8000);
                updateFilters('budget_max', undefined);
              }}
            >
              8000円以上
            </button>
          </div>
        </div>
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
          <h2>お店の特徴で絞り込む</h2>
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
          <h2>ドリンクで絞り込む</h2>
        </div>
        
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>銘柄・ドリンクを検索</h4>
          <InputDefault
            type="text"
            placeholder="例：マッカラン、マティーニ"
            value={drinkInput}
            onChange={(e) => handleDrinkSearch(e.target.value)}
            className={styles.tagInputElement}
            classNames={{
              inputWrapper: styles.tagInputWrapper,
            }}
            size="sm"
          />


          {drinkSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              <p className={styles.suggestionsTitle}>候補のドリンク</p>
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

          {/* 選択済みドリンク一覧 */}
          {selectedDrinks.length > 0 && (
            <div className={styles.selectedDrinks}>
              <p className={styles.selectedDrinksTitle}>選択済みドリンク</p>
              <div className={styles.selectedDrinksContainer}>
                {selectedDrinks.map((drink, index) => (
                  <Chip
                    key={index}
                    color="primary"
                    variant="flat"
                    size="sm"
                    onClose={() => {
                      const newDrinks = selectedDrinks.filter(d => d !== drink);
                      setSelectedDrinks(newDrinks);
                      updateFilters('drink_names', newDrinks.length > 0 ? newDrinks : undefined);
                      
                      // alcohol_brandsからも削除
                      const matchingBrand = alcoholBrands.find(brand => brand.name === drink);
                      if (matchingBrand) {
                        const currentAlcoholBrands = filters.alcohol_brands || [];
                        const newAlcoholBrands = currentAlcoholBrands.filter(id => id !== matchingBrand.id);
                        updateFilters('alcohol_brands', newAlcoholBrands.length > 0 ? newAlcoholBrands : undefined);
                      }
                    }}
                    className={styles.selectedDrinkChip}
                  >
                    {drink}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>ドリンクの人気で絞り込み</h4>
          <div className={styles.rangeGroup}>
            <span>いいね数</span>
            <InputDefault
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
                  values={categoryBrands.filter(brand => selectedDrinks.includes(brand.name)).map(brand => brand.id.toString())}
                  onChange={(values) => {
                    // 選択されたブランド名を取得
                    const selectedBrandNames = values.map(value => {
                      const brand = categoryBrands.find(b => b.id.toString() === value);
                      return brand?.name;
                    }).filter((name): name is string => !!name);
                    
                    // このカテゴリ以外のドリンクを保持
                    const otherCategoryDrinks = selectedDrinks.filter(drink => 
                      !categoryBrands.some(brand => brand.name === drink)
                    );
                    
                    // 新しい選択済みドリンクリスト
                    const newSelectedDrinks = [...otherCategoryDrinks, ...selectedBrandNames];
                    setSelectedDrinks(newSelectedDrinks);
                    updateFilters('drink_names', newSelectedDrinks.length > 0 ? newSelectedDrinks : undefined);
                    
                    // alcohol_brandsも更新
                    const selectedBrandIds = values.map(v => parseInt(v));
                    const otherCategoryBrandIds = (filters.alcohol_brands || []).filter(id => 
                      !categoryBrands.some(brand => brand.id === id)
                    );
                    const newAlcoholBrands = [...otherCategoryBrandIds, ...selectedBrandIds];
                    updateFilters('alcohol_brands', newAlcoholBrands.length > 0 ? newAlcoholBrands : undefined);
                  }}
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
    <div className={styles.footerContainer}>
      {/* 設定済み条件表示 */}
      {generateConditionTags().length > 0 && (
        <div className={styles.selectedConditionsSection}>
          <h4 className={styles.selectedConditionsTitle}>設定済み条件</h4>
          <ScrollShadow orientation="horizontal" hideScrollBar className={styles.selectedConditionsScroll}>
            <div className={styles.selectedConditionsTags}>
              {generateConditionTags().map((tag) => (
                <Chip
                  key={tag.key}
                  variant="flat"
                  size="sm"
                  onClose={() => handleRemoveCondition(tag.key)}
                  className={styles.selectedConditionTag}
                  style={{
                    background: 'rgba(0, 194, 255, 0.15)',
                    color: '#00c2ff',
                    border: '1px solid rgba(0, 194, 255, 0.3)'
                  }}
                >
                  {tag.label}
                </Chip>
              ))}
            </div>
          </ScrollShadow>
        </div>
      )}

      <div className={styles.modalFooter}>
        <div className={styles.shopCountDisplay}>
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <span className={styles.shopCountText} style={{ cursor: 'pointer' }}>
                <strong>{isInputFocused && keywordInput ? suggestionsCount : (displayCount || shopCount)}件</strong>
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 max-w-xs"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px'
              }}
            >
              <div className={styles.popoverContent}>
                <h4 className="font-bold text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  検索結果（先頭10件）
                </h4>
                {debugShops.length > 0 ? (
                  <div className="space-y-1">
                    {debugShops.map((shop, index) => (
                      <div key={shop.id} className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {index + 1}. {shop.name}
                      </div>
                    ))}
                    {shopCount > 10 && (
                      <div className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        ...他 {shopCount - 10}件
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    該当する店舗がありません
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <span className={styles.shopCountText} style={{ cursor: 'pointer' }}>
                <strong>{isInputFocused && keywordInput ? suggestionsCount : (displayCount || shopCount)}件</strong>
              </span>
            </PopoverTrigger>
            <PopoverContent 
              className="p-4 max-w-xs"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px'
              }}
            >
              <div className={styles.popoverContent}>
                <h4 className="font-bold text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  検索結果（先頭10件）
                </h4>
                {debugShops.length > 0 ? (
                  <div className="space-y-1">
                    {debugShops.map((shop, index) => (
                      <div key={shop.id} className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {index + 1}. {shop.name}
                      </div>
                    ))}
                    {shopCount > 10 && (
                      <div className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        ...他 {shopCount - 10}件
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    該当する店舗がありません
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
    </div>
  );

  // キーワード検索用のカスタムヘッダー
  // キーワード検索ヘッダー（常に表示）
  const keywordHeader = (
    <div className={styles.keywordSearchHeader}>
      <KeywordInput
        value={keywordInput}
        onChange={handleKeywordChange}
        onClear={handleKeywordClear}
        onFocus={handleKeywordFocus}
        onBlur={handleKeywordBlur}
        onKeyPress={handleKeyPress}
        placeholder="店舗名で検索"
        autoFocus={openMode?.keywordMode}
        classNames={{
          inputWrapper: styles.keywordInputWrapper,
          input: styles.keywordInputField
        }}
      />
    </div>
  );

  // コンテンツの条件分岐レンダリング
  const renderContent = () => {
    // ②検索窓がアクティブ兼何も入力されてない時 → 履歴表示
    if (isInputFocused && keywordInput === '') {
      return (
        <div className={styles.historySection}>
          {searchHistory.length > 0 ? (
            <>
              <div className={styles.sectionHeader}>
                <Clock size={18} strokeWidth={1} />
                <span>検索履歴</span>
              </div>
              <div className={styles.historyList}>
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className={styles.historyItem}
                    onClick={() => handleHistoryItemClick(item.keyword)}
                  >
                    <div className={styles.historyContent}>
                      <Search size={18} strokeWidth={1} className={styles.historyIcon} />
                      <span className={styles.historyKeyword}>{item.keyword}</span>
                    </div>
                    <button
                      className={styles.historyRemove}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHistoryItem(item.id);
                      }}
                    >
                      <X size={18} strokeWidth={1} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <Clock size={48} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyText}>検索履歴がありません</p>
            </div>
          )}
        </div>
      );
    }

    // ③検索窓がアクティブ兼何か入力されていたら → 候補店舗表示
    if (isInputFocused && keywordInput !== '') {
      return (
        <div className={styles.suggestionsSection}>
          {isSuggestionsLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.emptyText}>検索中...</p>
            </div>
          ) : shopSuggestions.length > 0 ? (
            <div className={styles.suggestionsList}>
              {shopSuggestions.map((shop) => (
                <div
                  key={shop.id}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(shop)}
                >
                  <div className={styles.suggestionMain}>
                    <span className={styles.suggestionName}>{shop.name}</span>
                    {shop.shop_type && (
                      <span className={styles.suggestionType}>{shop.shop_type}</span>
                    )}
                  </div>
                  {shop.area && (
                    <span className={styles.suggestionAddress}>{shop.area}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Search size={48} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyText}>該当する店舗が見つかりません</p>
            </div>
          )}
        </div>
      );
    }

    // 通常のこだわり検索コンテンツ
    return (
      <>
        {/* プロフィール自動入力 - ログイン時のみ表示 */}
        {user && (
          <div className={styles.profileSection}>
            <div className={styles.profileToggle}>
              <SwitchVisibility
                isSelected={useProfileData}
                onValueChange={setUseProfileData}
                showIcon={false}
              />
              <div className={styles.toggleContent}>
                <span className={styles.toggleText}>
                  自分の好みを反映する
                </span>
                <span className={styles.toggleDesc}>同じ傾向の常連さんがいる店舗を探せます。</span>
              </div>
            </div>
          </div>
        )}
        {/* マイエリア検索スイッチ - マイエリアが設定されている場合のみ表示 */}
        {(() => {
          // my_areasまたはprimary_areaが存在する場合にスイッチを表示
          return (userProfile?.my_areas && Array.isArray(userProfile.my_areas) && userProfile.my_areas.length > 0) || userProfile?.primary_area;
        })() && (
          <div className={styles.myAreaSection}>
            <SwitchVisibility
              isSelected={useMyAreaOnly}
              onValueChange={handleUseMyAreaToggle}
              showIcon={false}
            />
            <div className={styles.toggleContent}>
              <span className={styles.toggleText}>
                マイエリアで検索する
              </span>
              <div className={styles.myAreaSelection}>
                {(() => {
                  // ユーザーのエリア情報からエリアリストを作成（型安全）
                  const availableAreas: Area[] = [];

                  // 型ガード関数
                  const isValidArea = (area: unknown): area is Area => {
                    return area !== null &&
                           area !== undefined &&
                           typeof area === 'object' &&
                           'id' in area &&
                           'name' in area &&
                           typeof (area as any).id === 'number' &&
                           typeof (area as any).name === 'string';
                  };

                  // プライマリエリアがあれば追加（型チェック付き）
                  if (isValidArea(userProfile?.primary_area)) {
                    availableAreas.push(userProfile.primary_area);
                  }

                  // マイエリアがあれば追加（重複を避ける、型チェック付き）
                  if (userProfile?.my_areas && Array.isArray(userProfile.my_areas)) {
                    userProfile.my_areas.forEach((area: unknown) => {
                      if (isValidArea(area)) {
                        if (!availableAreas.find(existing => existing.id === area.id)) {
                          availableAreas.push(area);
                        }
                      }
                    });
                  }

                  // profileOptionsからのエリアデータも追加（重複を避ける、型チェック付き）
                  if (profileOptions?.areas && Array.isArray(profileOptions.areas)) {
                    profileOptions.areas.forEach((area: unknown) => {
                      if (isValidArea(area)) {
                        if (!availableAreas.find(existing => existing.id === area.id)) {
                          availableAreas.push(area);
                        }
                      }
                    });
                  }

                  if (availableAreas.length > 0) {
                    return (
                      <Popover placement="bottom" >
                        <PopoverTrigger>
                          <Link
                            size="sm"
                            className={styles.myAreaTrigger}
                            showAnchorIcon
                            anchorIcon={<ChevronDown strokeWidth={1} size={16} />}
                          >
                            {selectedMyArea?.name || 'エリアを選択'}
                          </Link>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-0 min-w-[200px]"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            border: '1px solid rgba(0, 255, 255, 0.3)',
                            borderRadius: '8px'
                          }}
                        >
                          <Listbox
                            selectionMode="single"
                            selectedKeys={selectedMyArea ? [selectedMyArea.id.toString()] : []}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0];
                              if (selectedKey) {
                                const area = availableAreas.find((a: Area) => a.id.toString() === selectedKey);
                                handleMyAreaChange(area || null);
                              } else {
                                handleMyAreaChange(null);
                              }
                            }}
                            className={styles.areaListbox}
                          >
                            {availableAreas.map((area: Area) => (
                              <ListboxItem key={area.id.toString()}>
                                {area.name}
                              </ListboxItem>
                            ))}
                          </Listbox>
                        </PopoverContent>
                      </Popover>
                    );
                  } else {
                    return (
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                        利用可能なエリアがありません
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ログイン時のみ表示 */}
        {user && (
          <Divider className={styles.divider} />
        )}
        

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
                content: (
                  <div className={styles.tabContent}>
                    {getContentForCategory()}
                  </div>
                )
              };
            })}
            selectedKey={activeCategory}
            onSelectionChange={(key) => setActiveCategory(key as SearchCategory)}
            variant="solid"
            size="sm"
            fullWidth={true}
          />
        </div>
      </>
    );
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      customHeader={keywordHeader}
      size="full"
      footer={modalFooter}
      scrollBehavior="inside"
    >
      <div className={styles.searchContent}>
        {renderContent()}
      </div>
    </CustomModal>
  );
};

export default ShopSearchModal;
