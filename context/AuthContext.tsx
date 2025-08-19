// This context has been deprecated and is no longer in use.
// The previous checkout logic based on Stripe Payment Links has been replaced
// with a new modal-based payment flow using Stripe Elements.
// This file can be safely deleted from the project.

import React, { createContext, useContext, ReactNode } from 'react';

interface PurchaseContextType {}

export const AuthContext = createContext<PurchaseContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuth = (): PurchaseContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};