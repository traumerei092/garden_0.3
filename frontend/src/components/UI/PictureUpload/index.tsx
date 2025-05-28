'use client';

import React, { useRef } from "react";
import { ImagePlus } from "lucide-react";
import {Button, useRadio, VisuallyHidden, RadioProps, Input} from "@nextui-org/react";
import styles from "./style.module.scss";

interface PictureUploadProps {
    file: File | null;
    caption: string;
    index: number;
    onFileChange: (index: number, file: File | null) => void;
    onCaptionChange: (index: number, caption: string) => void;
    hideIconSelect?: boolean;
    value?: string;
    name?: string;
    isRequired?: boolean;
}

export const PictureUpload = (props: PictureUploadProps) => {
    const {
        file,
        caption,
        index,
        onFileChange,
        onCaptionChange,
        hideIconSelect = false,
        isRequired = false,
        ...radioProps
    } = props;

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // hideIconSelectがtrueの場合はuseRadioを使用しない
    const radioHook = !hideIconSelect ? useRadio({ ...radioProps as RadioProps }) : null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;
        e.target.value = "";
        onFileChange(index, selectedFile);
    };

    const handleRemove = () => {
        onFileChange(index, null);
        onCaptionChange(index, "");
    };

    return (
        <div className={styles.pictureUploadEntire}>
            {!hideIconSelect && radioHook ? (
                <radioHook.Component
                    {...radioHook.getBaseProps()}
                    className={`${styles.pictureUploadBlock} ${file && radioHook.isSelected ? styles.selected : ""}`}
                >
                    <VisuallyHidden>
                        <input {...radioHook.getInputProps()} disabled={!file} />
                    </VisuallyHidden>

                    <div {...radioHook.getWrapperProps()} className={styles.pictureUploadContainer}>
                        <div className={styles.imagePreview}>
                            {file instanceof File ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`image-${index}`}
                                    className={styles.image}
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <ImagePlus size={36}/>
                                </div>
                            )}
                        </div>

                        <div className={styles.controls}>
                            {file instanceof File ? (
                                <Input
                                    label="キャプション"
                                    placeholder="例：外観"
                                    size="sm"
                                    value={caption}
                                    onChange={(e) => onCaptionChange(index, e.target.value)}
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            ) : (
                                <Input
                                    label="キャプション"
                                    placeholder="ファイルを選択してください"
                                    size="sm"
                                    isDisabled
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                style={{display: "none"}}
                            />
                        </div>

                        <div className={styles.iconRadioWrapper}>
                            <input
                                type={"radio"}
                                {...radioHook.getInputProps()}
                                disabled={!file}
                                className={styles.radio}/>
                            <label>アイコン画像に設定</label>
                        </div>
                    </div>
                </radioHook.Component>
            ) : (
                <div className={styles.pictureUploadBlock}>
                    <div className={styles.pictureUploadContainer}>
                        <div className={styles.imagePreview}>
                            {file instanceof File ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`image-${index}`}
                                    className={styles.image}
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <ImagePlus size={36}/>
                                </div>
                            )}
                        </div>

                        <div className={styles.controls}>
                            {file instanceof File ? (
                                <Input
                                    label="キャプション"
                                    placeholder="例：外観"
                                    size="sm"
                                    value={caption}
                                    onChange={(e) => onCaptionChange(index, e.target.value)}
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            ) : (
                                <Input
                                    label="キャプション"
                                    placeholder="ファイルを選択してください"
                                    size="sm"
                                    isDisabled
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                style={{display: "none"}}
                            />
                        </div>
                    </div>
                </div>
            )}
            <div className={styles.uploadButtonWrapper}>
                {file instanceof File ? (
                    <Button
                        color="danger"
                        radius="sm"
                        size="sm"
                        variant="flat"
                        onPress={handleRemove}
                        className={styles.uploadButton}
                    >
                        削除
                    </Button>
                ) : (
                    <Button
                        color="primary"
                        radius="sm"
                        size="sm"
                        variant="solid"
                        onPress={() => fileInputRef.current?.click()}
                        className={styles.uploadButton}
                    >
                        ファイルを選択
                    </Button>
                )}
            </div>
        </div>
    );
}
