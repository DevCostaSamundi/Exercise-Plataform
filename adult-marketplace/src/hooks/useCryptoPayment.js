import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
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
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'account', type: 'address' },
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState('idle');
    const [currentPayment, setCurrentPayment] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState(null);

    // Check wallet connection on mount (silently, without requesting)
    useEffect(() => {
        checkConnectionSilently();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = (accounts) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
            setIsConnected(false);
            setUserAddress(null);
        } else {
            setIsConnected(true);
            setUserAddress(accounts[0]);
        }
    };

    const handleChainChanged = () => {
        console.log('Chain changed, reloading...');
        window.location.reload();
    };

    // Check connection silently (don't request accounts, just check)
    const checkConnectionSilently = async () => {
        if (!window.ethereum) {
            console.log('MetaMask not installed');
            return;
        }

        try {
            // Use eth_accounts which returns empty array if not connected
            // This won't trigger MetaMask popup
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                setIsConnected(true);
                setUserAddress(accounts[0]);
                console.log('✅ Wallet already connected:', accounts[0]);
            } else {
                setIsConnected(false);
                setUserAddress(null);
                console.log('ℹ️ Wallet not connected yet');
            }
        } catch (err) {
            // Silently fail - this is expected when not connected
            console.log('ℹ️ No wallet connection found');
            setIsConnected(false);
            setUserAddress(null);
        }
    };

    // Connect wallet (explicitly request connection)
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            throw new Error('MetaMask not found. Please install MetaMask.');
        }

        try {
            console.log('🔗 Requesting wallet connection...');
            
            // This WILL trigger MetaMask popup
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            setIsConnected(true);
            setUserAddress(accounts[0]);
            console.log('✅ Wallet connected:', accounts[0]);

            return accounts[0];
        } catch (err) {
            console.error('❌ Connection error:', err);
            
            // User rejected the request
            if (err.code === 4001) {
                throw new Error('Please approve the connection in MetaMask');
            }
            
            throw err;
        }
    }, []);

    // Get provider and signer from MetaMask
    const getProviderAndSigner = useCallback(async () => {
        if (!window.ethereum) {
            throw new Error('MetaMask not found. Please install MetaMask.');
        }

        // Check if already connected
        let accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // If no accounts, request connection
        if (accounts.length === 0) {
            console.log('📱 No accounts found, requesting connection...');
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }

        if (accounts.length === 0) {
            throw new Error('No accounts available. Please connect your wallet.');
        }

        const address = accounts[0];
        console.log('👛 Using account:', address);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        return { provider, signer, address };
    }, []);

    /**
     * Create payment order
     */
    const createPaymentOrder = useCallback(async (paymentData) => {
        try {
            setCurrentStep('creating');
            setError(null);

            console.log('📝 Creating payment order with data:', paymentData);

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
            console.log('✅ Order created:', order.orderId);
            setCurrentPayment(order);
            
            return order;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            console.error('❌ Create order error:', errorMsg);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, []);

    /**
     * Check current USDC allowance and balance
     */
    const checkAllowance = useCallback(async (order, userAddress) => {
        try {
            const { provider } = await getProviderAndSigner();
            
            const usdcContract = new ethers.Contract(
                order.usdcAddress,
                USDC_ABI,
                provider
            );

            // Check allowance
            const allowance = await usdcContract.allowance(
                userAddress,
                order.contractAddress
            );

            // Check USDC balance
            const balance = await usdcContract.balanceOf(userAddress);

            const requiredAmount = ethers.parseUnits(order.amountUSDC, 6);
            
            console.log('💰 USDC Balance:', ethers.formatUnits(balance, 6), 'USDC');
            console.log('✅ Current Allowance:', ethers.formatUnits(allowance, 6), 'USDC');
            console.log('📊 Required Amount:', order.amountUSDC, 'USDC');

            // Check if user has enough USDC
            if (balance < requiredAmount) {
                throw new Error(`Insufficient USDC balance. You have ${ethers.formatUnits(balance, 6)} USDC but need ${order.amountUSDC} USDC`);
            }

            return { 
                allowance, 
                balance,
                requiredAmount, 
                needsApproval: allowance < requiredAmount 
            };
        } catch (err) {
            console.error('❌ Check allowance error:', err);
            throw err;
        }
    }, [getProviderAndSigner]);

    /**
     * Approve USDC spending
     */
    const approveUSDC = useCallback(async (order) => {
        try {
            setCurrentStep('approving');
            setError(null);

            console.log('🔐 Starting USDC approval...');

            const { signer, address } = await getProviderAndSigner();
            
            // Check if approval is needed
            const { needsApproval, requiredAmount, balance } = await checkAllowance(order, address);
            
            if (!needsApproval) {
                console.log('✅ Sufficient allowance already exists, skipping approval');
                return null;
            }

            const usdcContract = new ethers.Contract(
                order.usdcAddress,
                USDC_ABI,
                signer
            );

            console.log('📝 Requesting approval for:', order.amountUSDC, 'USDC');
            console.log('📍 Spender (Payment Contract):', order.contractAddress);

            // Request approval
            const approvalAmount = requiredAmount;
            const tx = await usdcContract.approve(
                order.contractAddress,
                approvalAmount
            );

            console.log('⏳ Approval transaction sent:', tx.hash);
            console.log('⏳ Waiting for confirmation...');

            // Wait for transaction
            const receipt = await tx.wait();
            console.log('✅ Approval confirmed in block:', receipt.blockNumber);

            return tx.hash;
        } catch (err) {
            console.error('❌ Approve error:', err);
            
            // User rejected transaction
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                throw new Error('Transaction rejected. Please approve in your wallet.');
            }
            
            const errorMsg = err.reason || err.message || 'Failed to approve USDC';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [getProviderAndSigner, checkAllowance]);

    /**
     * Execute payment
     */
    const executePayment = useCallback(async (order) => {
        try {
            setCurrentStep('paying');
            setError(null);

            console.log('💸 Starting payment execution...');

            const { signer } = await getProviderAndSigner();

            const paymentContract = new ethers.Contract(
                order.contractAddress,
                PAYMENT_SPLITTER_ABI,
                signer
            );

            const amount = ethers.parseUnits(order.amountUSDC, 6);

            console.log('📝 Calling pay() with:');
            console.log('  - Creator:', order.creatorWallet);
            console.log('  - Amount:', order.amountUSDC, 'USDC');
            console.log('  - OrderId:', order.orderId);

            // Execute payment
            const tx = await paymentContract.pay(
                order.creatorWallet,
                amount,
                order.orderId
            );

            console.log('⏳ Payment transaction sent:', tx.hash);
            console.log('⏳ Waiting for confirmation...');

            // Wait for transaction
            const receipt = await tx.wait();
            console.log('✅ Payment confirmed in block:', receipt.blockNumber);

            return tx.hash;
        } catch (err) {
            console.error('❌ Payment error:', err);
            
            // User rejected transaction
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                throw new Error('Transaction rejected. Please approve in your wallet.');
            }
            
            const errorMsg = err.reason || err.message || 'Payment transaction failed';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [getProviderAndSigner]);

    /**
     * Verify payment with backend
     */
    const verifyPayment = useCallback(async (paymentId, txHash) => {
        try {
            console.log('🔍 Verifying payment with backend...');
            
            const response = await axios.post(
                `${API_URL}/payments/crypto/verify`,
                { paymentId, txHash },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            console.log('✅ Backend verification response:', response.data);
            return response.data;
        } catch (err) {
            console.error('⚠️ Verify error:', err);
            // Non-critical, backend will catch it via webhook
            return null;
        }
    }, []);

    /**
     * Complete payment flow
     */
    const processPayment = useCallback(async (paymentData) => {
        try {
            setLoading(true);
            setError(null);

            console.log('=== 🚀 Starting Payment Process ===');
            console.log('Payment data:', paymentData);

            // Check MetaMask
            if (!window.ethereum) {
                throw new Error('MetaMask not found. Please install MetaMask extension.');
            }

            // Get wallet info (will request connection if needed)
            const { address } = await getProviderAndSigner();
            console.log('👛 Connected wallet:', address);

            // Update state
            setIsConnected(true);
            setUserAddress(address);

            // 1. Create order
            console.log('\n📝 Step 1/4: Creating payment order...');
            const order = await createPaymentOrder(paymentData);
            console.log('✅ Order created:', order.orderId);

            // 2. Approve USDC (if needed)
            console.log('\n🔐 Step 2/4: Checking USDC approval...');
            const approvalHash = await approveUSDC(order);
            if (approvalHash) {
                console.log('✅ Approval successful:', approvalHash);
            } else {
                console.log('✅ Approval skipped (sufficient allowance exists)');
            }

            // 3. Execute payment
            console.log('\n💸 Step 3/4: Executing payment...');
            const paymentHash = await executePayment(order);
            console.log('✅ Payment successful:', paymentHash);

            // 4. Verify with backend
            console.log('\n🔍 Step 4/4: Verifying with backend...');
            await verifyPayment(order.paymentId, paymentHash);
            console.log('✅ Verification complete');

            setCurrentStep('confirming');

            console.log('\n=== ✅ Payment Process Complete ===\n');

            return {
                paymentId: order.paymentId,
                txHash: paymentHash,
                orderId: order.orderId,
            };

        } catch (err) {
            console.error('\n=== ❌ Payment Process Failed ===');
            console.error('Error:', err.message);
            console.error('Full error:', err);
            setError(err.message);
            setCurrentStep('idle');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getProviderAndSigner, createPaymentOrder, approveUSDC, executePayment, verifyPayment]);

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

        console.log('🔄 Starting to poll payment status...');

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    attempts++;
                    console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}`);

                    const status = await checkPaymentStatus(paymentId);
                    console.log('📊 Payment status:', status.status);

                    if (onUpdate) {
                        onUpdate(status);
                    }

                    if (status.status === 'COMPLETED') {
                        console.log('✅ Payment completed!');
                        clearInterval(interval);
                        setCurrentStep('success');
                        resolve(status);
                    }

                    if (['FAILED', 'EXPIRED'].includes(status.status)) {
                        console.log('❌ Payment failed or expired');
                        clearInterval(interval);
                        reject(new Error(`Payment ${status.status.toLowerCase()}`));
                    }

                    if (attempts >= maxAttempts) {
                        console.log('⏱️ Polling timeout');
                        clearInterval(interval);
                        reject(new Error('Payment confirmation timeout - please check your transaction manually'));
                    }
                } catch (err) {
                    console.error('❌ Polling error:', err);
                    clearInterval(interval);
                    reject(err);
                }
            }, 5000); // Poll every 5 seconds
        });
    }, [checkPaymentStatus]);

    return {
        // State
        loading,
        error,
        currentStep,
        currentPayment,
        isConnected,
        userAddress,

        // Methods
        connectWallet,
        processPayment,
        checkPaymentStatus,
        pollPaymentStatus,
        createPaymentOrder,
        approveUSDC,
        executePayment,
        checkAllowance,
    };
};