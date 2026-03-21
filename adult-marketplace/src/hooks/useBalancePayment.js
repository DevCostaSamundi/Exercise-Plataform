import { useState, useCallback } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const useBalancePayment = () => {
    const { authToken } = useWeb3Auth();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0);

    /**
     * Check if user has sufficient balance
     */
    const checkBalance = useCallback(async (amount) => {
        try {
            const res = await axios.post(
                // ✅ CORRIGIDO: rota correcta com /api/v1/
                `${API_URL}/api/v1/auth/wallet/check-balance`,
                { amount },
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            return res.data.data;
        } catch (err) {
            console.error('Check balance error:', err);
            throw err;
        }
    }, [authToken]);

    /**
     * Pay using balance
     */
    const payWithBalance = useCallback(async (paymentData) => {
        try {
            setLoading(true);
            setError(null);

            // 1. Check balance first
            const balanceCheck = await checkBalance(paymentData.amountUSD);

            if (!balanceCheck.valid) {
                throw new Error(balanceCheck.message);
            }

            // 2. Create payment order
            // ✅ CORRIGIDO: rota correcta — era /payments/balance/create
            const res = await axios.post(
                `${API_URL}/api/v1/crypto-payment/balance/create-payment`,
                paymentData,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            return res.data.data;

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [authToken, checkBalance]);

    /**
     * Get current balance
     */
    const getBalance = useCallback(async () => {
        try {
            // ✅ CORRIGIDO: rota correcta com /api/v1/
            const res = await axios.get(
                `${API_URL}/api/v1/auth/wallet/balance`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            const balanceData = res.data.data;
            setBalance(balanceData.balance);
            return balanceData;
        } catch (err) {
            console.error('Get balance error:', err);
            throw err;
        }
    }, [authToken]);

    return {
        loading,
        error,
        balance,
        checkBalance,
        payWithBalance,
        getBalance,
    };
};