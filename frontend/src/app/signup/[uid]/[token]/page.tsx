'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import ButtonGradient from '@/components/UI/ButtonGradient';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';

const ActivationPage = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const [success, setSuccess] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const activateUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/activation/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token }),
        });

        if (res.ok) {
          setSuccess(true);
        } else {
          setSuccess(false);
        }
      } catch (error) {
        console.error('Activation error:', error);
        setSuccess(false);
      }
    };

    activateUser();
  }, [uid, token]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-semibold mb-4">
        {success === null
          ? 'アカウントを確認中...'
          : success
          ? 'アカウントが確認されました 🎉'
          : 'アカウントの確認に失敗しました 😢'}
      </h1>

      {success === true && (
        <ButtonGradient onClick={() => router.push('/login')} anotherStyle="">
          ログインしてGARDENを楽しむ
        </ButtonGradient>
      )}

      {success === false && (
        <div className="flex flex-col gap-4">
          <ButtonGradient onClick={() => router.push('/resend')} anotherStyle="">
            メールを再送
          </ButtonGradient>
          <ButtonGradientWrapper onClick={() => router.push('/signup')} anotherStyle="">
            Sign UPページへ
          </ButtonGradientWrapper>
        </div>
      )}
    </div>
  );
};

export default ActivationPage;