'use client'

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@nextui-org/react';
import { X } from 'lucide-react';
import styles from './style.module.scss';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  scrollBehavior?: 'inside' | 'outside';
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'xl',
  scrollBehavior = 'inside'
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      classNames={{
        base: styles.modalBase,
        backdrop: styles.modalBackdrop,
        header: styles.modalHeader,
        body: styles.modalBody,
        footer: styles.modalFooter,
      }}
    >
      <ModalContent>
        <ModalHeader className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </ModalHeader>
        
        <ModalBody className={styles.body}>
          {children}
        </ModalBody>
        
        {footer && (
          <ModalFooter className={styles.footer}>
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CustomModal;
