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

      if (response.ok) { // A 2xx status from the webhook. Now, we must check the body.
        try {
            // A correctly configured Make.com scenario should return a JSON response.
            // On success, it should return something like: {"valid": true}
            // On failure (but still 200 OK), it might return: {"valid": false, "error": "Invalid key"}
            const data = await response.json();

            if (data && data.valid === true) {
                // License is confirmed as valid by the webhook.
                const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
                setIsPro(true);
                setProUser({ email: email.trim(), key: code.trim() });
                return { success: true };
            } else {
                // The webhook responded with 200 OK, but the content indicates the license is invalid.
                return { success: false, error: data.error || "Invalid email or license key." };
            }
        } catch (e) {
            // The response was 200 OK, but not valid JSON. This can happen if the Make.com
            // scenario returns a simple text string like "Accepted" by default.
            // We treat this as a failure because we expect a specific JSON structure for confirmation.
            console.warn("Webhook response was not valid JSON.", e);
            return { success: false, error: "Received an unexpected response from the license server." };
        }
      } else {
        // The webhook returned a non-2xx status (e.g., 401, 404, 500).
        let errorMessage = "Invalid email or license key.";
        try {
            const responseText = await response.text();
            if (responseText) {
                // Use the webhook's response as the error message if available.
                errorMessage = responseText;
            }
        } catch (e) {
            console.warn("Could not read error response body from webhook.");
        }
        return { success: false, error: errorMessage };
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