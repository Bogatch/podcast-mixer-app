// context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { I18nContext } from "../lib/i18n";

interface PurchaseContextType {
  createCheckout: (email: string) => Promise<{ error?: string }>;
}

export const AuthContext = createContext<PurchaseContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useContext(I18nContext);

  const createCheckout = async (email: string): Promise<{ error?: string }> => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { error: t('auth_error_invalid_email') };
    }

    try {
      const resp = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // najprv sa pokúsime o JSON; ak by server zlyhal 500 s textom, ošetríme to nižšie
      const data = await resp.json().catch(async () => {
        const raw = await resp.text();
        return { ok: false, error: raw || "Unknown server response." };
      });

      if (!resp.ok || !data?.ok || !data?.url) {
        console.error("create-checkout failed:", data);
        return { error: data?.error || t('auth_error_checkout_session') };
      }

      // DÔLEŽITÉ: flag do sessionStorage, aby sme vedeli po návrate ukázať “ďakujeme” modál
      sessionStorage.setItem("pm_showPaymentThanks", "1");

      // presmerovanie na Stripe
      window.location.href = data.url;
      // nevraciame nič – pre istotu promise “necháme visieť”
      return new Promise(() => {});
    } catch (err: any) {
      console.error("create-checkout error:", err);
      return { error: t('auth_error_payment_server') };
    }
  };

  return (
    <AuthContext.Provider value={{ createCheckout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): PurchaseContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};