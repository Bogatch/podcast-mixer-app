import { useEffect, useState } from 'react';

type Notice =
  | { kind: 'success'; sessionId?: string }
  | { kind: 'cancel' }
  | null;

export function useStripeReturnNotice() {
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const success = url.searchParams.get('payment_success');
    const cancel = url.searchParams.get('payment_cancel');
    const sessionId = url.searchParams.get('session_id') || undefined;

    if (success === 'true') {
      setNotice({ kind: 'success', sessionId });
    } else if (cancel === 'true') {
      setNotice({ kind: 'cancel' });
    }

    // po prečítaní vyčistíme URL (bez reloadu)
    if (success || cancel || sessionId) {
      url.searchParams.delete('payment_success');
      url.searchParams.delete('payment_cancel');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  return { notice, clear: () => setNotice(null) };
}
