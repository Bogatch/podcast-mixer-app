import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/config';

interface Profile {
  email: string;
  is_pro: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isPro: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  saveProject: (projectData: any) => Promise<void>;
  loadProject: () => Promise<any | null>;
  createCheckout: () => Promise<void>;
}

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

let stripePromise: Promise<Stripe | null>;
if (STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, is_pro')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      };
      fetchProfile();
      
      // Listen for profile changes (e.g., after webhook update)
      const channel = supabase.channel('profile-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
        }, (payload) => {
            setProfile(payload.new as Profile);
        })
        .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }

    } else {
      setProfile(null);
    }
  }, [user]);

  const saveProject = async (projectData: any) => {
    if (!user) throw new Error('User must be logged in to save a project.');
    
    // Check if project exists
    const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: no rows found
        throw fetchError;
    }

    if (existingProject) {
        // Update existing project
        const payload: ProjectUpdate = { project_data: projectData, name: 'default' };
        const { error } = await supabase
            .from('projects')
            .update(payload)
            .eq('user_id', user.id);
        if (error) throw error;
    } else {
        // Create new project
        const payload: ProjectInsert = { user_id: user.id, project_data: projectData, name: 'default' };
        const { error } = await supabase
            .from('projects')
            .insert(payload);
        if (error) throw error;
    }
  };

  const loadProject = async (): Promise<any | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('project_data')
        .eq('user_id', user.id)
        .single();
    
      if (error && error.code !== 'PGRST116') {
          throw error;
      }
      return data?.project_data || null;
  }

  const createCheckout = async () => {
    if (!user || !user.email) {
        throw new Error("auth_must_be_logged_in");
    }
    if (!stripePromise || !STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe is not configured. Please add your publishable key.");
    }

    const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userId: user.id }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "unlock_modal_checkout_failed");
    }

    const data = await response.json();
    const sessionId = data?.sessionId;

    if (sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
                 throw new Error(error.message);
            }
        }
    } else {
        throw new Error("unlock_modal_checkout_failed");
    }
  };
  
  const value: AuthContextType = {
    user,
    session,
    profile,
    isPro: profile?.is_pro ?? false,
    // Use Supabase v2 auth methods
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
    saveProject,
    loadProject,
    createCheckout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};