"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DataService } from "@/lib/data-service";
import { SAMPLE_USER_ID } from "@/lib/sample-data";
import { shouldExitPreview } from "@/lib/product-validation";

interface AppContextType {
  user: User | null;
  isPreviewMode: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  setPreviewMode: (enabled: boolean) => void;
  signOut: () => Promise<void>;
  resetPreviewData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPreviewMode, setIsPreviewModeState] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    const initialPreview = DataService.isPreviewMode();
    setIsPreviewModeState(initialPreview);

    if (configured) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user || null);
          if (session?.user) {
            DataService.setPreviewMode(false);
            setIsPreviewModeState(false);
          }
          setIsLoading(false);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user || null);
          if (shouldExitPreview(event, Boolean(session?.user))) {
            DataService.setPreviewMode(false);
            setIsPreviewModeState(false);
          } else if (event === "SIGNED_OUT") {
            DataService.setPreviewMode(true);
            setIsPreviewModeState(true);
          }
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      }
    }

    setIsLoading(false);
  }, []);

  const handleSetPreviewMode = (enabled: boolean) => {
    DataService.setPreviewMode(enabled);
    setIsPreviewModeState(enabled);
    if (enabled) router.replace("/");
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        window.alert("Could not sign out. Please try again.");
        return;
      }
    }
    setUser(null);
    DataService.setPreviewMode(true);
    setIsPreviewModeState(true);
    router.replace("/auth");
  };

  const handleResetPreviewData = () => {
    const { previewStore } = require("@/lib/preview-store");
    previewStore.reset();
    window.dispatchEvent(new Event("preview-data-reset"));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isPreviewMode,
        isConfigured,
        isLoading,
        setPreviewMode: handleSetPreviewMode,
        signOut: handleSignOut,
        resetPreviewData: handleResetPreviewData,
      }}
    >
        {isLoading ? <div className="p-8 text-sm text-stone-600" role="status">Opening Job Tracker…</div> : <React.Fragment key={`${isPreviewMode ? "sample" : "account"}:${user?.id || "guest"}`}>{children}</React.Fragment>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
