'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Wine, Coffee, Tag, Star } from 'lucide-react'
import { ShopDrink } from '@/types/shops'
import { toggleDrinkReaction } from '@/actions/shop/drinks'
import styles from './style.module.scss'

interface DrinkCardProps {
  drink: ShopDrink
  className?: string
  onReactionUpdate?: (drinkId: number, newCount: number, userHasReacted: boolean) => void
}

const DrinkCard: React.FC<DrinkCardProps> = ({ 
  drink, 
  className = "",
  onReactionUpdate 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentReactionCount, setCurrentReactionCount] = useState(drink.reaction_count)
  const [userHasReacted, setUserHasReacted] = useState(drink.user_has_reacted)

  const handleReactionToggle = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await toggleDrinkReaction(drink.id)
      const newCount = result.reaction_count
      const newUserHasReacted = result.status === 'added'
      
      setCurrentReactionCount(newCount)
      setUserHasReacted(newUserHasReacted)
      
      // 親コンポーネントに通知
      onReactionUpdate?.(drink.id, newCount, newUserHasReacted)
    } catch (error) {
      console.error('リアクションの切り替えに失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${styles.drinkCard} ${drink.is_alcohol ? styles.alcohol : styles.nonAlcohol} ${className}`}
    >
      {/* メインコンテンツ */}
      <div className={styles.content}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {drink.name}
          </h3>
          
          {/* リアクションボタン */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReactionToggle}
            disabled={isLoading}
            className={`${styles.reactionButton} ${userHasReacted ? styles.reacted : ''}`}
          >
            <Heart 
              className={`${styles.reactionIcon} ${userHasReacted ? styles.filled : ''}`} 
            />
            <span className={styles.reactionCount}>
              {currentReactionCount}
            </span>
          </motion.button>
        </div>

        {/* 説明文 */}
        {drink.description && (
          <p className={styles.description}>
            {drink.description}
          </p>
        )}

        {/* タグフッター */}
        <div className={styles.footer}>
          {/* アルコール/ノンアルコールタグ */}
          <span className={`${styles.tag} ${styles.alcoholType} ${drink.is_alcohol ? styles.alcohol : ''}`}>
            {drink.is_alcohol ? (
              <>
                <Wine className={styles.tagIcon} />
                アルコール
              </>
            ) : (
              <>
                <Coffee className={styles.tagIcon} />
                ノンアルコール
              </>
            )}
          </span>

          {/* カテゴリタグ */}
          {drink.alcohol_category && (
            <span className={`${styles.tag} ${styles.category}`}>
              <Tag className={styles.tagIcon} />
              {drink.alcohol_category.name}
            </span>
          )}
          
          {/* ブランドタグ */}
          {drink.alcohol_brand && (
            <span className={`${styles.tag} ${styles.brand}`}>
              <Star className={styles.tagIcon} />
              {drink.alcohol_brand.name}
            </span>
          )}

          {/* 飲み方タグ */}
          {drink.drink_style && (
            <span className={`${styles.tag} ${styles.style}`}>
              <Sparkles className={styles.tagIcon} />
              {drink.drink_style.name}
            </span>
          )}
        </div>
      </div>

      {/* ホバー時のグロー効果 */}
      <div className={styles.glowEffect} />
    </motion.div>
  )
}

export default DrinkCard