'use client';

import styles from './style.module.scss';
import {Autocomplete, AutocompleteItem, Tooltip} from "@nextui-org/react";
import { HousePlus, AlignJustify, LayoutGrid, MapPinned } from 'lucide-react';
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import CustomTabs from "@/components/UI/CustomTabs";
import {useRouter} from "next/navigation";
import {useAuthStore} from "@/store/useAuthStore";

const ShopListHeader = () => {

    const router = useRouter();
    const user = useAuthStore((state) => state.user);
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
                123,456 件
            </div>
            <div className={styles.headerCenter}>
                <CustomTabs
                    items={tabItems}
                    variant="solid"
                    size="md"
                    className={styles.tabs}
                />
            </div>
            <div className={styles.headerRight}>
                <Autocomplete
                    size="sm"
                    radius="sm"
                    className={styles.autocomplete}
                    classNames={{
                        base: styles.autocompleteInputWrapper,
                        popoverContent: styles.autocompletePopoverContent,
                        listboxWrapper: styles.autocompleteListboxWrapper,
                    }}
                    defaultSelectedKey="match"
                >
                    <AutocompleteItem key={"match"} className={styles.autocompleteItem}>マッチ率が高い順</AutocompleteItem>
                    <AutocompleteItem key={"gone"} className={styles.autocompleteItem}>「行った」が多い順</AutocompleteItem>
                    <AutocompleteItem key={"interested"} className={styles.autocompleteItem}>「気になる」が多い順</AutocompleteItem>
                    <AutocompleteItem key={"review"} className={styles.autocompleteItem}>口コミが多い順</AutocompleteItem>
                    <AutocompleteItem key={"tag"} className={styles.autocompleteItem}>タグが多い順</AutocompleteItem>
                </Autocomplete>
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
            </div>
        </div>
    );
};

export default ShopListHeader;
