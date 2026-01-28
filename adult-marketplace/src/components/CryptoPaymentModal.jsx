import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCryptoPayment } from '../hooks/useCryptoPayment';
import {
    X,
    Wallet,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Copy,
    Check
} from 'lucide-react';

export default function CryptoPaymentModal({
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
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const {
        processPayment,
        pollPaymentStatus,
        currentStep,
        error,
        loading
    } = useCryptoPayment();

    const [paymentResult, setPaymentResult] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [copied, setCopied] = useState(false);

    // Reset on open/close
    useEffect(() => {
        if (!isOpen) {
            setPaymentResult(null);
            setPaymentStatus(null);
        }
    }, [isOpen]);

    // Handle payment
    const handlePayment = async () => {
        try {
            // Execute payment
            const result = await processPayment({
                creatorId: creator.id,
                type,
                amountUSD,
                subscriptionId,
                postId,
                messageId,
            });

            setPaymentResult(result);

            // Poll for confirmation
            const finalStatus = await pollPaymentStatus(result.paymentId, (status) => {
                setPaymentStatus(status);
            });

            // Success!
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(finalStatus);
                }
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Payment error:', err);
        }
    };

    // Copy to clipboard
    const copyAddress = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Get explorer URL
    const getExplorerUrl = (txHash) => {
        const network = import.meta.env.VITE_NETWORK || 'polygon';
        const baseUrl = network === 'polygon'
            ? 'https://polygonscan.com'
            : 'https://amoy.polygonscan.com';
        return `${baseUrl}/tx/${txHash}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    disabled={loading}
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pay with Crypto
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Subscribe to {creator.displayName}
                    </p>
                </div>

                {/* Amount Display */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            USDC on Polygon
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        ${amountUSD.toFixed(2)} USDC
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 space-y-1">
                        <div className="flex justify-between">
                            <span>Creator receives:</span>
                            <span className="font-medium">${(amountUSD * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Platform fee (10%):</span>
                            <span className="font-medium">${(amountUSD * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Network fee:</span>
                            <span className="font-medium">~$0.01</span>
                        </div>
                    </div>
                </div>

                {/* Step: Connect Wallet */}
                {currentStep === 'idle' && !isConnected && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex gap-2">
                                <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium mb-1">First time using crypto?</p>
                                    <p className="text-xs">
                                        You'll need a wallet like MetaMask with USDC on Polygon network.
                                        <a href="#" className="underline ml-1">Learn how →</a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {connectors.map((connector) => (
                                <button
                                    key={connector.id}
                                    onClick={() => connect({ connector })}
                                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    <Wallet size={20} />
                                    Connect {connector.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step: Wallet Connected, Ready to Pay */}
                {currentStep === 'idle' && isConnected && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Connected Wallet
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-mono text-gray-900 dark:text-white">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </span>
                                <button
                                    onClick={() => disconnect()}
                                    className="text-xs text-red-600 hover:text-red-700"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                                Requirements
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {amountUSD.toFixed(2)} USDC on Polygon network
                                    </span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Small amount of MATIC for gas (~$0.01)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Pay ${amountUSD.toFixed(2)} USDC
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step: Creating Order */}
                {currentStep === 'creating' && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Creating Order...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Please wait
                        </p>
                    </div>
                )}

                {/* Step: Approving */}
                {currentStep === 'approving' && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Approve USDC Spending
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Confirm the transaction in your wallet
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-xs text-yellow-800 dark:text-yellow-200">
                            This is a one-time approval. Future payments will be faster!
                        </div>
                    </div>
                )}

                {/* Step: Paying */}
                {currentStep === 'paying' && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Processing Payment
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Confirm the transaction in your wallet
                        </p>
                    </div>
                )}

                {/* Step: Confirming */}
                {currentStep === 'confirming' && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Confirming on Blockchain...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Waiting for network confirmation
                        </p>

                        {paymentStatus && (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                    <span className="font-medium text-blue-600">{paymentStatus.status}</span>
                                </div>
                                {paymentStatus.web3Confirmations !== null && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">Confirmations:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {paymentStatus.web3Confirmations}/2
                                        </span>
                                    </div>
                                )}
                                {paymentResult?.txHash && (

                                    <a href={getExplorerUrl(paymentResult.txHash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                                    >
                                        View on Explorer
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                            Usually takes 30-60 seconds
                        </p>
                    </div>
                )}

                {/* Step: Success */}
                {currentStep === 'success' && (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful! 🎉
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Your subscription is now active
                        </p>

                        {paymentResult?.txHash && (

                            <a href={getExplorerUrl(paymentResult.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                            >
                                View Transaction
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && currentStep !== 'success' && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex gap-2">
                            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-red-800 dark:text-red-200">
                                <p className="font-medium">Payment Failed</p>
                                <p className="text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Text */}
                {currentStep === 'idle' && isConnected && (
                    <div className="mt-4 text-center">
                        <a
                            href="/help/crypto-payments"
                            className="text-xs text-purple-600 hover:text-purple-700"
                        >
                            Need help? Learn about crypto payments →
                        </a>
                    </div>
                )}
            </div>
        </div >
    );
}