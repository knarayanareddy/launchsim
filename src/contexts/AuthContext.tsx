import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan_tier: string;
  simulations_run: number;
  credits_remaining: number;
  onboarding_completed: boolean;
  user_type: string | null;
  referral_code: string;
  referred_by: string | null;
  total_referrals: number;
  is_admin: boolean;
  is_suspended: boolean;
  email_prefs: {
    simulation_complete: boolean;
    credit_warnings: boolean;
    product_updates: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ? { ...data, email_prefs: data.email_prefs as Profile["email_prefs"] } : null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const processReferral = async () => {
    const refCode = localStorage.getItem("launchsim_ref");
    if (!refCode) return;
    try {
      const { data, error } = await supabase.functions.invoke("process-referral", {
        body: { referral_code: refCode },
      });
      if (!error && data?.success) {
        localStorage.removeItem("launchsim_ref");
        // Will be visible after profile refresh
      } else if (data?.already_processed) {
        localStorage.removeItem("launchsim_ref");
      }
    } catch (e) {
      console.error("Referral processing error:", e);
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase client
          setTimeout(() => {
            fetchProfile(session.user.id);
            // Process referral on first login
            if (event === "SIGNED_IN") {
              processReferral();
            }
          }, 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
