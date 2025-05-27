'use server';

export const getUserServer = async (accessToken: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`, {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Cookieを送信しない
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ getCurrentUser error:', errorData);
      return { success: false, error: errorData };
    }

    const user = await res.json();
    return { success: true, user };
  } catch (error) {
    console.error('🚨 getCurrentUser fatal error:', error);
    return { success: false, error: { message: 'ネットワークエラーが発生しました。' } };
  }
};
