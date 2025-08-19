import React, { useState, useEffect, useContext } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon, SpinnerIcon, CreditCardIcon, CheckIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/config';

// Load Stripe outside of a component’s render to avoid recreating the `Stripe` object on every render.
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface PaymentModalProps {
    onClose: () => void;
    email: string;
}

const CheckoutForm: React.FC<{onSuccess: () => void, email: string}> = ({ onSuccess, email }) => {
    const { t } = useContext(I18nContext);
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
                receipt_email: email,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || t('error_invalid_license'));
        } else {
            setMessage(t('error_mixing_failed'));
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full mt-6 flex items-center justify-center px-6 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-md transition-colors"
            >
                {isLoading ? (
                    <SpinnerIcon className="w-6 h-6 animate-spin" />
                ) : (
                    <>
                        <CreditCardIcon className="w-6 h-6 mr-3" />
                        <span>{t('purchase_modal_buy_license')}</span>
                    </>
                )}
            </button>
            {message && <div id="payment-message" className="text-red-400 text-sm text-center mt-4">{message}</div>}
        </form>
    );
};


export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, email }) => {
    const { t } = useContext(I18nContext);
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPaymentSuccessful, setPaymentSuccessful] = useState(false);
    
    useEffect(() => {
        const checkStatus = async () => {
            if (!stripePromise) return;
            const stripe = await stripePromise;
            if (!stripe) return;

            const clientSecretParam = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
            if (!clientSecretParam) return;

            const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecretParam);

            if (paymentIntent?.status === "succeeded") {
                setPaymentSuccessful(true);
            }
        };
        checkStatus();
    }, []);

    useEffect(() => {
        if (!email || isPaymentSuccessful) return;

        fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                // Throw an error with the message from the server's JSON response
                throw new Error(data.error || t('unlock_modal_checkout_failed'));
            }
            return data;
        })
        .then((data) => {
            if (!data.clientSecret) {
                // Handle case where server responds 200 OK but without the secret
                throw new Error('Could not initialize the payment form.');
            }
            setClientSecret(data.clientSecret);
        })
        .catch(err => {
            console.error(err);
            // Display the specific error message from the catch block
            setError(err.message);
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, [email, isPaymentSuccessful, t]);

    const appearance = {
        theme: 'night' as const,
        variables: {
            colorPrimary: '#f59e0b',
            colorBackground: '#1f2937',
            colorText: '#d1d5db',
            colorDanger: '#f87171',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '0.375rem',
        },
    };
    const options: StripeElementsOptions = {
        clientSecret,
        appearance,
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex items-center justify-between border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{t('unlock_buy_license_tab')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        title={t('close')}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-8 overflow-y-auto">
                    {isPaymentSuccessful ? (
                        <div className="text-center space-y-4">
                            <CheckIcon className="w-16 h-16 text-green-400 mx-auto" />
                            <h3 className="text-2xl font-bold text-white">{t('activation_success_title')}</h3>
                            <p className="text-gray-300">
                                Thank you for your purchase! Your license key has been sent to <strong>{new URLSearchParams(window.location.search).get("redirect_status") === "succeeded" ? 'your email' : email}</strong>.
                                Please use the "Enter License Key" tab to activate it.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-md transition-colors"
                            >
                                {t('close')}
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <SpinnerIcon className="w-8 h-8 animate-spin text-yellow-400" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                           <p className="font-semibold text-red-300">{t('unlock_modal_checkout_failed')}</p>
                           <p className="text-sm mt-1">{error}</p>
                        </div>
                    ) : clientSecret ? (
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm onSuccess={() => setPaymentSuccessful(true)} email={email} />
                        </Elements>
                    ) : (
                         <div className="flex justify-center items-center h-48 text-center text-red-400">
                            <p>{t('unlock_modal_checkout_failed')}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};