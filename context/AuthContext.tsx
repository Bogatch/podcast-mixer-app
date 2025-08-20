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

    // Hardcoded Stripe Payment Link as requested by the user.
    const stripePaymentLink = 'https://buy.stripe.com/bJe14ogcG5bi9QR47g00000';

    try {
      const url = `${stripePaymentLink}?prefilled_email=${encodeURIComponent(email)}`;
      window.location.href = url;
    } catch (err: any) {
      console.error("Error during redirect to Stripe:", err);
      return { error: 'Could not redirect to payment page. Please try again.' };
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
