'use client'

import React, { useState, useEffect } from 'react';
import { Input, Textarea } from '@nextui-org/react';
import { Edit, Check, X } from 'lucide-react';
import styles from './style.module.scss';
import LoadingSpinner from '../LoadingSpinner';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  validation?: (value: string) => string | null;
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  placeholder = '',
  maxLength,
  multiline = false,
  validation,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setError('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    
    return (
      <div className={`${styles.editableField} ${className || ''}`}>
        <div className={styles.editingContainer}>
          <InputComponent
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            variant="bordered"
            radius="sm"
            autoFocus
            isInvalid={!!error}
            errorMessage={error}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            {...(multiline && { minRows: 2, maxRows: 4 })}
          />
          <div className={styles.editActions}>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isLoading}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.editableField} ${className || ''}`}>
      <div className={styles.displayContainer}>
        <span className={styles.displayValue}>
          {value || placeholder}
        </span>
        <button
          onClick={handleEdit}
          className={styles.editButton}
        >
          <Edit size={16} />
        </button>
      </div>
    </div>
  );
};

export default EditableField;
