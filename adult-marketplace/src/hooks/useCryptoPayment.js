import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// USDC ABI (minimal)
const USDC_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
];

// PaymentSplitter ABI (minimal)
const PAYMENT_SPLITTER_ABI = [
    {
        name: 'pay',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'creator', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'orderId', type: 'string' },
        ],
        outputs: [],
    },
];

export const useCryptoPayment = () => {
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState('idle'); // 'idle', 'creating', 'approving', 'paying', 'confirming', 'success'
    const [currentPayment, setCurrentPayment] = useState(null);

    /**
     * Create payment order
     */
    const createPaymentOrder = useCallback(async (paymentData) => {
        try {
            setCurrentStep('creating');
            setError(null);

            const response = await axios.post(
                `${API_URL}/payments/crypto/create-order`,
                paymentData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            const order = response.data.data;
            setCurrentPayment(order);
            
            return order;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, []);

    /**
     * Approve USDC spending
     */
    const approveUSDC = useCallback(async (order) => {
        try {
            setCurrentStep('approving');
            setError(null);

            const amount = parseUnits(order.amountUSDC, 6);

            // Approve USDC
            const hash = await writeContractAsync({
                address: order.usdcAddress,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [order.contractAddress, amount],
            });

            return hash;
        } catch (err) {
            console.error('Approve error:', err);
            setError(err.message);
            throw err;
        }
    }, [writeContractAsync]);

    /**
     * Execute payment
     */
    const executePayment = useCallback(async (order) => {
        try {
            setCurrentStep('paying');
            setError(null);

            const amount = parseUnits(order.amountUSDC, 6);

            // Call pay() on contract
            const hash = await writeContractAsync({
                address: order.contractAddress,
                abi: PAYMENT_SPLITTER_ABI,
                functionName: 'pay',
                args: [
                    order.creatorWallet,
                    amount,
                    order.orderId,
                ],
            });

            return hash;
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message);
            throw err;
        }
    }, [writeContractAsync]);

    /**
     * Verify payment with backend
     */
    const verifyPayment = useCallback(async (paymentId, txHash) => {
        try {
            await axios.post(
                `${API_URL}/payments/crypto/verify`,
                { paymentId, txHash },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
        } catch (err) {
            console.error('Verify error:', err);
            // Non-critical, backend will catch it via webhook
        }
    }, []);

    /**
     * Complete payment flow
     */
    const processPayment = useCallback(async (paymentData) => {
        if (!isConnected || !address) {
            throw new Error('Please connect your wallet first');
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Create order
            const order = await createPaymentOrder(paymentData);

            // 2. Approve USDC
            const approvalHash = await approveUSDC(order);
            
            // Wait for approval confirmation (optional, can skip for better UX)
            // await waitForTransactionReceipt({ hash: approvalHash });

            // 3. Execute payment
            const paymentHash = await executePayment(order);

            // 4. Verify with backend
            await verifyPayment(order.paymentId, paymentHash);

            setCurrentStep('confirming');

            return {
                paymentId: order.paymentId,
                txHash: paymentHash,
            };

        } catch (err) {
            setError(err.message);
            setCurrentStep('idle');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isConnected, address, createPaymentOrder, approveUSDC, executePayment, verifyPayment]);

    /**
     * Check payment status
     */
    const checkPaymentStatus = useCallback(async (paymentId) => {
        try {
            const response = await axios.get(
                `${API_URL}/payments/crypto/${paymentId}/status`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            return response.data.data;
        } catch (err) {
            console.error('Status check error:', err);
            throw err;
        }
    }, []);

    /**
     * Poll status until complete
     */
    const pollPaymentStatus = useCallback(async (paymentId, onUpdate) => {
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const status = await checkPaymentStatus(paymentId);

                    if (onUpdate) {
                        onUpdate(status);
                    }

                    if (status.status === 'COMPLETED') {
                        clearInterval(interval);
                        setCurrentStep('success');
                        resolve(status);
                    }

                    if (['FAILED', 'EXPIRED'].includes(status.status)) {
                        clearInterval(interval);
                        reject(new Error(`Payment ${status.status.toLowerCase()}`));
                    }

                    attempts++;
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('Payment timeout'));
                    }
                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 5000);
        });
    }, [checkPaymentStatus]);

    return {
        // State
        loading,
        error,
        currentStep,
        currentPayment,
        isConnected,
        userAddress: address,

        // Methods
        processPayment,
        checkPaymentStatus,
        pollPaymentStatus,
        createPaymentOrder,
        approveUSDC,
        executePayment,
    };
};