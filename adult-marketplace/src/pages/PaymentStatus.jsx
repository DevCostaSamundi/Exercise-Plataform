import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWeb3Payment } from '../hooks/useWeb3Payment';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

export default function PaymentStatus() {
    const { paymentId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderId = searchParams.get('orderId');

    const { checkPaymentStatus, pollPaymentStatus } = useWeb3Payment();

    const [status, setStatus] = useState('loading');
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (paymentId || orderId) {
            loadPaymentStatus();
        }
    }, [paymentId, orderId]);

    const loadPaymentStatus = async () => {
        try {
            setStatus('loading');

            // If we have orderId from Transak redirect, we need to find the payment
            // For now, we'll poll with the paymentId
            if (paymentId) {
                // Start polling
                const finalStatus = await pollPaymentStatus(paymentId, (update) => {
                    setPayment(update);
                    setStatus(mapStatus(update.status));
                });

                setPayment(finalStatus);
                setStatus(mapStatus(finalStatus.status));
            } else {
                // Just orderId, need to query by orderId
                // This would require a new endpoint: GET /payments/by-order/:orderId
                setError('Payment ID not found');
                setStatus('error');
            }
        } catch (err) {
            console.error('Error loading payment:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const mapStatus = (paymentStatus) => {
        const statusMap = {
            'PENDING': 'pending',
            'WAITING': 'pending',
            'CONFIRMING': 'confirming',
            'COMPLETED': 'success',
            'FAILED': 'failed',
            'EXPIRED': 'failed',
            'CANCELLED': 'failed',
        };
        return statusMap[paymentStatus] || 'pending';
    };

    const handleContinue = () => {
        if (payment?.creator) {
            navigate(`/creator/${payment.creator.user.username}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

                    {/* Loading */}
                    {status === 'loading' && (
                        <div className="text-center">
                            <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={64} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Loading Payment...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Please wait while we retrieve your payment details
                            </p>
                        </div>
                    )}

                    {/* Pending/Confirming */}
                    {(status === 'pending' || status === 'confirming') && (
                        <div className="text-center">
                            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={64} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {status === 'pending' ? 'Processing Payment...' : 'Confirming Payment...'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {status === 'pending'
                                    ? 'Your payment is being processed'
                                    : 'Waiting for blockchain confirmation'}
                            </p>

                            {payment && (
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 text-left">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${payment.amountUSD}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                            <span className="font-medium text-blue-600">
                                                {payment.status}
                                            </span>
                                        </div>
                                        {payment.web3Confirmations !== null && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Confirmations:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {payment.web3Confirmations}/2
                                                </span>
                                            </div>
                                        )}
                                        {payment.web3TxHash && (
                                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">

                                                <a href={`https://polygonscan.com/tx/${payment.web3TxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1">
                                                    View on Polygonscan
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                This usually takes 1-3 minutes. Please don't close this page.
                            </p>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <div className="text-center">
                            <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Payment Successful! 🎉
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Your {payment?.type.toLowerCase().replace('_', ' ')} is now active
                            </p>

                            {payment && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                                            <span className="font-bold text-green-600">
                                                ${payment.amountUSD}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Creator Received:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${(payment.amountUSD * 0.9).toFixed(2)}
                                            </span>
                                        </div>
                                        {payment.web3TxHash && (
                                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">

                                                <a href={`https://polygonscan.com/tx/${payment.web3TxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700 text-xs flex items-center justify-center gap-1">
                                                    View Transaction
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleContinue}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                            >
                                Continue to Content
                            </button>
                        </div>
                    )
                    }

                    {/* Failed */}
                    {
                        status === 'failed' && (
                            <div className="text-center">
                                <XCircle className="mx-auto mb-4 text-red-600" size={64} />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Payment Failed
                                </h2>
                                <p className="text-red-600 dark:text-red-400 mb-6">
                                    {payment?.status === 'EXPIRED'
                                        ? 'Payment expired. Please try again.'
                                        : 'Something went wrong with your payment.'}
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-medium"
                                    >
                                        Go Home
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* Error */}
                    {
                        status === 'error' && (
                            <div className="text-center">
                                <XCircle className="mx-auto mb-4 text-red-600" size={64} />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Error Loading Payment
                                </h2>
                                <p className="text-red-600 dark:text-red-400 mb-6">
                                    {error}
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                                >
                                    Go Home
                                </button>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}