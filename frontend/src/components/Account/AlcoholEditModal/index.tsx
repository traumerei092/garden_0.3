'use client'

import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import { Eye } from 'lucide-react';
import styles from './style.module.scss';
import Modal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import { User as UserType, ProfileOptions, AlcoholCategory, AlcoholBrand, DrinkStyle } from '@/types/users';
import { updateAlcoholCategories } from '@/actions/profile/updateAlcoholCategories';
import { updateAlcoholBrands } from '@/actions/profile/updateAlcoholBrands';
import { updateDrinkStyles } from '@/actions/profile/updateDrinkStyles';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';

interface AlcoholEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  profileOptions: ProfileOptions;
  onUpdate: (updatedUser: UserType) => void;
}

const AlcoholEditModal: React.FC<AlcoholEditModalProps> = ({
  isOpen,
  onClose,
  user,
  profileOptions,
  onUpdate
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDrinkStyles, setSelectedDrinkStyles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // モーダルが開かれた時に現在の選択状態を設定
  useEffect(() => {
    if (isOpen) {
      setSelectedCategories(user.alcohol_categories?.map(cat => String(cat.id)) || []);
      setSelectedBrands(user.alcohol_brands?.map(brand => String(brand.id)) || []);
      setSelectedDrinkStyles(user.drink_styles?.map(style => String(style.id)) || []);
    }
  }, [isOpen, user]);

  // 選択されたカテゴリに基づいて銘柄とスタイルをフィルタリング
  const getFilteredBrands = () => {
    if (selectedCategories.length === 0) return profileOptions.alcohol_brands;
    return profileOptions.alcohol_brands.filter(brand => 
      selectedCategories.includes(String(brand.category.id))
    );
  };

  const getFilteredDrinkStyles = () => {
    if (selectedCategories.length === 0) return profileOptions.drink_styles;
    return profileOptions.drink_styles.filter(style => 
      selectedCategories.includes(String(style.category.id))
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // お酒のジャンルを更新
      const updatedUser1 = await updateAlcoholCategories(selectedCategories.map(id => parseInt(id)));
      
      // お酒の銘柄を更新
      const updatedUser2 = await updateAlcoholBrands(selectedBrands.map(id => parseInt(id)));
      
      // 飲み方・カクテルを更新
      const updatedUser3 = await updateDrinkStyles(selectedDrinkStyles.map(id => parseInt(id)));
      
      onUpdate(updatedUser3);
      showProfileUpdateToast();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'お酒の好みの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 元の状態に戻す
    setSelectedCategories(user.alcohol_categories?.map(cat => String(cat.id)) || []);
    setSelectedBrands(user.alcohol_brands?.map(brand => String(brand.id)) || []);
    setSelectedDrinkStyles(user.drink_styles?.map(style => String(style.id)) || []);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="お酒の好みを編集">
      <div className={styles.modalHeader}>
        <div className={styles.visibilitySection}>
          <div className={styles.visibilityLabel}>興味の公開設定</div>
          <SwitchVisibility
            isSelected={isPublic}
            onValueChange={setIsPublic}
          />
        </div>
      </div>
      <div className={styles.modalContent}>
        {/* NextUI Tabsコンポーネント */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          classNames={{
            tabList: styles.tabList,
            cursor: styles.tabCursor,
            tab: styles.tab,
            tabContent: styles.tabContent,
            panel: styles.tabPanel
          }}
        >
          <Tab key="categories" title="お酒のジャンル">
            <div className={styles.categorySection}>
              <p className={styles.sectionDescription}>
                好きなお酒のジャンルを選択してください（複数選択可）
              </p>
              <CustomCheckboxGroup
                name="alcohol_categories"
                values={selectedCategories}
                onChange={setSelectedCategories}
                options={profileOptions.alcohol_categories.map(category => ({
                  label: category.name,
                  value: String(category.id)
                }))}
              />
            </div>
          </Tab>

          <Tab key="brands" title="銘柄">
            <div className={styles.brandSection}>
              <p className={styles.sectionDescription}>
                好きな銘柄を選択してください（複数選択可）
              </p>
              {selectedCategories.length === 0 ? (
                <div className={styles.noSelectionMessage}>
                  まずお酒のジャンルを選択してください
                </div>
              ) : (
                <CustomCheckboxGroup
                  name="alcohol_brands"
                  values={selectedBrands}
                  onChange={setSelectedBrands}
                  options={getFilteredBrands().map(brand => ({
                    label: brand.name,
                    value: String(brand.id)
                  }))}
                />
              )}
            </div>
          </Tab>

          <Tab key="styles" title="飲み方・カクテル">
            <div className={styles.styleSection}>
              <p className={styles.sectionDescription}>
                好きな飲み方やカクテルを選択してください（複数選択可）
              </p>
              {selectedCategories.length === 0 ? (
                <div className={styles.noSelectionMessage}>
                  まずお酒のジャンルを選択してください
                </div>
              ) : (
                <CustomCheckboxGroup
                  name="drink_styles"
                  values={selectedDrinkStyles}
                  onChange={setSelectedDrinkStyles}
                  options={getFilteredDrinkStyles().map(style => ({
                    label: style.name,
                    value: String(style.id)
                  }))}
                />
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      <ModalButtons
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
        saveText="保存"
        cancelText="キャンセル"
      />
    </Modal>
  );
};

export default AlcoholEditModal;
