import React, { createContext, useContext, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/config';

interface PurchaseContextType {
  createCheckout: (email: string) => Promise<{ error?: string }>;
}

let stripePromise: Promise<Stripe | null>;
if (STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
}

export const AuthContext = createContext<PurchaseContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const createCheckout = async (email: string): Promise<{ error?: string }> => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return { error: 'Please enter a valid email address.' };
    }
    if (!stripePromise || !STRIPE_PUBLISHABLE_KEY) {
        return { error: 'Stripe is not configured.' };
    }

    try {
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage;
            
            // If the server returns an HTML error page from Vercel/server crash
            if (responseText.trim().startsWith('<')) {
                 errorMessage = 'A server error occurred. Please try again later.';
            } else {
                // Otherwise, try to parse for a JSON error, but fall back to the raw text
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.error?.message || responseText;
                } catch (e) {
                    // The response was not JSON, use the raw text.
                    errorMessage = responseText || 'An unknown server error occurred.';
                }
            }
            return { error: errorMessage };
        }

        const data = await response.json();
        const sessionId = data?.sessionId;

        if (sessionId) {
            const stripe = await stripePromise;
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    return { error: error.message };
                }
            }
        } else {
             return { error: "Could not create checkout session." };
        }
    } catch (err: any) {
        console.error("Error during createCheckout API call:", err);
        let message = 'A network error occurred. Please check your connection and try again.';

        if (err instanceof TypeError && err.message.includes('fetch')) {
            message = 'Could not connect to the server. Please check your internet connection.';
        } else if (err instanceof SyntaxError) {
            message = 'Received an invalid response from the server. This could be a temporary issue.';
        } else if (err.message) {
            message = err.message;
        }
        
        return { error: message };
    }
    return {};
  };
  
  const value: PurchaseContextType = {
    createCheckout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): PurchaseContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};