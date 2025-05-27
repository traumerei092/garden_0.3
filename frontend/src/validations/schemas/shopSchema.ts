import { z } from 'zod';

export const shopFormSchema = z.object({
    shopName: z.string()
        .min(1, '店舗名を入力してください')
        .max(100, '店舗名は100文字以内で入力してください'),
    zipCode: z.string()
        .regex(/^\d{3}-?\d{4}$/, '正しい郵便番号の形式で入力してください'),
    prefecture: z.string()
        .min(1, '都道府県を入力してください'),
    city: z.string()
        .min(1, '市区町村を入力してください'),
    street: z.string()
        .min(1, '番地を入力してください'),
    building: z.string().optional(),
    shopTypes: z.array(z.object({
        id: z.string(),
        name: z.string()
    })),
    shopLayouts: z.array(z.object({
        id: z.string(),
        name: z.string()
    })),
    shopOptions: z.array(z.object({
        id: z.string(),
        name: z.string()
    })),
    capacity: z.number().nullable()
        .refine(val => val === null || (val >= 0 && val <= 999), {
            message: '席数は0から999の間で入力してください'
        }),
    businessHours: z.record(z.object({
        open: z.any(),
        close: z.any(),
        isClosed: z.boolean()
    })),
    images: z.array(z.object({
        file: z.any().nullable(),
        caption: z.string(),
        isIcon: z.boolean()
    }))
    .refine(images => images.some(img => img.isIcon), {
        message: 'アイコン画像を1枚選択してください'
    })
});