'use client';

import styles from './style.module.scss';
import {Button, Tooltip, Badge} from "@nextui-org/react";
import StyledAutocomplete, { AutocompleteOption } from '@/components/UI/StyledAutocomplete';
import { HousePlus, AlignJustify, LayoutGrid, MapPinned, Funnel } from 'lucide-react';
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import CustomTabs from "@/components/UI/CustomTabs";
import {useRouter} from "next/navigation";
import { useAuthSession } from '@/hooks/useAuthSession';
import { getSortOptions, getDefaultSortKey } from '@/actions/shop/sort';

interface ShopListHeaderProps {
    selectedTab?: string;
    onTabChange?: (tab: string) => void;
    shopCount?: number;
    filterCount?: number;
    onSearch?: () => void;
    onSortChange?: (sortKey: string) => void;
}

const ShopListHeader: React.FC<ShopListHeaderProps> = ({ selectedTab, onTabChange, shopCount = 0, filterCount = 0, onSearch, onSortChange }) => {

    const router = useRouter();
    const { user } = useAuthSession();

    // 動的ソートオプション取得
    const sortOptions: AutocompleteOption[] = getSortOptions().map(option => ({
        key: option.key,
        label: option.label,
        value: option.key
    }));
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
                        defaultSelectedKey={getDefaultSortKey()}
                        placeholder={sortOptions.find(opt => opt.key === getDefaultSortKey())?.label || 'ソート順を選択'}
                        aria-label="並び順を選択"
                        size="sm"
                        radius="sm"
                        onSelectionChange={(key) => {
                            if (key && onSortChange) {
                                onSortChange(key);
                            }
                        }}
                    />
                </div>
            </div>
            <div className={styles.headerRight}>
                <StyledAutocomplete
                    options={sortOptions}
                    defaultSelectedKey={getDefaultSortKey()}
                    placeholder={sortOptions.find(opt => opt.key === getDefaultSortKey())?.label || 'ソート順を選択'}
                    aria-label="並び順を選択"
                    size="sm"
                    radius="sm"
                    className={styles.desktopAutocomplete}
                    onSelectionChange={(key) => {
                        if (key && onSortChange) {
                            onSortChange(key);
                        }
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
