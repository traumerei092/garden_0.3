'use client';

import React, { useRef, useState } from "react";
import { ImagePlus, Upload, X, Star, Camera } from "lucide-react";
import {Button, Input} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
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
    isSelected?: boolean;
    onIconSelect?: () => void;
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
        isSelected = false,
        onIconSelect,
        ...radioProps
    } = props;

    const [isDragOver, setIsDragOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;
        e.target.value = "";
        onFileChange(index, selectedFile);
    };

    const handleRemove = () => {
        onFileChange(index, null);
        onCaptionChange(index, "");
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            onFileChange(index, droppedFile);
        }
    };

    return (
        <motion.div 
            className={styles.pictureUploadEntire}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`${styles.pictureUploadBlock} ${file && isSelected ? styles.selected : ""} ${isDragOver ? styles.dragOver : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className={styles.pictureUploadContainer}>
                    <div className={styles.imagePreview}>
                        <AnimatePresence mode="wait">
                            {file instanceof File ? (
                                <motion.div
                                    key="image"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                    className={styles.imageContainer}
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`image-${index}`}
                                        className={styles.image}
                                    />
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={styles.imageOverlay}
                                        >
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handleRemove}
                                                className={styles.removeButton}
                                            >
                                                <X size={16} />
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                    className={styles.placeholder}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <motion.div
                                        animate={{ 
                                            scale: isDragOver ? 1.1 : 1,
                                            rotateY: isDragOver ? 360 : 0
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={styles.placeholderIcon}
                                    >
                                        {isDragOver ? <Upload size={32} /> : <ImagePlus size={32} />}
                                    </motion.div>
                                    <p className={styles.placeholderText}>
                                        {isDragOver ? "ドロップして追加" : "クリックまたはドラッグ"}
                                    </p>
                                    <p className={styles.placeholderSubtext}>PNG, JPG, GIF</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {file && (
                        <div className={styles.controls}>
                            <Input
                                value={caption}
                                onChange={(e) => onCaptionChange(index, e.target.value)}
                                placeholder="画像の説明（任意）"
                                size="sm"
                                classNames={{
                                    inputWrapper: styles.formInput,
                                    input: styles.formInputElement,
                                    label: styles.formLabel,
                                }}
                            />
                            
                            {!hideIconSelect && (
                                <div className={styles.iconRadioWrapper}>
                                    <label 
                                        className={`${styles.iconRadioLabel} ${isSelected ? styles.selected : ""}`}
                                        onClick={onIconSelect}
                                    >
                                        <input
                                            type="radio"
                                            name="shopIcon"
                                            checked={isSelected}
                                            onChange={onIconSelect}
                                            className={styles.radio}
                                        />
                                        <Star className={styles.starIcon} size={14} />
                                        <span>アイコンに設定</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
        </motion.div>
    );
};