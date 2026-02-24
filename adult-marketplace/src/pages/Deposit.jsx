
import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { Copy, Check, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import QRCode from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Deposit() {
    const { address, isConnected, authToken } = useWeb3Auth();

    const [depositInfo, setDepositInfo] = useState(null);
    const [depositHistory, setDepositHistory] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Load deposit info
    useEffect(() => {
        if (isConnected && authToken) {
            loadDepositInfo();
            loadDepositHistory();
            loadBalance();
        }
    }, [isConnected, authToken]);

    const loadDepositInfo = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/wallet/deposit/address`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDepositInfo(res.data.data);
        } catch (error) {
            console.error('Error loading deposit info:', error);
        }
    };

    const loadDepositHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/wallet/deposit/history`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDepositHistory(res.data.data);
        } catch (error) {
            console.error('Error loading deposit history:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBalance = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/wallet/balance`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setBalance(res.data.data.balance);
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    };

    const copyAddress = () => {
        if (depositInfo?.address) {
            navigator.clipboard.writeText(depositInfo.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getExplorerUrl = (txHash) => {
        const network = import.meta.env.VITE_NETWORK || 'polygon';
        const baseUrl = network === 'polygon'
            ? 'https://polygonscan.com'
            : 'https://amoy.polygonscan.com';
        return `${baseUrl}/tx/${txHash}`;
    };

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-600 dark:bg-slate-600/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                    <AlertCircle className="mx-auto mb-4 text-slate-600" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Please Login First
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        You need to login with Web3Auth to access your deposit address
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-black" size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Deposit Funds
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Add USDC to your wallet to use on the platform
                </p>
            </div>

            {/* Balance Card */}
            <div className="bg-black dark:bg-white rounded-2xl p-6 text-white dark:text-black shadow-lg">
                <div className="text-sm opacity-90 mb-1">Current Balance</div>
                <div className="text-4xl font-bold">${balance.toFixed(2)} USDC</div>
            </div>

            {/* Deposit Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Deposit Address
                </h2>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-lg">
                        <QRCode value={depositInfo?.address || ''} size={200} />
                    </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Wallet Address (Polygon Network)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={depositInfo?.address || ''}
                            readOnly
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-sm"
                            onClick={(e) => e.target.select()}
                        />
                        <button
                            onClick={copyAddress}
                            className="px-4 py-3 bg-black hover:bg-black text-white rounded-lg flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check size={20} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={20} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Network Info */}
                <div className="bg-black dark:bg-black/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex gap-2">
                        <AlertCircle className="text-black dark:text-black flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm">
                            <p className="font-medium text-black dark:text-black mb-1">
                                Important: Only send USDC on Polygon Network!
                            </p>
                            <p className="text-black dark:text-black">
                                Sending on other networks (Ethereum, BSC, etc.) will result in permanent loss of funds.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        How to Deposit:
                    </h3>
                    {depositInfo?.instructions?.steps?.map((step) => (
                        <div key={step.step} className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                                {step.step}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    {step.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommended Exchanges */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Recommended Exchanges:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {depositInfo?.instructions?.exchanges?.map((exchange) => (

                            <a key={exchange.name}
                                href={exchange.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {exchange.name}
                                </span>
                                {
                                    exchange.recommended && (
                                        <span className="text-xs bg-slate-800 dark:bg-slate-800 text-slate-800 dark:text-slate-800 px-2 py-1 rounded">
                                            Recommended
                                        </span>
                                    )
                                }
                                < ExternalLink size={16} className="text-gray-400" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deposit History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Deposit History
                </h2>

                {depositHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No deposits yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {depositHistory.map((deposit) => (
                            <div
                                key={deposit.id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-slate-800" size={24} />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            +${deposit.amountUSD.toFixed(2)} USDC
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(deposit.confirmedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <a href={getExplorerUrl(deposit.web3TxHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-black text-sm flex items-center gap-1"
                                >
                                    View
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}