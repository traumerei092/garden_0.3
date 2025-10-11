import {
  ShopDrink,
  DrinkMasterData
} from '@/types/shops'
import { fetchWithSession } from '@/app/lib/fetchWithSession'

// 店舗のドリンクメニュー取得
export const fetchShopDrinks = async (shopId: number): Promise<{ drinks: ShopDrink[] }> => {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/shop_drinks/?shop_id=${shopId}`)

  if (!res.ok) {
    throw new Error('Failed to fetch shop drinks')
  }
  return res.json()
}

// ドリンクマスターデータ取得
export const fetchDrinkMasterData = async (): Promise<DrinkMasterData> => {
  // このAPIは認証が不要なため、通常のfetchを使用
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/profile-data/`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch drink master data')
  }

  const data = await res.json()
  return {
    alcohol_categories: data.alcohol_categories || [],
    alcohol_brands: data.alcohol_brands || [],
    drink_styles: data.drink_styles || []
  }
}

// ドリンク登録
export interface CreateDrinkParams {
  shopId: number
  name: string
  description: string
  isAlcohol: boolean
  alcoholCategoryId?: number
  alcoholBrandId?: number
  drinkStyleId?: number
}

export const createShopDrink = async (params: CreateDrinkParams): Promise<ShopDrink> => {
  const payload = {
    shop_id: params.shopId,
    name: params.name,
    description: params.description,
    is_alcohol: params.isAlcohol,
    ...(params.alcoholCategoryId && { alcohol_category_id: params.alcoholCategoryId }),
    ...(params.alcoholBrandId && { alcohol_brand_id: params.alcoholBrandId }),
    ...(params.drinkStyleId && { drink_style_id: params.drinkStyleId })
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/create_drink/`
  console.log('🚀 Creating drink:', { url, payload })

  const res = await fetchWithSession(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  console.log('📡 Response status:', res.status)

  if (!res.ok) {
    const errorData = await res.json()
    console.error('❌ Error response:', errorData)
    throw new Error(errorData.detail || 'Failed to create drink')
  }

  return res.json()
}

// ドリンクの反応切り替え
export const toggleDrinkReaction = async (
  drinkId: number, 
  reactionType: string = 'like'
): Promise<{ status: string; reaction_count: number }> => {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/${drinkId}/toggle_reaction/`, {
    method: 'POST',
    body: JSON.stringify({ reaction_type: reactionType })
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Failed to toggle drink reaction')
  }

  return res.json()
}

// ドリンク詳細取得
export const fetchShopDrink = async (drinkId: number): Promise<ShopDrink> => {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/${drinkId}/`)

  if (!res.ok) {
    throw new Error('Failed to fetch shop drink')
  }

  return res.json()
}

// ドリンク更新
export interface UpdateDrinkParams extends CreateDrinkParams {
  drinkId: number
}

export const updateShopDrink = async (params: UpdateDrinkParams): Promise<ShopDrink> => {
  const payload = {
    name: params.name,
    description: params.description,
    is_alcohol: params.isAlcohol,
    ...(params.alcoholCategoryId && { alcohol_category_id: params.alcoholCategoryId }),
    ...(params.alcoholBrandId && { alcohol_brand_id: params.alcoholBrandId }),
    ...(params.drinkStyleId && { drink_style_id: params.drinkStyleId })
  }

  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/${params.drinkId}/`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Failed to update drink')
  }

  return res.json()
}

// ドリンク削除
export const deleteShopDrink = async (drinkId: number): Promise<void> => {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-drinks/${drinkId}/`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Failed to delete drink')
  }
}