import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useWeb3Payment } from '../hooks/useWeb3Payment';
import { X, Wallet, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Web3PaymentModal({ 
    isOpen, 
    onClose, 
    creator, 
    amountUSD, 
    type = 'SUBSCRIPTION',
    subscriptionId,
    postId,
    messageId,
    onSuccess 
}) {
    const { address, isConnected, login, loading: walletLoading } = useWeb3Auth();
    const { processPayment, pollPaymentStatus, loading: paymentLoading, error } = useWeb3Payment();
    
    const [step, setStep] = useState('connect'); // 'connect', 'processing', 'confirming', 'success', 'error'
    const [paymentId, setPaymentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            if (isConnected) {
                setStep('connect');
            }
            setErrorMessage('');
            setPaymentId(null);
            setPaymentStatus(null);
        }
    }, [isOpen, isConnected]);

    // Handle wallet connection
    const handleConnect = async () => {
        try {
            await login();
            setStep('connect');
        } catch (err) {
            setErrorMessage(err.message);
            setStep('error');
        }
    };

    // Handle payment
    const handlePayment = async () => {
        try {
            setStep('processing');
            setErrorMessage('');

            // Process payment
            const result = await processPayment({
                creatorId: creator.id,
                type,
                amountUSD,
                subscriptionId,
                postId,
                messageId,
            });

            setPaymentId(result.paymentId);
            setStep('confirming');

            // Start polling for status
            const finalStatus = await pollPaymentStatus(result.paymentId, (status) => {
                setPaymentStatus(status);
            });

            setStep('success');
            
            // Call success callback after delay
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(finalStatus);
                }
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Payment error:', err);
            setErrorMessage(err.message || 'Payment failed');
            setStep('error');
        }
    };

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    disabled={step === 'processing' || step === 'confirming'}
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Complete Payment
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Subscribe to {creator.displayName}
                    </p>
                </div>

                {/* Amount */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Amount</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        ${amountUSD.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Platform fee (10%): ${(amountUSD * 0.1).toFixed(2)}
                    </div>
                </div>

                {/* Step: Connect Wallet */}
                {step === 'connect' && !isConnected && (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Connect your wallet to continue with the payment.
                        </p>
                        <button
                            onClick={handleConnect}
                            disabled={walletLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {walletLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Wallet size={20} />
                                    Connect Wallet
                                </>
                            )}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                            We'll create a secure wallet for you using your social login
                        </p>
                    </div>
                )}

                {/* Step: Ready to Pay */}
                {step === 'connect' && isConnected && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Connected Wallet
                            </div>
                            <div className="text-sm font-mono text-gray-900 dark:text-white">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                Payment Methods
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">

                            <li> Crypto (USDC)</li>
                            </ul>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={paymentLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                        >
                            Continue to Payment
                        </button>

                        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                            You'll be redirected to our secure payment partner
                        </p>
                    </div>
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Opening Payment Window...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Please complete the payment in the new window
                        </p>
                    </div>
                )}

                {/* Step: Confirming */}
                {step === 'confirming' && (
                    <div className="text-center py-8">
                        <Clock className="animate-pulse mx-auto mb-4 text-blue-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Confirming Payment...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Waiting for blockchain confirmation
                        </p>
                        
                        {paymentStatus && (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left">
                                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                                    <div>Status: <span className="font-medium">{paymentStatus.status}</span></div>
                                    {paymentStatus.web3Confirmations !== null && (
                                        <div>Confirmations: {paymentStatus.web3Confirmations}/2</div>
                                    )}
                                    {paymentStatus.web3TxHash && (
                                        <div className="break-all">
                                            Tx: {paymentStatus.web3TxHash.slice(0, 10)}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                            This usually takes 1-2 minutes
                        </p>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful! 🎉
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your subscription is now active
                        </p>
                    </div>
                )}

                {/* Step: Error */}
                {step === 'error' && (
                    <div className="text-center py-8">
                        <XCircle className="mx-auto mb-4 text-red-600" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Failed
                        </h3>
                        <p className="text-red-600 dark:text-red-400 mb-4">
                            {errorMessage || error}
                        </p>
                        <button
                            onClick={() => {
                                setStep('connect');
                                setErrorMessage('');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}