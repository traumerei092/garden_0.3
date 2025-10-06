'use client';

import styles from './style.module.scss';
import ButtonCircle from "@/components/UI/ButtonCircle";
import {ChevronsUpDown} from "lucide-react";
import {useState} from "react";
import ButtonCondition from "@/components/UI/ButtonCondition";
import InputDefault from "@/components/UI/InputDefault";
import {BreadcrumbItem, Breadcrumbs, ScrollShadow} from "@nextui-org/react";
import ChipCondition from "@/components/UI/ChipCondition";

const ShopConsole = () => {

    const [showConsole, setShowConsole] = useState(true);

    const setIsConsoleOpen = () => {
        setShowConsole(!showConsole);
    };

    console.log('console is:', showConsole);

    return (
        <div className={styles.consoleWrapper}>
            <div className={styles.updown}>
                <ButtonCircle action={setIsConsoleOpen}>
                    <ChevronsUpDown name={"consoleDoor"} size={20}/>
                </ButtonCircle>
            </div>
            <div className={`${styles.console} ${showConsole ? styles["console-show"] : styles["console-hidden"]}`}>
                <div className={styles.consoleContainer}>
                    <div className={styles.consoleCondition}>
                        <ButtonCondition action={setIsConsoleOpen}>
                            一人飲み条件
                        </ButtonCondition>
                        <ButtonCondition action={setIsConsoleOpen}>
                            こだわり条件
                        </ButtonCondition>
                        <ButtonCondition action={setIsConsoleOpen}>
                            エリア変更
                        </ButtonCondition>
                        <InputDefault
                            label="keyword"
                            type="text"
                            onChange={setIsConsoleOpen}
                        />
                    </div>
                    <div className={styles.consoleResult}>
                        <p>123,456 件</p>
                        <div className={styles.shopCondition}>
                            <ScrollShadow className={styles.chipWrapper}>
                                <ChipCondition category="drink">
                                    一人で飲める
                                </ChipCondition>
                            </ScrollShadow>
                        </div>
                        <div className={styles.shopArea}>
                            <Breadcrumbs radius="sm" variant="solid" className={styles.breadcrumbs}>
                                <BreadcrumbItem style={{display: 'inline-flex'}}>福岡県</BreadcrumbItem>
                                <BreadcrumbItem style={{display: 'inline-flex'}}>福岡市</BreadcrumbItem>
                                <BreadcrumbItem style={{display: 'inline-flex'}}>天神・大名</BreadcrumbItem>
                            </Breadcrumbs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopConsole;