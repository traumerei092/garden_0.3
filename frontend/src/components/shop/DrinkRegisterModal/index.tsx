'use client'

import React, { useState, useEffect } from 'react'
import { Wine, Coffee, Sparkles, Grape } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Select, SelectItem, Textarea, Card, CardBody } from '@nextui-org/react'
import { 
  DrinkMasterData, 
  AlcoholCategory, 
  AlcoholBrand, 
  DrinkStyle,
  ShopDrink 
} from '@/types/shops'
import { createShopDrink, fetchDrinkMasterData } from '@/actions/shop/drinks'
import Modal from '@/components/UI/Modal'
import ModalButtons from '@/components/UI/ModalButtons'
import styles from './style.module.scss'

// バリデーションスキーマ
const drinkFormSchema = z.object({
  name: z.string().min(1, 'ドリンク名は必須です').max(100, 'ドリンク名は100文字以内で入力してください'),
  description: z.string().max(500, '説明は500文字以内で入力してください'),
  isAlcohol: z.boolean(),
  alcoholCategoryId: z.number().optional(),
  alcoholBrandId: z.number().optional(),
  drinkStyleId: z.number().optional()
})

type DrinkFormData = z.infer<typeof drinkFormSchema>

interface DrinkRegisterModalProps {
  shopId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (newDrink: ShopDrink) => void
}

const DrinkRegisterModal: React.FC<DrinkRegisterModalProps> = ({
  shopId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [masterData, setMasterData] = useState<DrinkMasterData | null>(null)
  const [filteredBrands, setFilteredBrands] = useState<AlcoholBrand[]>([])
  const [filteredStyles, setFilteredStyles] = useState<DrinkStyle[]>([])

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<DrinkFormData>({
    resolver: zodResolver(drinkFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isAlcohol: true,
      alcoholCategoryId: undefined,
      alcoholBrandId: undefined,
      drinkStyleId: undefined
    }
  })

  const watchIsAlcohol = watch('isAlcohol')
  const watchAlcoholCategory = watch('alcoholCategoryId')

  // マスターデータ取得
  useEffect(() => {
    if (isOpen && !masterData) {
      fetchDrinkMasterData()
        .then(setMasterData)
        .catch(console.error)
    }
  }, [isOpen, masterData])

  // カテゴリに基づいてブランドとスタイルをフィルタリング
  useEffect(() => {
    if (!masterData || !watchAlcoholCategory) {
      setFilteredBrands([])
      setFilteredStyles([])
      setValue('alcoholBrandId', undefined)
      setValue('drinkStyleId', undefined)
      return
    }

    const categoryBrands = masterData.alcohol_brands.filter(
      brand => brand.category.id === watchAlcoholCategory
    )
    const categoryStyles = masterData.drink_styles.filter(
      style => style.category.id === watchAlcoholCategory
    )

    setFilteredBrands(categoryBrands)
    setFilteredStyles(categoryStyles)
    
    // 現在選択されているブランド/スタイルが新しいカテゴリに含まれない場合はクリア
    const currentBrandId = watch('alcoholBrandId')
    const currentStyleId = watch('drinkStyleId')
    
    if (currentBrandId && !categoryBrands.find(b => b.id === currentBrandId)) {
      setValue('alcoholBrandId', undefined)
    }
    if (currentStyleId && !categoryStyles.find(s => s.id === currentStyleId)) {
      setValue('drinkStyleId', undefined)
    }
  }, [watchAlcoholCategory, masterData, setValue, watch])

  // アルコール/ノンアルコール切り替え時の処理
  useEffect(() => {
    if (!watchIsAlcohol) {
      setValue('alcoholCategoryId', undefined)
      setValue('alcoholBrandId', undefined)
      setValue('drinkStyleId', undefined)
    }
  }, [watchIsAlcohol, setValue])

  const onSubmit = async (data: DrinkFormData) => {
    setIsLoading(true)
    try {
      const newDrink = await createShopDrink({
        shopId,
        name: data.name,
        description: data.description,
        isAlcohol: data.isAlcohol,
        alcoholCategoryId: data.alcoholCategoryId,
        alcoholBrandId: data.alcoholBrandId,
        drinkStyleId: data.drinkStyleId
      })
      
      onSuccess(newDrink)
      handleClose()
    } catch (error) {
      console.error('ドリンク登録エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const modalContent = (
    <div className={styles.container}>
      {/* ドリンクタイプ選択 */}
      <div className={styles.drinkTypeSection}>
        <h3 className={styles.sectionTitle}>
          <Sparkles className={styles.sectionIcon} strokeWidth={1} />
          ドリンクタイプ
        </h3>
        <Controller
          name="isAlcohol"
          control={control}
          render={({ field }) => (
            <div className={styles.typeGrid}>
              <Card 
                isPressable
                onPress={() => field.onChange(true)}
                className={`${styles.typeCard} ${field.value ? styles.selected : ''}`}
              >
                <CardBody className={styles.typeCardBody}>
                  <Wine className={styles.typeIcon} strokeWidth={1} />
                  <h4 className={styles.typeTitle}>
                    アルコール
                  </h4>
                </CardBody>
              </Card>

              <Card 
                isPressable
                onPress={() => field.onChange(false)}
                className={`${styles.typeCard} ${!field.value ? styles.selectedCyan : ''}`}
              >
                <CardBody className={styles.typeCardBody}>
                  <Coffee className={styles.typeIcon} strokeWidth={1}/>
                  <h4 className={styles.typeTitle}>
                    ノンアルコール
                  </h4>
                </CardBody>
              </Card>
            </div>
          )}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* ドリンク名 */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="ドリンク名"
              placeholder="例: 山崎 12年、エスプレッソ、モヒート"
              variant="bordered"
              size="lg"
              isRequired
              startContent={
                <div className="flex items-center">
                  <Grape className="w-4 h-4 text-zinc-400 mr-2" />
                </div>
              }
              classNames={{
                base: styles.inputWrapper,
                mainWrapper: "h-full",
                input: styles.input,
                inputWrapper: [
                  styles.inputContainer,
                  styles.dark,
                  styles.focused,
                  styles.blurred,
                ],
                label: styles.inputLabel,
              }}
              errorMessage={errors.name?.message}
              isInvalid={!!errors.name}
            />
          )}
        />

        {/* アルコール詳細セクション */}
        {watchIsAlcohol && masterData && (
          <div className={styles.alcoholSection}>
            <h4 className={styles.alcoholTitle}>
              <Wine className={styles.alcoholIcon} strokeWidth={1} />
              アルコール詳細
            </h4>
            
            {/* カテゴリ */}
            <Controller
              name="alcoholCategoryId"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  label="アルコールカテゴリ"
                  placeholder="カテゴリを選択"
                  variant="bordered"
                  size="lg"
                  selectedKeys={value ? [value.toString()] : []}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0] as string;
                    onChange(selectedValue ? parseInt(selectedValue) : undefined);
                  }}
                  classNames={{
                    base: styles.selectWrapper,
                    trigger: styles.selectTrigger,
                    value: styles.selectValue,
                    label: styles.selectLabel,
                    listboxWrapper: styles.selectListbox,
                    popoverContent: styles.selectPopover,
                  }}
                >
                  {masterData.alcohol_categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className={styles.selectItem}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />

            {/* ブランド */}
            {filteredBrands.length > 0 && (
              <Controller
                name="alcoholBrandId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="ブランド"
                    placeholder="ブランドを選択"
                    variant="bordered"
                    size="lg"
                    selectedKeys={value ? [value.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedValue = Array.from(keys)[0] as string;
                      onChange(selectedValue ? parseInt(selectedValue) : undefined);
                    }}
                    classNames={{
                      base: styles.selectWrapper,
                      trigger: styles.selectTrigger,
                      value: styles.selectValue,
                      label: styles.selectLabel,
                      listboxWrapper: styles.selectListbox,
                      popoverContent: styles.selectPopover,
                    }}
                  >
                    {filteredBrands.map((brand) => (
                      <SelectItem 
                        key={brand.id} 
                        value={brand.id}
                        className={styles.selectItem}
                      >
                        {brand.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}

            {/* スタイル */}
            {filteredStyles.length > 0 && (
              <Controller
                name="drinkStyleId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="飲み方・カクテル"
                    placeholder="スタイルを選択"
                    variant="bordered"
                    size="lg"
                    selectedKeys={value ? [value.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedValue = Array.from(keys)[0] as string;
                      onChange(selectedValue ? parseInt(selectedValue) : undefined);
                    }}
                    classNames={{
                      base: styles.selectWrapper,
                      trigger: styles.selectTrigger,
                      value: styles.selectValue,
                      label: styles.selectLabel,
                      listboxWrapper: styles.selectListbox,
                      popoverContent: styles.selectPopover,
                    }}
                  >
                    {filteredStyles.map((style) => (
                      <SelectItem 
                        key={style.id} 
                        value={style.id}
                        className={styles.selectItem}
                      >
                        {style.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}
          </div>
        )}

        {/* 説明 - プレミアムTextarea */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              label="説明・特徴"
              placeholder="このドリンクの特徴、味わい、おすすめポイントなどを教えてください..."
              variant="bordered"
              size="lg"
              minRows={3}
              maxRows={6}
              classNames={{
                base: styles.textareaWrapper,
                input: styles.textarea,
                inputWrapper: [
                  styles.textareaContainer,
                  styles.blurred,
                ],
                label: styles.textareaLabel,
              }}
              errorMessage={errors.description?.message}
              isInvalid={!!errors.description}
            />
          )}
        />
      </form>
    </div>
  )

  const handleSave = () => {
    handleSubmit(onSubmit)()
  }

  const modalFooter = (
    <ModalButtons
      onCancel={handleClose}
      onSave={handleSave}
      isLoading={isLoading}
      saveText="登録する"
      cancelText="キャンセル"
    />
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="ドリンク登録"
      size="lg"
      footer={modalFooter}
    >
      {modalContent}
    </Modal>
  )
}

export default DrinkRegisterModal