import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proUser: { email: string; key: string } | null;
  verifyLicense: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proUser, setProUser] = useState<{ email: string; key: string } | null>(null);

  useEffect(() => {
    try {
      const savedLicense = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLicense) {
        const licenseData = JSON.parse(savedLicense);
        if (licenseData.isPro && licenseData.email && licenseData.key) {
          setIsPro(true);
          setProUser({ email: licenseData.email, key: licenseData.key });
        }
      }
    } catch (e) {
      console.error("Failed to load license from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const apiUrl = 'https://hook.eu2.make.com/fbbcsb128zgndyyvmt98s3dq178402up';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, license_key: code }),
      });
      
      const responseText = await response.text();

      if (response.ok) { // A 2xx status from the webhook.
        let isSuccess = false;

        // Ideal case: The webhook returns a structured JSON response
        try {
            const data = JSON.parse(responseText);
            if (data && data.valid === true) {
                isSuccess = true;
            }
        } catch (e) {
            // Not JSON, so we check for the plain text response
        }
        
        // Fallback case: The webhook returns a simple "Accepted" text
        if (!isSuccess && responseText.trim().toLowerCase() === 'accepted') {
            isSuccess = true;
        }

        if (isSuccess) {
            const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
            setIsPro(true);
            setProUser({ email: email.trim(), key: code.trim() });
            return { success: true };
        } else {
            // The webhook responded with 200 OK, but the content indicates failure
            return { success: false, error: "Invalid email or license key." };
        }

      } else {
        // The webhook returned a non-2xx status (e.g., 401, 404, 500).
        // Use the response text as the error message if available, otherwise a generic one.
        return { success: false, error: responseText || "Invalid email or license key." };
      }
    } catch (error) {
      console.error("Failed to call verification API:", error);
      // This catch block handles network errors (e.g. CORS, DNS, no internet)
      return { success: false, error: "Could not connect to the license server." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsPro(false);
    setProUser(null);
  }, []);

  const value: ProContextType = {
    isPro,
    isLoading,
    proUser,
    verifyLicense,
    logout,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
};

export const usePro = (): ProContextType => {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
};