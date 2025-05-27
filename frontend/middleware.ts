import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/shops/create'],
};

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access')?.value;

  // 保護したいパス一覧（例：/shops/new など）
  const protectedPaths = ['/shops/create'];

  const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isProtected && !accessToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname); // 元のページを next に保存
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
