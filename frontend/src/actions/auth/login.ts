'use server'

export const loginUser = async (formData: {
  email: string;
  password: string;
}) => {

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Cookieを送信しない
      body: JSON.stringify(formData),
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      const text = await res.text();
      console.error('🛑 Response is not JSON:', text);
      return {
        success: false,
        error: { message: '予期しないエラーが発生しました。' },
      };
    }

    if (!res.ok) {
      console.error('❌ loginUser errorData:', data);
      return {
        success: false,
        error: data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('🚨 loginUser fatal error:', error);
    return {
      success: false,
      error: { message: 'ネットワークエラーが発生しました。' },
    };
  }
};
