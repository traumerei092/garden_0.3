'use client';

import {
    Card,
    CardBody,
    Image,
    Button,
    ScrollShadow,
    Breadcrumbs,
    BreadcrumbItem,
    Link,
} from "@nextui-org/react";
import styles from './style.module.scss';
import ChipCondition from "@/components/UI/ChipCondition";
import ShopImpressionTag from "@/components/Shop/ShopImpressionTag";
import ShopMatchRate from "@/components/Shop/ShopMatchRate";
import ShopActionButton from "@/components/Shop/ShopActionButton";
import { MapPin } from 'lucide-react';
import { ShopImage, ShopTag, ShopStats, RelationType } from '@/types/shops';

type Props = {
    name: string;
    images: ShopImage[] | null;
    shop_types: { id: number; name: string; }[];
    shop_layouts: { id: number; name: string; }[];
    shop_options: { id: number; name: string; }[];
    prefecture: string | null;
    city: string | null;
    onPress: () => void;
    shopDetail: string;
    distance: string | null;
    tags: ShopTag[];
    matchRate?: number;
    shopStats?: ShopStats;
    onActionClick?: (actionType: string) => void;
    onRelationToggle?: (relationTypeId: number) => void;
};

const ShopCard = ({ 
    name, 
    images, 
    shop_types, 
    shop_layouts, 
    shop_options, 
    prefecture, 
    city, 
    onPress, 
    shopDetail, 
    distance, 
    tags,
    matchRate = 75,
    shopStats,
    onActionClick,
    onRelationToggle
}: Props) => {

    const renderChips = (items: { id: number; name: string; }[], category: 'type' | 'layout' | 'option') => {
        if (!items || items.length === 0) return null;
        return items.map((item) => {
            if (!item || !item.name) return null;
            return (
                <ChipCondition key={`${category}-${item.id}`} category={category}>
                    {item.name}
                </ChipCondition>
            );
        }).filter(Boolean);
    };

    // 表示する画像のURLを決定する
    let displayImage = '/assets/picture/no-image.jpg';
    
    if (images && Array.isArray(images) && images.length > 0) {
        const imageUrl = images.find(img => img.is_icon)?.image_url || images[0].image_url;
        displayImage = imageUrl.startsWith('http') 
            ? imageUrl 
            : `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    } else if (typeof images === 'string') {
        displayImage = images;
    }

    // 各リレーションタイプのデータを取得
    const favoriteRelation = shopStats?.counts.find(c => c.name === 'favorite');
    const visitedRelation = shopStats?.counts.find(c => c.name === 'visited');
    const interestedRelation = shopStats?.counts.find(c => c.name === 'interested');
    
    const favoriteCount = favoriteRelation?.count || 0;
    const visitedCount = visitedRelation?.count || 0;
    const interestedCount = interestedRelation?.count || 0;
    
    const isFavorite = shopStats?.user_relations.includes(favoriteRelation?.id || 0) || false;
    const isVisited = shopStats?.user_relations.includes(visitedRelation?.id || 0) || false;
    const isInterested = shopStats?.user_relations.includes(interestedRelation?.id || 0) || false;

    // RelationType用のデータを作成
    const favoriteType: RelationType = {
        id: favoriteRelation?.id || 3,
        name: 'favorite',
        label: '行きつけ',
        count: favoriteCount,
        color: '#00ffff'
    };

    const visitedType: RelationType = {
        id: visitedRelation?.id || 1,
        name: 'visited',
        label: '行った',
        count: visitedCount,
        color: '#ffc107'
    };

    const interestedType: RelationType = {
        id: interestedRelation?.id || 2,
        name: 'interested',
        label: '行きたい',
        count: interestedCount,
        color: '#ef4444'
    };

    return (
        <Card className={styles.card} shadow="lg" radius="lg">
            <CardBody className={styles.body}>
                <div className={styles.shopImageWrapper}>
                    <Button
                        className={styles.shopImageButton}
                        onPress={onPress}
                        disableRipple
                        disableAnimation
                        variant="flat"
                    >
                        <div className={styles.imageContainer}>
                            <Image
                                alt={name}
                                src={displayImage ?? '/default.png'}
                                className={styles.image}
                                removeWrapper
                            />
                            <div className={styles.imageOverlay} />
                        </div>
                    </Button>
                </div>
                
                <div className={styles.shopContent}>
                    <div className={styles.shopMainInfo}>
                        <div className={styles.shopHeader}>
                            <div className={styles.titleRow}>
                                <Link className={styles.title} href={shopDetail}>{name}</Link>
                                <div className={styles.actionButtons}>
                                    <ShopActionButton
                                        type={favoriteType}
                                        count={favoriteCount}
                                        isActive={isFavorite}
                                        onClick={() => onRelationToggle?.(favoriteType.id)}
                                    />
                                    <ShopActionButton
                                        type={visitedType}
                                        count={visitedCount}
                                        isActive={isVisited}
                                        onClick={() => onRelationToggle?.(visitedType.id)}
                                    />
                                    <ShopActionButton
                                        type={interestedType}
                                        count={interestedCount}
                                        isActive={isInterested}
                                        onClick={() => onRelationToggle?.(interestedType.id)}
                                    />
                                </div>
                            </div>
                            <div className={styles.shopLocation}>
                                {distance && (
                                    <span className={styles.distance}>
                                        <MapPin size={14} strokeWidth={1.5} />
                                        現在地から{distance}
                                    </span>
                                )}
                                <Breadcrumbs
                                    size="sm"
                                    variant="solid"
                                    className={styles.breadcrumbs}
                                    classNames={{
                                        list: styles.breadcrumbWrapper,
                                    }}
                                >
                                    <BreadcrumbItem style={{display: 'inline-flex'}}>{prefecture}</BreadcrumbItem>
                                    <BreadcrumbItem style={{display: 'inline-flex'}}>{city}</BreadcrumbItem>
                                </Breadcrumbs>
                            </div>
                        </div>

                        {/* タグ表示 */}
                        {tags && Array.isArray(tags) && tags.length > 0 && (
                            <div className={styles.shopCondition}>
                                <ScrollShadow className={styles.chipWrapper} orientation="horizontal">
                                    {tags.map((tag) => (
                                        <ShopImpressionTag
                                            key={tag.id}
                                            id={tag.id}
                                            label={tag.value}
                                            count={tag.reaction_count}
                                            isCreator={tag.is_creator}
                                            userHasReacted={tag.user_has_reacted}
                                            disabled={true}
                                        />
                                    ))}
                                </ScrollShadow>
                            </div>
                        )}

                        {/* チップ表示 */}
                        <div className={styles.shopCondition}>
                            <ScrollShadow className={styles.chipWrapper} orientation="horizontal">
                                {renderChips(shop_types, 'type')}
                                {renderChips(shop_options, 'option')}
                                {renderChips(shop_layouts, 'layout')}
                            </ScrollShadow>
                        </div>
                        
                    </div>
                    
                    {/* マッチ率表示 */}
                    <div className={styles.matchRateWrapper}>
                        <ShopMatchRate rate={matchRate} />
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default ShopCard;
