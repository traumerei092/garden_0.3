'use client';

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@nextui-org/react";
import { PictureUpload } from "@/components/UI/PictureUpload";
import styles from "./style.module.scss";

interface ShopImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (file: File, caption: string, isIcon?: boolean) => void;
    shopId?: string;
}

export const ShopImageModal = ({ isOpen, onClose, onSubmit, shopId }: ShopImageModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isIconSelected, setIsIconSelected] = useState(false);

    const handleSubmit = async () => {
        if (!file) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            // 親コンポーネントからonSubmitが渡されている場合はそれを使用
            if (onSubmit) {
                onSubmit(file, caption, isIconSelected);
                setFile(null);
                setCaption("");
                setIsIconSelected(false);
                onClose();
                return;
            }
            
            // onSubmitが渡されていない場合は直接APIを呼び出す
            if (!shopId) {
                throw new Error('店舗IDが指定されていません');
            }
            
            const accessToken = localStorage.getItem('access');
            if (!accessToken) {
                throw new Error('認証が必要です');
            }
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('caption', caption);
            formData.append('shop', shopId);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-images/`, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${accessToken}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || '画像のアップロードに失敗しました');
            }
            
            // 成功したらモーダルを閉じる
            setFile(null);
            setCaption("");
            setIsIconSelected(false);
            onClose();
            
            // 必要に応じて画面をリロード
            window.location.reload();
        } catch (err) {
            console.error('画像アップロード中にエラーが発生しました:', err);
            setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setCaption("");
        setIsIconSelected(false);
        onClose();
    };

    return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" className={styles.modal}>
        <ModalContent className={styles.modalContent}>
            {(onClose) => (
                <>
                    <ModalHeader>店舗画像の追加</ModalHeader>
                    <ModalBody>
                        {error && (
                            <div className={styles.errorText}>
                                {error}
                            </div>
                        )}
                        <PictureUpload
                            file={file}
                            caption={caption}
                            index={0}
                            onFileChange={(_, newFile) => setFile(newFile)}
                            onCaptionChange={(_, newCaption) => setCaption(newCaption)}
                            hideIconSelect={false}
                            isRequired={false}
                            isSelected={isIconSelected}
                            onIconSelect={() => setIsIconSelected(!isIconSelected)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            キャンセル
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleSubmit} 
                            isDisabled={!file || isLoading}
                            isLoading={isLoading}
                        >
                            {isLoading ? "アップロード中..." : "追加"}
                        </Button>
                    </ModalFooter>
                </>
            )}
        </ModalContent>
    </Modal>
    );
};
