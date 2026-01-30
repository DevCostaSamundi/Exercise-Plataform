import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useBalancePayment } from '../hooks/useBalancePayment';
import { useCryptoPayment } from '../hooks/useCryptoPayment';

export default function PaymentModal({ isOpen, onClose, paymentData, onSuccess }) {
    const web3Auth = useWeb3Auth();
    const { balance, getBalance, payWithBalance, loading: balanceLoading } = useBalancePayment();
    const cryptoPayment = useCryptoPayment();

    const [selectedMethod, setSelectedMethod] = useState('balance');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [debugLog, setDebugLog] = useState([]);

    // Detect wallet connection - using the hook's state
    const isWalletConnected = cryptoPayment?.isConnected || false;
    const walletAddress = cryptoPayment?.userAddress || null;

    // Debug logger
    const addLog = (message) => {
        console.log('🔍 DEBUG:', message);
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Load balance on mount
    useEffect(() => {
        if (isOpen && isWalletConnected) {
            getBalance();
        }
    }, [isOpen, isWalletConnected]);

    if (!isOpen) return null;

    const hasEnoughBalance = balance >= paymentData.amountUSD;

    const handleWalletConnect = async () => {
        try {
            addLog('Requesting wallet connection...');
            const address = await cryptoPayment.connectWallet();
            addLog('Wallet connected: ' + address);
        } catch (err) {
            addLog('❌ Connection error: ' + err.message);
            setError('Failed to connect wallet: ' + err.message);
        }
    };

    const handlePayment = async () => {
        try {
            setProcessing(true);
            setError(null);
            setDebugLog([]);
            addLog('Payment started');

            let result;

            if (selectedMethod === 'balance') {
                addLog('Using balance payment method');
                result = await payWithBalance(paymentData);
                addLog('Balance payment completed');

                setSuccess(true);

                setTimeout(() => {
                    if (onSuccess) onSuccess(result);
                    onClose();
                }, 2000);

            } else if (selectedMethod === 'crypto') {
                addLog('Using crypto payment method');

                // Check wallet
                if (!window.ethereum) {
                    throw new Error('No crypto wallet found. Please install MetaMask.');
                }
                addLog('Wallet extension detected');

                // Check if connected
                if (!isWalletConnected) {
                    addLog('Wallet not connected, requesting connection...');
                    await handleWalletConnect();
                }

                if (!walletAddress) {
                    throw new Error('Please connect your wallet first');
                }

                addLog('Wallet connected: ' + walletAddress);

                // Check if processPayment exists
                if (!cryptoPayment || typeof cryptoPayment.processPayment !== 'function') {
                    addLog('❌ ERROR: processPayment function not found in hook');
                    throw new Error('Payment function not available. Please refresh the page.');
                }

                addLog('Calling processPayment...');
                addLog('Payment data: ' + JSON.stringify({
                    creatorId: paymentData.creatorId,
                    type: paymentData.type,
                    amountUSD: paymentData.amountUSD,
                }, null, 2));

                const paymentResult = await cryptoPayment.processPayment(paymentData);
                addLog('processPayment returned: ' + JSON.stringify(paymentResult));

                const { paymentId, txHash } = paymentResult;
                addLog(`✅ Payment ID: ${paymentId}, TxHash: ${txHash}`);

                // Check if pollPaymentStatus exists
                if (typeof cryptoPayment.pollPaymentStatus !== 'function') {
                    addLog('⚠️ WARNING: pollPaymentStatus not found, skipping polling');
                    setSuccess(true);
                    setTimeout(() => {
                        if (onSuccess) onSuccess(paymentResult);
                        onClose();
                    }, 2000);
                    return;
                }

                addLog('Polling payment status...');
                const finalStatus = await cryptoPayment.pollPaymentStatus(paymentId, (status) => {
                    addLog('Status update: ' + JSON.stringify(status));
                });

                addLog('✅ Payment confirmed! Status: ' + JSON.stringify(finalStatus));
                setSuccess(true);

                setTimeout(() => {
                    if (onSuccess) onSuccess({ paymentId, txHash, ...finalStatus });
                    onClose();
                }, 2000);
            }

        } catch (err) {
            addLog('❌ ERROR: ' + err.message);
            if (err.stack) {
                addLog('Error stack: ' + err.stack);
            }
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
            addLog('Payment process finished');
        }
    };

    const getPaymentTitle = () => {
        switch (paymentData.type) {
            case 'SUBSCRIPTION':
                return 'Subscribe to Creator';
            case 'TIP':
                return 'Send Tip';
            case 'MESSAGE':
            case 'PPV_MESSAGE':
                return 'Send Message';
            case 'POST':
            case 'PPV_POST':
                return 'Unlock Post';
            default:
                return 'Complete Payment';
        }
    };

    const getStepMessage = () => {
        const currentStep = cryptoPayment?.currentStep || 'idle';
        switch (currentStep) {
            case 'creating':
                return 'Creating payment order...';
            case 'approving':
                return 'Approve USDC spending in your wallet...';
            case 'paying':
                return 'Confirm payment in your wallet...';
            case 'confirming':
                return 'Waiting for blockchain confirmation...';
            case 'success':
                return 'Payment successful!';
            default:
                return 'Processing payment...';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getPaymentTitle()}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        disabled={processing}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* DEBUG LOG */}
                    {debugLog.length > 0 && (
                        <div className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono max-h-48 overflow-y-auto">
                            <div className="font-bold mb-2">🔍 DEBUG LOG:</div>
                            {debugLog.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    )}

                    {/* Wallet Not Connected Warning */}
                    {!isWalletConnected && selectedMethod === 'crypto' && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-orange-600 flex-shrink-0" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                                        Wallet Not Connected
                                    </h3>
                                    <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                                        Please connect your MetaMask wallet to continue with crypto payment.
                                    </p>
                                    <button
                                        onClick={handleWalletConnect}
                                        disabled={processing}
                                        className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Connecting...' : 'Connect Wallet'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wallet Connected Info */}
                    {isWalletConnected && walletAddress && selectedMethod === 'crypto' && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                <div>
                                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                                        Wallet Connected
                                    </h3>
                                    <p className="text-sm text-green-800 dark:text-green-200 mt-1 font-mono">
                                        {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                <div>
                                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                                        Payment Successful!
                                    </h3>
                                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                                        Your payment has been processed successfully.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                                <div>
                                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                                        Payment Failed
                                    </h3>
                                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Processing Step */}
                    {processing && selectedMethod === 'crypto' && cryptoPayment?.currentStep !== 'idle' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Loader2 className="text-blue-600 animate-spin flex-shrink-0" size={24} />
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                        {getStepMessage()}
                                    </h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                        Please check your wallet and confirm the transaction.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                        <div className="text-sm opacity-90 mb-1">Amount to Pay</div>
                        <div className="text-4xl font-bold">${paymentData.amountUSD.toFixed(2)} USDC</div>
                        <div className="text-sm opacity-75 mt-2">
                            {paymentData.type === 'SUBSCRIPTION' && 'Monthly subscription'}
                            {paymentData.type === 'TIP' && 'One-time tip'}
                            {(paymentData.type === 'MESSAGE' || paymentData.type === 'PPV_MESSAGE') && 'Unlock message'}
                            {(paymentData.type === 'POST' || paymentData.type === 'PPV_POST') && 'Unlock content'}
                        </div>
                    </div>

                    {/* Current Balance */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Your Balance
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ${balance.toFixed(2)} USDC
                            </span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Select Payment Method
                        </h3>

                        {/* Balance Payment */}
                        <button
                            onClick={() => setSelectedMethod('balance')}
                            disabled={!hasEnoughBalance || processing}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${selectedMethod === 'balance'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                } ${!hasEnoughBalance
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${selectedMethod === 'balance'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    <Wallet size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        Pay with Balance
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {hasEnoughBalance
                                            ? 'Instant payment from your balance'
                                            : `Insufficient balance (Need $${(paymentData.amountUSD - balance).toFixed(2)} more)`
                                        }
                                    </div>
                                </div>
                                {selectedMethod === 'balance' && (
                                    <CheckCircle className="text-purple-600" size={24} />
                                )}
                            </div>
                        </button>

                        {/* Crypto Payment */}
                        <button
                            onClick={() => setSelectedMethod('crypto')}
                            disabled={processing}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${selectedMethod === 'crypto'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                } cursor-pointer`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${selectedMethod === 'crypto'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        Pay with Crypto Wallet
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Direct payment with MetaMask (USDC)
                                    </div>
                                </div>
                                {selectedMethod === 'crypto' && (
                                    <CheckCircle className="text-purple-600" size={24} />
                                )}
                            </div>
                        </button>

                        {/* Low Balance Warning */}
                        {!hasEnoughBalance && selectedMethod === 'balance' && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <p className="font-medium mb-1">Insufficient Balance</p>
                                        <p>
                                            Please deposit USDC or pay directly with crypto from your wallet.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Button */}
                    <button
                        onClick={handlePayment}
                        disabled={
                            processing ||
                            success ||
                            (selectedMethod === 'balance' && !hasEnoughBalance) ||
                            (selectedMethod === 'crypto' && !isWalletConnected)
                        }
                        className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${processing || success || (selectedMethod === 'balance' && !hasEnoughBalance) || (selectedMethod === 'crypto' && !isWalletConnected)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                    >
                        {processing ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={20} />
                                {selectedMethod === 'crypto' ? getStepMessage() : 'Processing Payment...'}
                            </span>
                        ) : success ? (
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Payment Successful
                            </span>
                        ) : selectedMethod === 'crypto' && !isWalletConnected ? (
                            'Connect Wallet First'
                        ) : (
                            `Pay $${paymentData.amountUSD.toFixed(2)} USDC`
                        )}
                    </button>

                    {/* Security Note */}
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                        <p>🔒 Secure payment powered by blockchain technology</p>
                        <p className="mt-1">All transactions are encrypted and verified on Polygon</p>
                    </div>
                </div>
            </div>
        </div>
    );
}