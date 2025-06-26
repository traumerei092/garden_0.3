'use client';

import styles from './style.module.scss';
import {Chip} from "@nextui-org/chip";

type Props = {
    children: string;
    styleName?: string;
};

const ChipSelected = ({ children, styleName }: Props) => {

    return (
        <Chip
            className={`${styles.selected} ${styleName}`}
            radius={"sm"}
        >
            {children}
        </Chip>
    );
};

export default ChipSelected;