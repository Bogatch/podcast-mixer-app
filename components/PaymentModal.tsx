import React, { useState, useEffect, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/config';
import { I18nContext } from '../lib/i18n';
import { XMarkIcon, SpinnerIcon, CreditCardIcon } from './icons';

interface PaymentModalProps {
  onClose: () => void;
  email: string;
}

// Load stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutForm: React.FC<{ email: string; onClose: () => void }> = ({ email, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useContext(I18nContext);

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}`,
        receipt_email: email,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || 'An unexpected error occurred.');
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full flex items-center justify-center px-6 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-md transition-colors"
      >
        {isLoading ? (
          <SpinnerIcon className="w-6 h-6 animate-spin" />
        ) : (
          <span id="button-text" className="flex items-center">
            <CreditCardIcon className="w-6 h-6 mr-3" />
            <span>{t('payment_modal_pay_button')}</span>
          </span>
        )}
      </button>
      {message && <div id="payment-message" className="text-red-400 text-sm text-center pt-2">{message}</div>}
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, email }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useContext(I18nContext);

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    .then(async (res) => {
      if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to parse error response.'}));
          throw new Error(data.error || t('payment_modal_error_init'));
      }
      return res.json();
    })
    .then((data) => {
      setClientSecret(data.clientSecret);
    })
    .catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    })
    .finally(() => {
        setLoading(false);
    });
  }, [email, t]);

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f59e0b', // amber-500
      colorBackground: '#1f2937', // gray-800
      colorText: '#d1d5db', // gray-300
      colorDanger: '#f87171', // red-400
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };
  
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t('payment_modal_title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            title={t('close')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-8">
          {loading && (
             <div className="flex items-center justify-center h-48">
                <SpinnerIcon className="w-10 h-10 animate-spin text-yellow-500" />
             </div>
          )}
          {error && (
            <div className="text-center text-red-400 p-4 bg-red-500/10 rounded-md">
                <p><strong>{t('payment_modal_error_title')}</strong></p>
                <p>{error}</p>
            </div>
          )}
          {clientSecret && !error && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm email={email} onClose={onClose} />
            </Elements>
          )}
        </main>
      </div>
    </div>
  );
};
