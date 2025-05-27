'use client';

import Image from 'next/image';
import styles from './style.module.scss';
import gardenLogo from "../../../../public/assets/logo/garden_logo.png";
import {Link} from "@nextui-org/react";

type Props = {
  width: number;
  height: number;
};

const Logo = ({ width, height }: Props) => {
    return (
        <div className={styles.logo}>
            <Link href="/" className={styles.logo}>
                <Image src={gardenLogo} alt="Garden Logo" width={width} height={height} />
            </Link>
        </div>
    );
};

export default Logo;
