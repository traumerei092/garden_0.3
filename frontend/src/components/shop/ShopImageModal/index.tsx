'use client';

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { PictureUpload } from "@/components/UI/PictureUpload";
import styles from "./style.module.scss";

interface ShopImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File, caption: string) => void;
}

export const ShopImageModal = ({ isOpen, onClose, onSubmit }: ShopImageModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  const handleSubmit = () => {
      if (file) {
          onSubmit(file, caption);
          setFile(null);
          setCaption("");
          onClose();
      }
  };

  const handleClose = () => {
      setFile(null);
      setCaption("");
      onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
          {(onClose) => (
              <>
                  <ModalHeader>店舗画像の追加</ModalHeader>
                  <ModalBody>
                      <PictureUpload
                          file={file}
                          caption={caption}
                          index={0}
                          onFileChange={(_, newFile) => setFile(newFile)}
                          onCaptionChange={(_, newCaption) => setCaption(newCaption)}
                          hideIconSelect={true}
                          value=""
                          name=""
                      />
                  </ModalBody>
                  <ModalFooter>
                      <Button color="danger" variant="light" onPress={onClose}>
                          キャンセル
                      </Button>
                      <Button color="primary" onPress={handleSubmit} isDisabled={!file}>
                          追加
                      </Button>
                  </ModalFooter>
              </>
          )}
      </ModalContent>
    </Modal>
  );
};