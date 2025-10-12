import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

async function refreshAccessToken(token: any) {
  try {
    console.log('🔄 Attempting to refresh access token...')

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error('❌ Token refresh failed:', refreshedTokens)
      throw refreshedTokens
    }

    console.log('✅ Token refreshed successfully')
    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15分
      refreshToken: refreshedTokens.refresh ?? token.refreshToken, // refreshトークンが更新されない場合は既存のものを保持
    }
  } catch (error) {
    console.error('💥 Token refresh error:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔒 NextAuth credentials provider called')
        console.log('🔒 Credentials received:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password')
          return null
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL
          console.log('🌐 API URL:', apiUrl)

          // Django APIにログインリクエストを送信
          console.log('📡 Attempting login with Django API...')

          const loginUrl = `${apiUrl}/auth/jwt/create/`
          console.log('🔗 Login URL:', loginUrl)

          const res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          console.log('📡 Django API response status:', res.status)
          console.log('📡 Django API response headers:', Object.fromEntries(res.headers.entries()))

          if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Django API login failed:', {
              status: res.status,
              statusText: res.statusText,
              error: errorText
            })
            return null
          }

          const tokens = await res.json()
          console.log('✅ Django API tokens received:', {
            hasAccess: !!tokens.access,
            hasRefresh: !!tokens.refresh
          })

          // ユーザー情報を取得
          console.log('👤 Fetching user data...')
          const userUrl = `${apiUrl}/auth/users/me/`
          console.log('🔗 User URL:', userUrl)

          const userRes = await fetch(userUrl, {
            headers: {
              'Authorization': `JWT ${tokens.access}`,
              'Content-Type': 'application/json',
            },
          })

          console.log('👤 User API response status:', userRes.status)

          if (!userRes.ok) {
            const userErrorText = await userRes.text()
            console.error('❌ User data fetch failed:', {
              status: userRes.status,
              error: userErrorText
            })
            return null
          }

          const userData = await userRes.json()
          console.log('✅ User data received:', {
            id: userData.id,
            email: userData.email,
            name: userData.name
          })

          const user = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name,
            image: userData.avatar,
            header_image: userData.header_image,
            introduction: userData.introduction,
            gender: userData.gender,
            birthdate: userData.birthdate,
            my_area: userData.my_area,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          }

          console.log('✅ NextAuth user object created successfully')
          return user
        } catch (error) {
          console.error('💥 NextAuth authentication error:', error)
          console.error('💥 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })

          // エラー詳細をNextAuth.jsに返す
          throw new Error('認証に失敗しました。メールアドレスとパスワードを確認してください。')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 初回ログイン時
      if (user && account) {
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        token.uid = user.id
        token.id = user.id // user.idを明示的に設定
        token.header_image = (user as any).header_image
        token.introduction = (user as any).introduction
        token.gender = (user as any).gender
        token.birthdate = (user as any).birthdate
        token.my_area = (user as any).my_area
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000 // 15分
      }

      // アクセストークンの有効期限チェック
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // トークンリフレッシュ
      console.log('🔄 Access token expired, refreshing...')
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.uid = token.uid as string

      // ユーザープロパティをセッションに追加
      if (session.user) {
        session.user.id = token.id as string // user.idを明示的に設定
        session.user.header_image = token.header_image as string
        session.user.introduction = token.introduction as string
        session.user.gender = token.gender as string
        session.user.birthdate = token.birthdate as string
        session.user.my_area = token.my_area as string
      }

      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Google認証時にDjango側でユーザーを作成または取得
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social/google/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: account.access_token,
              email: profile?.email,
              name: profile?.name,
              picture: (profile as any)?.picture,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            user.accessToken = data.access
            user.refreshToken = data.refresh
            return true
          }
        } catch (error) {
          console.error('Google sign-in error:', error)
        }
        return false
      }

      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // エラー時もログインページにリダイレクト
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 24 * 60 * 60, // update session only when it's about to expire (24 hours)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }