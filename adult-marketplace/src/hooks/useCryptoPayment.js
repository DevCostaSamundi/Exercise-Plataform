import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

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
        title: 'Autorize o pagamento na sua carteira',
        description: 'Uma janela do MetaMask vai aparecer. Clique em "Confirmar" para continuar.',
        tip: '🔐 Isso é seguro e necessário apenas uma vez por valor.',
    },
    paying: {
        title: 'Confirme o pagamento na sua carteira',
        description: 'O MetaMask vai mostrar os detalhes. Clique em "Confirmar" para pagar.',
        tip: '⚡ A taxa de rede é de apenas alguns centavos.',
    },
    confirming: {
        title: 'Processando na blockchain...',
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
// HOOK PRINCIPAL
// ============================================

export const useCryptoPayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState('idle');
    const [currentPayment, setCurrentPayment] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState(null);
    const [usdcBalance, setUsdcBalance] = useState(null);

    // Verifica conexão ao montar (sem popup)
    useEffect(() => {
        checkConnectionSilently();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            setIsConnected(false);
            setUserAddress(null);
            setUsdcBalance(null);
        } else {
            setIsConnected(true);
            setUserAddress(accounts[0]);
        }
    };

    const checkConnectionSilently = async () => {
        if (!window.ethereum) return;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts?.length > 0) {
                setIsConnected(true);
                setUserAddress(accounts[0]);
            }
        } catch {
            // Silenciosamente ignora — esperado quando não conectado
        }
    };

    // ============================================
    // CONECTAR CARTEIRA
    // ============================================

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            throw new Error('MetaMask não encontrado. Instale a extensão para continuar.');
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (!accounts?.length) {
                throw new Error('Nenhuma conta encontrada na carteira');
            }

            setIsConnected(true);
            setUserAddress(accounts[0]);
            return accounts[0];

        } catch (err) {
            if (err.code === 4001) {
                throw new Error('Você recusou a conexão. Aprove no MetaMask para continuar.');
            }
            throw err;
        }
    }, []);

    // ============================================
    // VERIFICAR REDE (Polygon)
    // ============================================

    const ensurePolygonNetwork = useCallback(async () => {
        if (!window.ethereum) return;

        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);

        const expectedChainId = import.meta.env.VITE_NETWORK === 'polygon' ? 137 : 80002;
        const networkName = expectedChainId === 137 ? 'Polygon' : 'Polygon Amoy (Testnet)';

        if (chainId !== expectedChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    // Rede não adicionada — adiciona automaticamente
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${expectedChainId.toString(16)}`,
                            chainName: networkName,
                            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                            rpcUrls: [import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'],
                            blockExplorerUrls: [
                                expectedChainId === 137
                                    ? 'https://polygonscan.com'
                                    : 'https://amoy.polygonscan.com',
                            ],
                        }],
                    });
                } else {
                    throw new Error(`Por favor, troque a rede para ${networkName} no MetaMask.`);
                }
            }
        }
    }, []);

    // ============================================
    // PROVIDER & SIGNER
    // ============================================

    const getProviderAndSigner = useCallback(async () => {
        if (!window.ethereum) {
            throw new Error('Carteira não encontrada. Por favor, instale o MetaMask.');
        }

        let accounts = await window.ethereum.request({ method: 'eth_accounts' });

        if (!accounts?.length) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }

        if (!accounts?.length) {
            throw new Error('Conecte sua carteira para continuar.');
        }

        await ensurePolygonNetwork();

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        return { provider, signer, address: accounts[0] };
    }, [ensurePolygonNetwork]);

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
                `${API_URL}/payments/crypto/create-order`,
                paymentData,
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('flow_connect_token')}` } }
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
                throw new Error('Aprovação cancelada. Você precisa aprovar para continuar.');
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
                throw new Error('Pagamento cancelado. Confirme a transação no MetaMask para continuar.');
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
                `${API_URL}/payments/crypto/verify`,
                { paymentId, txHash },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('flow_connect_token')}` } }
            );
            return response.data;
        } catch {
            // Não crítico — o webhook do Alchemy fará a confirmação
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

            if (!window.ethereum) {
                throw new Error('Instale o MetaMask para pagar com cripto.');
            }

            const { address } = await getProviderAndSigner();
            setIsConnected(true);
            setUserAddress(address);

            // 1. Cria ordem
            const order = await createPaymentOrder(paymentData);

            // 2. Verifica saldo USDC
            const requiredAmount = ethers.parseUnits(order.amountUSDC, 6);
            await checkUSDCBalance(order.usdcAddress, address, requiredAmount);

            // 3. Aprova USDC (se necessário)
            await approveUSDC(order);

            // 4. Executa pagamento
            const txHash = await executePayment(order);

            // 5. Notifica backend (opcional — webhook fará o trabalho real)
            await verifyWithBackend(order.paymentId, txHash);

            return { paymentId: order.paymentId, txHash, orderId: order.orderId };

        } catch (err) {
            setError(err.message);
            setCurrentStep('error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getProviderAndSigner, createPaymentOrder, checkUSDCBalance, approveUSDC, executePayment, verifyWithBackend]);

    // ============================================
    // POLLING DE STATUS
    // ============================================

    const checkPaymentStatus = useCallback(async (paymentId) => {
        const response = await axios.get(
            `${API_URL}/payments/crypto/${paymentId}/status`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('flow_connect_token')}` } }
        );
        return response.data.data;
    }, []);

    const pollPaymentStatus = useCallback(async (paymentId, onUpdate) => {
        const maxAttempts = 60; // 5 minutos
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
            }, 5000); // A cada 5 segundos
        });
    }, [checkPaymentStatus]);

    // ============================================
    // URL DE FIAT ON-RAMP
    // ============================================

    const getOnRampUrl = useCallback(async ({ provider = 'moonpay', amountUSD, walletAddress }) => {
        try {
            const response = await axios.get(`${API_URL}/payments/crypto/onramp-url`, {
                params: { provider, amountUSD, walletAddress },
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('flow_connect_token')}` },
            });
            return response.data.data.url;
        } catch (err) {
            throw new Error('Não foi possível gerar o link de compra com cartão');
        }
    }, []);

    return {
        // Estado
        loading,
        error,
        currentStep,
        currentPayment,
        isConnected,
        userAddress,
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
        getOnRampUrl,

        // Reset
        reset: () => {
            setError(null);
            setCurrentStep('idle');
            setCurrentPayment(null);
        },
    };
};