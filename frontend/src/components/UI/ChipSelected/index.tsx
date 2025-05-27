'use client';

import styles from './style.module.scss';
import {Chip} from "@nextui-org/chip";

type Props = {
    children: string;
};

const ChipSelected = ({ children }: Props) => {

    return (
        <Chip
            className={styles.selected}
            radius={"sm"}
        >
            {children}
        </Chip>
    );
};

export default ChipSelected;