import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { User } from '@/types/users';

/**
 * NextAuth.js session wrapper that provides compatibility with the old useAuthStore
 * This hook provides a consistent interface for authentication state
 */
export const useAuthSession = () => {
  const { data: session, status } = useSession();

  // Convert NextAuth session to compatible user format - MEMOIZED to prevent infinite loops
  const user: User | null = useMemo(() => {
    if (!session?.user) return null;

    // session.user.idが存在しない場合はnullを返す
    if (!session.user.id) {
      console.error('🚨 session.user.id is missing!', { session, user: session.user });
      return null;
    }

    return {
      id: parseInt(session.user.id),
      uid: session.uid || '',
      email: session.user.email,
      username: session.user.name || '',
      first_name: '',
      last_name: '',
      name: session.user.name || '',
      avatar: session.user.image || null,
      header_image: session.user.header_image || null,
      bio: null,
      introduction: session.user.introduction || null,
      gender: session.user.gender || null,
      birthdate: session.user.birthdate || null,
      my_area: session.user.my_area || null,
      work_info: null,
      occupation: null,
      industry: null,
      position: null,
      exercise_frequency: null,
      dietary_preference: null,
      budget_range: null,
      visit_purposes: [],
      is_profile_public: false,
      interests: [],
      blood_type: null,
      mbti: null,
      alcohols: [],
      alcohol_categories: [],
      alcohol_brands: [],
      drink_styles: [],
      hobbies: [],
      exercise_habits: [],
      social_preferences: [],
      updated_at: '',
      created_at: '',
    };
  }, [
    session?.user?.id,
    session?.user?.email,
    session?.user?.name,
    session?.user?.image,
    session?.user?.header_image,
    session?.user?.introduction,
    session?.user?.gender,
    session?.user?.birthdate,
    session?.user?.my_area,
    session?.uid
  ]);

  const isLoggedIn = !!session && status === 'authenticated';
  const isLoading = status === 'loading';

  // デバッグ: セッションデータの状態確認
  console.log('🔍 useAuthSession - Session data:', {
    status,
    hasSession: !!session,
    sessionUser: session?.user,
    hasHeaderImage: !!session?.user?.header_image,
    hasGender: !!session?.user?.gender,
    hasBirthdate: !!session?.user?.birthdate,
    hasMyArea: !!session?.user?.my_area,
    memoizedUser: user
  });

  return {
    user,
    isLoggedIn,
    isLoading,
    session,
    status
  };
};