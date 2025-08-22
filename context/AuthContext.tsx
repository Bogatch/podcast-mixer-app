'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type CheckoutResult = { error?: string };
interface PurchaseContextType {
  createCheckout: (email: string) => Promise<CheckoutResult>;
}

export const AuthContext = createContext<PurchaseContextType | undefined>(undefined);

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

async function safeParseJSON(text: string): Promise<any | null> {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const createCheckout = async (email: string): Promise<CheckoutResult> => {
    if (!email || !isValidEmail(email)) {
      return { error: 'Please enter a valid email address.' };
    }

    // Protect against calling during SSR
    if (typeof window === 'undefined') {
      return { error: 'Checkout can only be started in the browser.' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s safety timeout

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // quantity left here if you later support multiple seats
        body: JSON.stringify({ email, quantity: 1 }),
        signal: controller.signal,
      }).catch((e) => {
        // Network/abort errors
        throw new Error(e?.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Network error. Please try again.');
      }).finally(() => clearTimeout(timeout));

      const raw = await res.text();
      const data = await safeParseJSON(raw);

      // Always handle non-JSON text responses from Vercel (e.g., FUNCTION_INVOCATION_FAILED)
      if (!res.ok) {
        const msg =
          (data && (data.message || data.error || data?.error?.message)) ||
          raw ||
          'Payment server error. Please try again.';
        console.error('create-checkout failed:', { status: res.status, msg, raw });
        return { error: String(msg) };
      }

      const url: string | undefined = data?.url;
      const ok: boolean | undefined = data?.ok ?? Boolean(url);

      if (!ok || !url) {
        console.error('Unexpected checkout response:', { data, raw });
        return { error: 'Unexpected response from payment server.' };
      }

      // Redirect to Stripe Checkout; keep promise pending to avoid UI flicker
      window.location.href = url;
      return new Promise<CheckoutResult>(() => {});
    } catch (err: any) {
      console.error('Error calling create-checkout API:', err);
      return { error: err?.message || 'Could not connect to the payment server. Please try again.' };
    }
  };

  const value: PurchaseContextType = { createCheckout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): PurchaseContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};