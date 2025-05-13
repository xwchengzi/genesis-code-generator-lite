
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Profile } from '@/types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasValidAccess: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, phoneNumber: string, additionalData?: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  hasValidAccess: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = profile?.user_type === 'admin';
  const hasValidAccess = profile ? new Date(profile.access_expiry_date) > new Date() : false;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user.id);
      setProfile(profile);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // First find the email associated with the username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (profileError || !profileData) {
        throw new Error('用户名不存在');
      }
      
      // Now sign in with this email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // This is just a placeholder since we're using usernames
        password,
      });

      if (error) {
        throw error;
      }

      const profile = await fetchProfile(data.user.id);
      setUser(data.user);
      setProfile(profile);

      if (profile?.user_type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.message || '请检查您的用户名和密码',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    username: string, 
    password: string, 
    phoneNumber: string, 
    additionalData: Record<string, string> = {}
  ) => {
    try {
      setIsLoading(true);
      
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      // Sign up with email (username as email) and password
      const { data, error } = await supabase.auth.signUp({
        email: `${username}@example.com`, // Using username as email
        password,
        options: {
          data: {
            username,
            phone_number: phoneNumber,
            user_type: 'user',
            ...additionalData
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: '注册成功',
        description: '您已成功注册，请登录',
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: '注册失败',
        description: error.message || '请检查您的注册信息',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate('/login');
    } catch (error: any) {
      toast({
        title: '退出失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(async () => {
              const profile = await fetchProfile(session.user.id);
              setProfile(profile);
            }, 0);
          } else {
            setProfile(null);
          }
        }
      );
      
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setProfile(profile);
      }
      
      setIsLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAdmin, 
      isLoading, 
      hasValidAccess,
      signIn, 
      signUp, 
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
