import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createWeb3AuthInstance } from '../config/web3auth.config.js';
import { ethers } from 'ethers';
import axios from 'axios';

const Web3AuthContext = createContext(null);

export const Web3AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [address, setAddress] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authToken, setAuthToken] = useState(localStorage.getItem('token'));

    // Initialize Web3Auth
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                console.log('🔄 Initializing Web3Auth...');

                const web3authInstance = createWeb3AuthInstance();

                if (!web3authInstance) {
                    console.warn('⚠️ Web3Auth instance not available. Initialization skipped.');
                    setLoading(false);
                    return;
                }

                // ✅ CORRIGIDO: v8 usa init() ao invés de initModal()
                await web3authInstance.init();

                setWeb3auth(web3authInstance);
                setIsInitialized(true);
                console.log('✅ Web3Auth initialized');

                // Check if already connected
                if (web3authInstance.connected) {
                    console.log('🔗 Already connected, restoring session...');
                    await handleConnectedState(web3authInstance);
                }
            } catch (err) {
                console.error('❌ Web3Auth initialization error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Handle connected state
    const handleConnectedState = async (web3authInstance) => {
        try {
            const web3Provider = web3authInstance.provider;

            if (!web3Provider) {
                console.error('❌ No provider available');
                return;
            }

            setProvider(web3Provider);

            // Get user info from Web3Auth
            const info = await web3authInstance.getUserInfo();
            setUserInfo(info);

            // Get wallet address
            const ethersProvider = new ethers.BrowserProvider(web3Provider);
            const signer = await ethersProvider.getSigner();
            const userAddress = await signer.getAddress();
            setAddress(userAddress);
            setIsConnected(true);

            console.log('✅ Web3Auth connected:', {
                email: info.email,
                address: userAddress,
                provider: info.typeOfLogin,
            });

            // Auto-login to backend
            try {
                await loginToBackend(web3authInstance, userAddress);
            } catch (err) {
                console.warn('⚠️ Backend login failed:', err.message);
                // Continue anyway - user is still connected to Web3Auth
            }
        } catch (err) {
            console.error('❌ Error handling connected state:', err);
            setError(err.message);
        }
    };

    // Login to backend
    const loginToBackend = async (web3authInstance, walletAddress) => {
        try {
            const idToken = await web3authInstance.authenticateUser();

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/web3auth/login`,
                {
                    idToken: idToken.idToken,
                    walletAddress,
                }
            );

            const { token, user } = response.data.data;

            // Store token
            localStorage.setItem('token', token);
            setAuthToken(token);

            console.log('✅ Logged in to backend:', user.email);

            return { token, user };
        } catch (err) {
            console.error('❌ Backend login error:', err);
            throw err;
        }
    };

    // Login
    const login = useCallback(async () => {
        if (!web3auth) {
            throw new Error('Web3Auth not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            console.log('🔐 Starting Web3Auth login...');

            // ✅ CORRIGIDO: v8 usa connect() que retorna o provider
            const web3Provider = await web3auth.connect();

            if (!web3Provider) {
                throw new Error('Failed to connect - no provider returned');
            }

            await handleConnectedState(web3auth);

            return {
                address,
                userInfo,
            };
        } catch (err) {
            console.error('❌ Login error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [web3auth, address, userInfo]);

    // Logout
    const logout = useCallback(async () => {
        if (!web3auth) return;

        try {
            console.log('🔓 Logging out...');
            await web3auth.logout();

            setProvider(null);
            setAddress('');
            setUserInfo(null);
            setIsConnected(false);

            localStorage.removeItem('token');
            setAuthToken(null);

            console.log('✅ Logged out');
        } catch (err) {
            console.error('❌ Logout error:', err);
            setError(err.message);
        }
    }, [web3auth]);

    // Get balance (MATIC)
    const getBalance = useCallback(async () => {
        if (!provider || !address) return '0';

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const balance = await ethersProvider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (err) {
            console.error('❌ Get balance error:', err);
            return '0';
        }
    }, [provider, address]);

    // Get USDC balance
    const getUSDCBalance = useCallback(async () => {
        if (!provider || !address) return '0';

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;

            if (!usdcAddress) {
                console.warn('⚠️ USDC address not configured');
                return '0';
            }

            const usdcContract = new ethers.Contract(
                usdcAddress,
                ['function balanceOf(address) view returns (uint256)'],
                ethersProvider
            );

            const balance = await usdcContract.balanceOf(address);
            return ethers.formatUnits(balance, 6); // USDC has 6 decimals
        } catch (err) {
            console.error('❌ Get USDC balance error:', err);
            return '0';
        }
    }, [provider, address]);

    // Sign message
    const signMessage = useCallback(async (message) => {
        if (!provider) {
            throw new Error('Provider not available');
        }

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const signature = await signer.signMessage(message);
            return signature;
        } catch (err) {
            console.error('❌ Sign message error:', err);
            throw err;
        }
    }, [provider]);

    // Send transaction
    const sendTransaction = useCallback(async (tx) => {
        if (!provider) {
            throw new Error('Provider not available');
        }

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const transaction = await signer.sendTransaction(tx);
            return transaction;
        } catch (err) {
            console.error('❌ Send transaction error:', err);
            throw err;
        }
    }, [provider]);

    const value = {
        // State
        web3auth,
        provider,
        address,
        userInfo,
        isConnected,
        isInitialized,
        loading,
        error,
        authToken,

        // Methods
        login,
        logout,
        getBalance,
        getUSDCBalance,
        signMessage,
        sendTransaction,
    };

    return (
        <Web3AuthContext.Provider value={value}>
            {children}
        </Web3AuthContext.Provider>
    );
};

// Hook to use Web3Auth
export const useWeb3Auth = () => {
    const context = useContext(Web3AuthContext);
    if (!context) {
        throw new Error('useWeb3Auth must be used within Web3AuthProvider');
    }
    return context;
};