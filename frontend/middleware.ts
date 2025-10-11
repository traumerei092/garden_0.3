import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // 認証が必要なページでのリダイレクト処理は
    // NextAuth.jsが自動的に処理するため、ここでは追加の処理は不要
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 保護したいパス一覧
        const protectedPaths = ['/shops/create', '/profile', '/wishlist', '/favorite', '/visited'];
        const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));

        // 保護されたパスで認証が必要
        if (isProtected) {
          return !!token;
        }

        // その他のパスは認証不要
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/shops/create',
    '/profile/:path*',
    '/wishlist',
    '/favorite',
    '/visited',
    // API routesも必要に応じて保護
    '/api/protected/:path*'
  ],
}
