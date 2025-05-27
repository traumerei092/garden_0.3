'use server';

export const signupUser = async (formData: {
  name: string;
  email: string;
  password: string;
  re_password: string;
}) => {
  console.log("📦 signup payload:", formData);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Cookieを送信しない
      body: JSON.stringify(formData),
    });

    let data;
    try {
      data = await res.json(); // ここでHTMLが返るとエラーになるので try にする
    } catch (e) {
      const text = await res.text();
      console.error("🛑 Response is not JSON:", text);
      return {
        success: false,
        error: { message: "予期しないエラーが発生しました。" },
      };
    }

    if (!res.ok) {
      console.error("📮 signupUser errorData:", data);
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
    console.error("🚨 signupUser fatal error:", error);
    return {
      success: false,
      error: { message: "ネットワークエラーが発生しました。" },
    };
  }
};
