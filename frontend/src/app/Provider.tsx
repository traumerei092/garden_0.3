'use client';

import * as React from "react";
import { useEffect } from "react";

// 1. import `NextUIProvider` component
import {NextUIProvider} from "@nextui-org/react";
import { Toaster } from 'sonner';
import {ReactNode} from "react";
import { SessionProvider } from 'next-auth/react';
import { clearOldAuthTokens } from '@/utils/clearOldAuthTokens';

export default function Provider({ children }: { children: ReactNode }) {
  // 旧認証システムのトークンをクリア（一度だけ実行）
  useEffect(() => {
    clearOldAuthTokens();
  }, []);

  // 2. Wrap providers at the root of your app
    return (
        <>
            <SessionProvider
                refetchInterval={0} // セッション自動更新を無効化
                refetchOnWindowFocus={false} // ウィンドウフォーカス時の更新を無効化
            >
                <NextUIProvider>
                    { children }
                </NextUIProvider>
            </SessionProvider>
            <Toaster richColors position="bottom-right" />
        </>
    );
}