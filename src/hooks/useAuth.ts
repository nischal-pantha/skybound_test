import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { signInWithPopup } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  /**
   * Sign in with Google via Firebase, then exchange the Firebase ID token
   * for a Supabase session so the rest of the app (RLS, hooks) works normally.
   */
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // Sign into Supabase using the Firebase ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      return { data: null, error: { message } as { message: string } };
    }
  };

  const signOut = async () => {
    // Clear sensitive localStorage data on logout
    const sensitiveKeys = [
      'studentProfile',
      'studentGoals',
      'aviation_notes',
      'aviation_calculations',
      'flightEntries',
      'flightSchedules',
      'savedFlightPlans',
      'customAircraft',
      'customAircraftChecklists',
      'currentWeather',
      'recentSearches'
    ];

    sensitiveKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key} from localStorage:`, e);
      }
    });

    // Sign out from Firebase (if signed in via Google)
    try {
      await firebaseAuth.signOut();
    } catch (_) {
      // Not signed in via Firebase — ignore
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!session
  };
}
