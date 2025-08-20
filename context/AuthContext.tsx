import React, { createContext, useContext, ReactNode } from 'react';

interface PurchaseContextType {
  createCheckout: (email: string) => Promise<{ error?: string }>;
}

export const AuthContext = createContext<PurchaseContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const createCheckout = async (email: string): Promise<{ error?: string }> => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { error: 'Please enter a valid email address.' };
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.url) {
        console.error("Failed to create checkout session:", data);
        return { error: data.message || 'Could not create checkout session. Please try again later.' };
      }
      
      window.location.href = data.url;

    } catch (err: any) {
      console.error("Error calling create-checkout API:", err);
      return { error: 'Could not connect to the payment server. Please try again.' };
    }

    // Return a promise that never resolves to keep the UI in a loading state
    // until the browser navigates away.
    return new Promise(() => {});
  };

  const value: PurchaseContextType = {
    createCheckout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): PurchaseContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
