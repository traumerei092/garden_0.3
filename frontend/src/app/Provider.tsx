import * as React from "react";

// 1. import `HeroUIProvider` component
import {NextUIProvider} from "@nextui-org/react";
import { Toaster } from 'sonner';
import {ReactNode} from "react";

export default function Provider({ children }: { children: ReactNode }) {
  // 2. Wrap HeroUIProvider at the root of your app
    return (
        <>
            <NextUIProvider>
                { children }
            </NextUIProvider>
            <Toaster richColors position="bottom-right" />
        </>
    );
}