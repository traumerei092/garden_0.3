'use client'

import React, {useState} from 'react';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Image,
    Divider,
    DropdownSection
} from "@nextui-org/react";
import Logo from "@/components/UI/Logo";
import LinkDefault from "@/components/UI/LinkDefault";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import styles from './style.module.scss';
import {useRouter} from "next/navigation";
import { useAuthStore } from '@/store/useAuthStore';
import LogoutModal from "@/components/Auth/LogoutModal";

const Header = () => {

    const router = useRouter();
    const handleLoginClick = () => {
            router.push(`/login`); // ショップ詳細ページへ遷移
    };
    const handleSignupClick = () => {
            router.push(`/signup`); // ショップ詳細ページへ遷移
    };

    const { user } = useAuthStore();

    const [showModal, setShowModal] = useState(false); // モーダル開閉用の状態

    return (
        <Navbar
            shouldHideOnScroll
            className={styles.headerAll}
            classNames={{
                    wrapper: styles.headerWrapper,
            }}
        >
            <NavbarBrand className={styles.headerLeft}>
                <Logo width={140} height={70} />
            </NavbarBrand>
            <NavbarContent justify="center" className={styles.headerCenter}>
                {user ? (
                    <>
                        <NavbarItem className={styles.navbarItem}>
                            <LinkDefault href={"/favorite"} styleName={"link"}>行きつけのお店</LinkDefault>
                        </NavbarItem>
                        <NavbarItem className={styles.navbarItem}>
                            <LinkDefault href={"/visited"} styleName={"link"}>行ったお店</LinkDefault>
                        </NavbarItem>
                        <NavbarItem className={styles.navbarItem}>
                            <LinkDefault href={"/wishlist"} styleName={"link"}>気になるお店</LinkDefault>
                        </NavbarItem>
                        <NavbarItem className={styles.navbarItem}>
                            <LinkDefault href={"/profile"} styleName={"link"}>プロフィール</LinkDefault>
                        </NavbarItem>
                        <NavbarItem className={styles.navbarItem}>
                            <LinkDefault href={"/"} styleName={"link"}>Browsing</LinkDefault>
                        </NavbarItem>
                    </>
                ) : (
                    <>
                        <NavbarItem>
                            <LinkDefault href={"/"} styleName={"link"}>About GARDEN</LinkDefault>
                        </NavbarItem>
                        <NavbarItem>
                            <LinkDefault href={"/"} styleName={"link"}>Topics</LinkDefault>
                        </NavbarItem>
                        <NavbarItem>
                            <LinkDefault href={"/"} styleName={"link"}>New Shop</LinkDefault>
                        </NavbarItem>
                    </>
                )}

            </NavbarContent>
            <NavbarContent justify="end" className={styles.headerRight}>
                {user ? (
                    <>
                        <Dropdown placement="bottom-end" className={styles.dropdownMenu}>
                            <DropdownTrigger className={styles.userAvatar}>
                                {user.avatar ? (
                                    <Image src={user.avatar} alt="avatar" className={styles.avatarImage} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownSection showDivider aria-label="Profile" className={styles.divider}>
                                    <DropdownItem key="profile" className={styles.dropdownItem} onPress={() => router.push('/profile')}>Profile</DropdownItem>
                                    <DropdownItem key="setting" className={styles.dropdownItem}>Setting</DropdownItem>
                                </DropdownSection>
                                <DropdownItem key="logout" className="text-danger" color="danger" onPress={() => setShowModal(true)}>
                                    LOG OUT
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>

                        {showModal && (
                            <LogoutModal isOpen={showModal} onClose={() => setShowModal(false)} />
                        )}
                    </>
                ) : (
                    <>
                        <ButtonGradientWrapper
                            anotherStyle={""}
                            onClick={handleLoginClick}
                        >
                            LOG IN
                        </ButtonGradientWrapper>
                        <ButtonGradient
                            anotherStyle={""}
                            onClick={handleSignupClick}
                        >
                            JOIN NOW
                        </ButtonGradient>
                    </>
                )}
            </NavbarContent>
        </Navbar>
    );
};

export default Header;
