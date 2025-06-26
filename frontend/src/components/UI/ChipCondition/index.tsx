'use client';

import styles from './style.module.scss';
import {Chip} from "@nextui-org/chip";

type Props = {
  children: string;
  category: 'type' | 'layout' | 'option' ;
};

const ChipCondition = ({ children, category }: Props) => {

    const getColorClass = () => {
        switch (category) {
            case 'type':
                return styles.type;
            case 'layout':
                return styles.layout;
            case 'option':
                return styles.option;
            default:
                return styles.default;
        }
    };

    return (
        <Chip
            className={`${styles.wrapper} ${getColorClass()}`}
        >
            {children}
        </Chip>
    );
};

export default ChipCondition;