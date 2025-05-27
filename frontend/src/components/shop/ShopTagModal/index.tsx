'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Chip } from '@nextui-org/react';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';

type ShopTagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  onTagAdded: () => void;
  existingTags: Array<{ id: number; value: string }>;
};

const ShopTagModal: React.FC<ShopTagModalProps> = ({
  isOpen,
  onClose,
  shopId,
  onTagAdded,
  existingTags
}) => {
  const [tagValue, setTagValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; value: string }>>([]);
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  // タグ入力時に既存タグから候補を表示
  useEffect(() => {
    if (tagValue.trim().length > 0) {
      const matchingTags = existingTags.filter(tag => 
        tag.value.toLowerCase().includes(tagValue.toLowerCase())
      );
      setSuggestions(matchingTags);
    } else {
      setSuggestions([]);
    }
  }, [tagValue, existingTags]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setError('ログインが必要です');
      return;
    }

    if (!tagValue.trim()) {
      setError('タグを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-tags/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${localStorage.getItem('access')}`
        },
        body: JSON.stringify({
          shop: shopId,
          value: tagValue.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTagValue('');
        await onTagAdded(); // awaitを追加
        onClose();
      } else {
        throw new Error(data.detail || 'タグの追加に失敗しました');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (value: string) => {
    setTagValue(value);
  };

  const handleLoginPrompt = () => {
    // ログインモーダルを表示する処理（実際の実装に合わせて調整）
    onClose();
    // ここでログインモーダルを表示するロジックを追加
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent className={styles.modalContent}>
        {(onClose) => (
          <>
            <ModalHeader className={styles.modalHeader}>印象タグを追加</ModalHeader>
            <ModalBody>
              {!isLoggedIn ? (
                <div className={styles.loginPrompt}>
                  <p>タグを追加するにはログインが必要です</p>
                  <Button color="primary" onClick={handleLoginPrompt}>
                    ログイン / 新規登録
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    label="このお店の印象を一言で"
                    placeholder="例: マスターが優しい、雰囲気が落ち着く"
                    value={tagValue}
                    onChange={(e) => setTagValue(e.target.value)}
                    className={styles.tagInput}
                    classNames={{
                        inputWrapper: styles.tagInputWrapper,
                        input: styles.tagInputElement,
                    }}
                  />
                  
                  {suggestions.length > 0 && (
                    <div className={styles.suggestions}>
                      <p className={styles.suggestionsTitle}>似たタグ:</p>
                      <div className={styles.suggestionChips}>
                        {suggestions.map(tag => (
                          <Chip
                            key={tag.id}
                            onClick={() => handleSuggestionClick(tag.value)}
                            className={styles.suggestionChip}
                            variant="flat"
                            color="primary"
                          >
                            {tag.value}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {error && <p className={styles.errorText}>{error}</p>}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                キャンセル
              </Button>
              {isLoggedIn && (
                <Button 
                  color="primary" 
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!tagValue.trim()}
                >
                  追加する
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ShopTagModal;
