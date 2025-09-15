'use client';

import styles from './style.module.scss';
import {Button, Tooltip, Badge} from "@nextui-org/react";
import StyledAutocomplete, { AutocompleteOption } from '@/components/UI/StyledAutocomplete';
import { HousePlus, AlignJustify, LayoutGrid, MapPinned, Funnel } from 'lucide-react';
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import CustomTabs from "@/components/UI/CustomTabs";
import {useRouter} from "next/navigation";
import {useAuthStore} from "@/store/useAuthStore";

interface ShopListHeaderProps {
    selectedTab?: string;
    onTabChange?: (tab: string) => void;
    shopCount?: number;
    filterCount?: number;
    onSearch?: () => void;
}

const ShopListHeader: React.FC<ShopListHeaderProps> = ({ selectedTab, onTabChange, shopCount = 0, filterCount = 0, onSearch }) => {

    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    
    // Autocompleteのオプション定義
    const sortOptions: AutocompleteOption[] = [
        { key: "match", label: "マッチ率が高い順" },
        { key: "gone", label: "「行った」が多い順" },
        { key: "interested", label: "「気になる」が多い順" },
        { key: "review", label: "口コミが多い順" },
        { key: "tag", label: "タグが多い順" }
    ];
    const targetUrl = user ? '/shops/create' : '/login';
    const handleCreateShop = () => {
            router.push(targetUrl); // ショップ詳細ページへ遷移
    };

    const tabItems = [
        {
            key: "list",
            title: <AlignJustify size={16} strokeWidth={1} />
        },
        {
            key: "grid", 
            title: <LayoutGrid size={16} strokeWidth={1} />
        },
        {
            key: "map",
            title: <MapPinned size={16} strokeWidth={1} />
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.headerLeft}>
                <Badge color="danger" content={filterCount || undefined} shape="circle" className={styles.pcBadge}>
                    <Button 
                        className={styles.pcSortButton} 
                        variant="flat" 
                        color="primary" 
                        radius="sm" 
                        size="sm"
                        onPress={onSearch}
                    >
                        <Funnel size={16} strokeWidth={1} />
                    </Button>
                </Badge>
                {shopCount.toLocaleString()} 件
            </div>
            <div className={styles.headerCenter}>
                <CustomTabs
                    items={tabItems}
                    variant="solid"
                    size="md"
                    className={styles.tabs}
                    selectedKey={selectedTab}
                    onSelectionChange={onTabChange}
                />
                <div className={styles.mobileAutocomplete}>
                    <StyledAutocomplete
                        options={sortOptions}
                        defaultSelectedKey="match"
                        placeholder="マッチ率が高い順"
                        aria-label="並び順を選択"
                        size="sm"
                        radius="sm"
                        onSelectionChange={(key) => {
                            // 並び順変更のロジックをここに追加
                            console.log('Selected sort option:', key);
                        }}
                    />
                </div>
            </div>
            <div className={styles.headerRight}>
                <StyledAutocomplete
                    options={sortOptions}
                    defaultSelectedKey="match"
                    placeholder="マッチ率が高い順"
                    aria-label="並び順を選択"
                    size="sm"
                    radius="sm"
                    className={styles.desktopAutocomplete}
                    onSelectionChange={(key) => {
                        // 並び順変更のロジックをここに追加
                        console.log('Selected sort option:', key);
                    }}
                />
                <Tooltip
                    content="GARDENにまだないお店を登録しましょう！"
                    placement='top'
                    showArrow={true}
                    delay={0}
                    closeDelay={0}
                    className={styles.tooltip}
                >
                    <ButtonGradientWrapper
                        anotherStyle={styles.createShop}
                        onClick={handleCreateShop}
                    >
                        <HousePlus size={18} color="#ffffff" strokeWidth={1} />
                    </ButtonGradientWrapper>
                </Tooltip>
                <Badge color="danger" content={filterCount || undefined} shape="circle" className={styles.badge}>
                    <Button 
                        className={styles.sortButton} 
                        variant="flat" 
                        color="primary" 
                        radius="sm" 
                        size="sm"
                        onPress={onSearch}
                    >
                        <Funnel size={16} strokeWidth={1} />
                    </Button>
                </Badge>
            </div>
        </div>
    );
};

export default ShopListHeader;
