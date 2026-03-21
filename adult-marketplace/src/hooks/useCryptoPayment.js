import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { useWeb3Auth } from './useWeb3Auth';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// ABIs MÍNIMAS
// ============================================

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
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
];

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

// ============================================
// MENSAGENS AMIGÁVEIS POR ETAPA
// ============================================

export const STEP_MESSAGES = {
    idle: {
        title: '',
        description: '',
        tip: '',
    },
    creating: {
        title: 'Preparando seu pagamento...',
        description: 'Estamos configurando tudo para você.',
        tip: 'Isso leva apenas alguns segundos.',
    },
    checking: {
        title: 'Verificando sua carteira...',
        description: 'Checando saldo e permissões.',
        tip: 'Estamos confirmando que você tem USDC suficiente.',
    },
    approving: {
        title: 'Autorizando pagamento...',
        description: 'Aprovando o uso do seu USDC para este pagamento.',
        tip: '🔐 Isso é seguro e necessário apenas uma vez por valor.',
    },
    paying: {
        title: 'Processando pagamento...',
        description: 'A transação está sendo enviada para a blockchain.',
        tip: '⚡ A taxa de rede é de apenas alguns centavos.',
    },
    confirming: {
        title: 'Confirmando na blockchain...',
        description: 'Sua transação foi enviada e está sendo confirmada.',
        tip: '⏱ Normalmente leva menos de 30 segundos na Polygon.',
    },
    success: {
        title: 'Pagamento realizado! 🎉',
        description: 'Tudo certo! O conteúdo já está disponível.',
        tip: '',
    },
    error: {
        title: 'Algo deu errado',
        description: 'Tente novamente ou use outra forma de pagamento.',
        tip: '',
    },
};

// ============================================
// HOOK PRINCIPAL — Web3Auth Wallet (sem MetaMask)
// ============================================

export const useCryptoPayment = () => {
    const { provider: web3authProvider, address: walletAddress, isConnected: walletConnected } = useWeb3Auth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState('idle');
    const [currentPayment, setCurrentPayment] = useState(null);
    const [usdcBalance, setUsdcBalance] = useState(null);

    // ============================================
    // PROVIDER & SIGNER (via Web3Auth — sem MetaMask)
    // ============================================

    const getProviderAndSigner = useCallback(async () => {
        if (!web3authProvider) {
            throw new Error('Carteira não conectada. Faça login primeiro.');
        }

        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();

        return { provider: ethersProvider, signer, address };
    }, [web3authProvider]);

    // ============================================
    // VERIFICAR SALDO USDC
    // ============================================

    const checkUSDCBalance = useCallback(async (usdcAddress, userAddr, requiredAmount) => {
        setCurrentStep('checking');
        const { provider } = await getProviderAndSigner();

        const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);
        const balance = await usdcContract.balanceOf(userAddr);
        const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6));

        setUsdcBalance(balanceFormatted);

        if (balance < requiredAmount) {
            throw new Error(
                `Saldo insuficiente de USDC. Você tem $${balanceFormatted.toFixed(2)} mas precisa de $${ethers.formatUnits(requiredAmount, 6)}.`
            );
        }

        return balance;
    }, [getProviderAndSigner]);

    // ============================================
    // CRIAR ORDEM
    // ============================================

    const createPaymentOrder = useCallback(async (paymentData) => {
        setCurrentStep('creating');
        setError(null);

        try {
            const response = await axios.post(
                `${API_URL}/api/v1/crypto-payment/crypto/create-order`,
                paymentData,
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` } }
            );

            const order = response.data.data;
            setCurrentPayment(order);
            return order;

        } catch (err) {
            const message = err.response?.data?.message || 'Falha ao criar pagamento';
            setError(message);
            throw new Error(message);
        }
    }, []);

    // ============================================
    // APROVAR USDC
    // ============================================

    const approveUSDC = useCallback(async (order) => {
        try {
            const { signer, address } = await getProviderAndSigner();

            const usdcContract = new ethers.Contract(order.usdcAddress, USDC_ABI, signer);
            const requiredAmount = ethers.parseUnits(order.amountUSDC, 6);

            // Verifica allowance atual
            const currentAllowance = await usdcContract.allowance(address, order.contractAddress);

            if (currentAllowance >= requiredAmount) {
                return null; // Já tem permissão suficiente
            }

            setCurrentStep('approving');

            const tx = await usdcContract.approve(order.contractAddress, requiredAmount);
            await tx.wait();

            return tx.hash;

        } catch (err) {
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                throw new Error('Aprovação cancelada.');
            }
            throw new Error(err.reason || err.message || 'Falha na aprovação do USDC');
        }
    }, [getProviderAndSigner]);

    // ============================================
    // EXECUTAR PAGAMENTO
    // ============================================

    const executePayment = useCallback(async (order) => {
        try {
            setCurrentStep('paying');

            const { signer } = await getProviderAndSigner();
            const paymentContract = new ethers.Contract(
                order.contractAddress,
                PAYMENT_SPLITTER_ABI,
                signer
            );

            const amount = ethers.parseUnits(order.amountUSDC, 6);

            const tx = await paymentContract.pay(
                order.creatorWallet,
                amount,
                order.orderId
            );

            setCurrentStep('confirming');
            await tx.wait();

            return tx.hash;

        } catch (err) {
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                throw new Error('Pagamento cancelado.');
            }
            throw new Error(err.reason || err.message || 'Falha no pagamento');
        }
    }, [getProviderAndSigner]);

    // ============================================
    // VERIFICAR COM BACKEND
    // ============================================

    const verifyWithBackend = useCallback(async (paymentId, txHash) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/v1/crypto-payment/crypto/verify`,
                { paymentId, txHash },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` } }
            );
            return response.data;
        } catch {
            // Não crítico — o webhook confirmará
            return null;
        }
    }, []);

    // ============================================
    // FLUXO COMPLETO DE PAGAMENTO
    // ============================================

    const processPayment = useCallback(async (paymentData) => {
        try {
            setLoading(true);
            setError(null);

            if (!web3authProvider) {
                throw new Error('Carteira não conectada. Faça login para continuar.');
            }

            const { address } = await getProviderAndSigner();

            // 1. Cria ordem
            const order = await createPaymentOrder(paymentData);

            // 2. Verifica saldo USDC
            const requiredAmount = ethers.parseUnits(order.amountUSDC, 6);
            await checkUSDCBalance(order.usdcAddress, address, requiredAmount);

            // 3. Aprova USDC (se necessário)
            await approveUSDC(order);

            // 4. Executa pagamento
            const txHash = await executePayment(order);

            // 5. Notifica backend
            await verifyWithBackend(order.paymentId, txHash);

            setCurrentStep('success');
            return { paymentId: order.paymentId, txHash, orderId: order.orderId };

        } catch (err) {
            setError(err.message);
            setCurrentStep('error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [web3authProvider, getProviderAndSigner, createPaymentOrder, checkUSDCBalance, approveUSDC, executePayment, verifyWithBackend]);

    // ============================================
    // POLLING DE STATUS
    // ============================================

    const checkPaymentStatus = useCallback(async (paymentId) => {
        const response = await axios.get(
            `${API_URL}/api/v1/crypto-payment/crypto/${paymentId}/status`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` } }
        );
        return response.data.data;
    }, []);

    const pollPaymentStatus = useCallback(async (paymentId, onUpdate) => {
        const maxAttempts = 60;
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    attempts++;
                    const status = await checkPaymentStatus(paymentId);

                    if (onUpdate) onUpdate(status);

                    if (status.status === 'COMPLETED') {
                        clearInterval(interval);
                        setCurrentStep('success');
                        resolve(status);
                    }

                    if (['FAILED', 'EXPIRED'].includes(status.status)) {
                        clearInterval(interval);
                        reject(new Error(`Pagamento ${status.status === 'FAILED' ? 'falhou' : 'expirou'}`));
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('Tempo esgotado. Verifique a transação no explorador da blockchain.'));
                    }

                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 5000);
        });
    }, [checkPaymentStatus]);

    // ============================================
    // CONECTAR CARTEIRA (noop — Web3Auth já conecta)
    // ============================================

    const connectWallet = useCallback(async () => {
        if (!walletConnected) {
            throw new Error('Faça login para conectar sua carteira.');
        }
        return walletAddress;
    }, [walletConnected, walletAddress]);

    return {
        // Estado
        loading,
        error,
        currentStep,
        currentPayment,
        isConnected: walletConnected,
        userAddress: walletAddress,
        usdcBalance,

        // Mensagens amigáveis
        stepMessage: STEP_MESSAGES[currentStep] || STEP_MESSAGES.idle,

        // Métodos
        connectWallet,
        processPayment,
        checkPaymentStatus,
        pollPaymentStatus,
        createPaymentOrder,
        approveUSDC,
        executePayment,
        checkUSDCBalance,

        // Reset
        reset: () => {
            setError(null);
            setCurrentStep('idle');
            setCurrentPayment(null);
        },
    };
};