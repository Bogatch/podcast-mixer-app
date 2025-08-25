import React, { useContext, useMemo } from 'react';
import { Toast } from './Toast';
import { useStripeReturnNotice } from '../hooks/useStripeReturnNotice';
import { I18nContext } from '../lib/i18n';

export const StripeReturnBanner: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { notice, clear } = useStripeReturnNotice();

  const content = useMemo(() => {
    if (!notice) return null;

    if (notice.kind === 'success') {
      return {
        tone: 'success' as const,
        title: t('stripe_return_success_title') || 'Payment completed',
        message:
          t('stripe_return_success_message') ||
          'Your payment was successful. Please check your email for the activation code.',
      };
    }
    return {
      tone: 'error' as const,
      title: t('stripe_return_cancel_title') || 'Payment cancelled',
      message:
        t('stripe_return_cancel_message') ||
        'The payment was cancelled. You can try again anytime.',
    };
  }, [notice, t]);

  if (!notice || !content) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <Toast
        tone={content.tone}
        title={content.title}
        message={content.message}
        onClose={clear}
      />
    </div>
  );
};
