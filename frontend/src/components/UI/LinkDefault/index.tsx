'use client';

import {Link} from '@nextui-org/react';
import styles from './style.module.scss';

type Props = {
  children: React.ReactNode;
  href: string;
  styleName: string;
};

const LinkDefault = ({ children, href, styleName }: Props) => {
  return (
    <Link href={href} className={`${styles.link} ${styleName}`}>
        {children}
    </Link>
  );
};

export default LinkDefault;