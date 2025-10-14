import { fetchWithSession } from '@/app/lib/fetchWithSession';
import { ApiResponse } from '@/types/users';

export interface SendEmailChangeOTPRequest {
  currentPassword: string;
  newEmail: string;
}

export interface VerifyEmailChangeOTPRequest {
  newEmail: string;
  otp: string;
}

export const sendEmailChangeOTP = async (data: SendEmailChangeOTPRequest): Promise<ApiResponse> => {
  try {
    const response = await fetchWithSession('/accounts/send-email-change-otp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: data.currentPassword,
        new_email: data.newEmail,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'OTPの送信に失敗しました',
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: responseData.message || 'OTPを送信しました',
    };
  } catch (error) {
    console.error('Send email change OTP error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};

export const verifyEmailChangeOTP = async (data: VerifyEmailChangeOTPRequest): Promise<ApiResponse> => {
  try {
    const response = await fetchWithSession('/accounts/verify-email-change-otp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_email: data.newEmail,
        otp: data.otp,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'コードが正しくありません',
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: responseData.message || 'メールアドレスを変更しました',
    };
  } catch (error) {
    console.error('Verify email change OTP error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};

export const updateEmail = async (data: { newEmail: string }): Promise<ApiResponse> => {
  try {
    const response = await fetchWithSession('/accounts/change-email/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_email: data.newEmail,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'メールアドレスの変更に失敗しました',
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: responseData.message || 'メールアドレスを変更しました',
    };
  } catch (error) {
    console.error('Email update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};