import {ShopFormValues} from "@/types/shops";

export const createShop = async (formValues: ShopFormValues, token: string) => {
    const formData = new FormData();
    console.log("--- 送信前のフォームデータ ---");
    console.log("フォーム値:", formValues);

    // 基本情報
    // 住所は各フィールドの間にスペースを入れて結合
    const addressParts = [
        formValues.prefecture,
        formValues.city,
        formValues.street,
        formValues.building
    ].filter(part => part && part.trim() !== ''); // 空の値を除外
    
    const createFormData = {
        name: formValues.shopName,
        zip_code: formValues.zipCode,
        address: addressParts.join(' '), // スペースで結合
        prefecture: formValues.prefecture,
        city: formValues.city,
        street: formValues.street,
        building: formValues.building,
        capacity: formValues.capacity,
    };

    // FormDataに追加
    Object.entries(createFormData).forEach(([key, value]) => {
        // capacityフィールドの特別処理 - null, undefined, NaNの場合は送信しない
        if (key === 'capacity') {
            if (value !== null && value !== undefined && !isNaN(Number(value))) {
                formData.append(key, String(value));
            }
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // ManyToManyフィールド - IDを数値に変換して送信（NaNの場合は元の値を使用）
    formValues.shopTypes.forEach(type => {
        const parsedId = parseInt(type.id, 10);
        formData.append('shop_types', String(isNaN(parsedId) ? type.id : parsedId));
    });
    formValues.shopLayouts.forEach(layout => {
        const parsedId = parseInt(layout.id, 10);
        formData.append('shop_layouts', String(isNaN(parsedId) ? layout.id : parsedId));
    });
    formValues.shopOptions.forEach(option => {
        const parsedId = parseInt(option.id, 10);
        formData.append('shop_options', String(isNaN(parsedId) ? option.id : parsedId));
    });

    // 営業時間 - 個別のフィールドとして送信
    Object.entries(formValues.businessHours).forEach(([day, hourData]) => {
        // 営業開始時間
        if (hourData.open && !hourData.isClosed) {
            const openHour = hourData.open.hour.toString().padStart(2, '0');
            const openMinute = hourData.open.minute.toString().padStart(2, '0');
            formData.append(`business_hour_${day}_open_time`, `${openHour}:${openMinute}`);
        }
        
        // 営業終了時間
        if (hourData.close && !hourData.isClosed) {
            const closeHour = hourData.close.hour.toString().padStart(2, '0');
            const closeMinute = hourData.close.minute.toString().padStart(2, '0');
            formData.append(`business_hour_${day}_close_time`, `${closeHour}:${closeMinute}`);
        }
        
        // 定休日フラグ
        formData.append(`business_hour_${day}_is_closed`, hourData.isClosed.toString());
    });

    // 画像
    console.log("--- 画像データ ---");
    formValues.images.forEach((image, index) => {
        if (image.file) {
            formData.append(`image_${index}`, image.file);
            formData.append(`caption_${index}`, image.caption || '');
            formData.append(`is_icon_${index}`, String(image.isIcon));
        }
    });

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-create/`, {
            method: 'POST',
            headers: {
                'Authorization': `JWT ${token}`
            },
            credentials: 'omit', // Cookieを送信しない
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return { success: false, error: errorJson.message || errorJson.detail || '店舗の登録に失敗しました' };
            } catch (e) {
                return { success: false, error: errorText || '店舗の登録に失敗しました' };
            }
        }

        const data = await res.json();
        return { success: true, data };

    } catch (error) {
        console.error('ネットワークエラー:', error);
        return { success: false, error: 'ネットワークエラーが発生しました' };
    }
};
