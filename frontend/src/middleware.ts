import { withAuth } from "next-auth/middleware"

export default withAuth(
  // middleware処理（オプション）
  function middleware(req) {
    // 必要に応じて追加の処理をここに記述
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // tokenが存在すれば認証済みとみなす
        return !!token
      }
    },
  }
)

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/profile/:path*',
    '/favorite/:path*',
    '/visited/:path*',
    '/wishlist/:path*',
    '/dashboard/:path*'
  ]
}