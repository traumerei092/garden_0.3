'use client'

import { useRouter } from 'next/navigation';
import ButtonGradient from '@/components/UI/ButtonGradient';

export default function VerifyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-white mt-20 gap-6">
      <h1 className="text-xl font-bold">確認メールを送信しました</h1>
      <p>メール内のリンクをクリックして登録を完了してください。</p>
      <ButtonGradient onClick={() => router.push('/login')} anotherStyle={""}>
        ログインページへ
      </ButtonGradient>
    </div>
  );
}