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
import { MapPin } from 'lucide-react';
import { ShopImage, ShopTag } from '@/types/shops';

type Props = {
    name: string;
    images: ShopImage[] | null;
    shop_types: string[];
    shop_layouts: string[];
    shop_options: string[];
    prefecture: string | null;
    city: string | null;
    onPress: () => void;
    shopDetail: string;
    distance: string | null;
    tags: ShopTag[];
};

const ShopCard = ({ name, images, shop_types, shop_layouts, shop_options, prefecture, city, onPress, shopDetail, distance, tags }: Props) => {

    const renderChips = (items: string[], category: 'type' | 'layout' | 'option') => {
        return items.map((item, index) => (
            <ChipCondition key={`${category}-${index}`} category={category}>
                {item}
            </ChipCondition>
        ));
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

    return (
        <Card className={styles.card} shadow="sm" radius="md">
            <CardBody className={styles.body}>
                <div className={styles.shopImageWrapper}>
                    <Button
                        className={styles.shopImageButton}
                        onPress={onPress}
                        disableRipple
                        disableAnimation
                        variant="flat"
                    >
                        <Image
                            alt={name}
                            src={displayImage ?? '/default.png'}
                            className={styles.image}
                            isZoomed
                            isBlurred
                        />
                    </Button>
                </div>
                <div className={styles.shopElement}>
                    <Link className={styles.title} href={shopDetail}>{name}</Link>
                    <div className={styles.shopLocation}>
                        {distance && (
                            <span className={styles.distance}>
                                <MapPin size={16} strokeWidth={1} />
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
                    <div className={styles.shopCondition}>
                        <ScrollShadow className={styles.chipWrapper}>
                            {renderChips(shop_types, 'type')}
                            {renderChips(shop_layouts, 'layout')}
                            {renderChips(shop_options, 'option')}
                        </ScrollShadow>
                    </div>
                    <div className={styles.shopCondition}>
                        <ScrollShadow className={styles.chipWrapper}>
                            {tags && Array.isArray(tags) && tags.length > 0 ? (
                                tags.map((tag) => (
                                    <ShopImpressionTag
                                        key={tag.id}
                                        id={tag.id}
                                        label={tag.value}
                                        count={tag.reaction_count}
                                        isCreator={tag.is_creator}
                                        userHasReacted={tag.user_has_reacted}
                                        disabled={true}
                                    />
                                ))
                            ) : null}
                        </ScrollShadow>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default ShopCard;
