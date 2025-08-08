'use client'

import React, { useState, useEffect } from 'react';
import { Select, SelectItem } from '@nextui-org/react';
import { Edit, Check, X } from 'lucide-react';
import styles from './style.module.scss';
import LoadingSpinner from '../LoadingSpinner';
import SwitchVisibility from '../SwitchVisibility';

interface Option {
  id: number;
  name: string;
}

interface EditableSelectProps {
  value: string | null;
  options: Option[];
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  visibilityControl?: {
    isVisible: boolean;
    onVisibilityChange: (visible: boolean) => void;
    label?: string;
  };
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  options,
  onSave,
  placeholder = '選択してください',
  className,
  visibilityControl,
  onEditStart,
  onEditEnd
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value ? String(value) : '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditValue(value ? String(value) : '');
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value ? String(value) : '');
    onEditStart?.();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value ? String(value) : '');
    onEditEnd?.();
  };

  const handleSave = async () => {
    if (!editValue) return;

    setIsLoading(true);

    try {
      await onSave(editValue);
      setIsEditing(false);
      onEditEnd?.();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    const option = options.find(opt => String(opt.id) === String(value));
    return option ? option.name : placeholder;
  };

  if (isEditing) {
    return (
      <div className={`${styles.editableSelect} ${className || ''}`}>
        <div className={styles.editingContainer}>
          <Select
            selectedKeys={editValue ? [editValue] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0];
              setEditValue(selectedKey ? String(selectedKey) : '');
            }}
            placeholder={placeholder}
            variant="bordered"
            radius="sm"
            classNames={{
              base: styles.selectBase,
              trigger: styles.selectTrigger,
              value: styles.selectValue,
              listboxWrapper: styles.selectListboxWrapper,
              listbox: styles.selectListbox,
              popoverContent: styles.selectContent,
              innerWrapper: styles.selectViewport,
              selectorIcon: styles.selectIcon,
            }}
          >
            {options.map((option) => (
              <SelectItem 
                key={option.id} 
                value={String(option.id)}
                classNames={{
                  base: styles.selectItem,
                  title: styles.selectItemText,
                  selectedIcon: styles.selectItemIndicator,
                }}
              >
                {option.name}
              </SelectItem>
            ))}
          </Select>
          <div className={styles.editActions}>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isLoading || !editValue}
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
    <div className={`${styles.editableSelect} ${className || ''}`}>
      <div className={styles.displayContainer}>
        <span className={styles.displayValue}>
          {getDisplayValue()}
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

export default EditableSelect;
