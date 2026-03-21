import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
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

    // ✅ Ref para evitar dupla inicialização (React StrictMode)
    const initRef = useRef(false);
    const web3authRef = useRef(null);

    // Initialize Web3Auth
    useEffect(() => {
        // Guard contra dupla inicialização do StrictMode
        if (initRef.current) return;
        initRef.current = true;

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

                await web3authInstance.init();

                web3authRef.current = web3authInstance;
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
            // ✅ v10: usar getIdentityToken() em vez de authenticateUser()
            const tokenResult = await web3authInstance.getIdentityToken();

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/auth/web3auth/login`,
                {
                    idToken: tokenResult.idToken,
                    walletAddress,
                }
            );

            const { token, user } = response.data.data;

            // Store token and user for session & redirect
            localStorage.setItem('authToken', token);
            localStorage.setItem('token', token); // backward compat
            localStorage.setItem('user', JSON.stringify(user));
            setAuthToken(token);

            console.log('✅ Logged in to backend:', user.email);

            return { token, user };
        } catch (err) {
            console.error('❌ Backend login error:', err);
            throw err;
        }
    };

    // Login with Email (more stable on devnet)
    const loginWithEmail = useCallback(async (email) => {
        if (!web3auth) {
            console.error('❌ Web3Auth not initialized yet');
            throw new Error('Web3Auth not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            console.log('🔐 Starting Email login...');

            // ✅ Use connectTo() with Email login provider
            console.log('📧 Initiating email login (redirect mode)...');
            const web3Provider = await web3auth.connectTo('email_passwordless', {
                loginHint: email,
            });

            if (!web3Provider) {
                console.error('❌ Email login returned no provider');
                throw new Error('Failed to connect - no provider returned');
            }

            console.log('✅ Provider received from email login');
            await handleConnectedState(web3auth);

            return {
                address,
                userInfo,
            };
        } catch (err) {
            console.error('❌ Email login error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [web3auth, address, userInfo]);

    // ✅ Reinitialize Web3Auth (para recuperação de erros)
    const reinitialize = useCallback(async () => {
        try {
            console.log('🔄 Re-initializing Web3Auth...');
            setLoading(true);
            setError(null);

            const web3authInstance = createWeb3AuthInstance();
            if (!web3authInstance) {
                console.warn('⚠️ Web3Auth instance not available.');
                return;
            }

            await web3authInstance.init();
            web3authRef.current = web3authInstance;
            setWeb3auth(web3authInstance);
            setIsInitialized(true);
            console.log('✅ Web3Auth re-initialized successfully');
        } catch (err) {
            console.error('❌ Web3Auth re-initialization error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Login with Social (Google/Facebook - uses modal popup)
    const login = useCallback(async () => {
        if (!web3auth) {
            console.error('❌ Web3Auth not initialized yet');
            throw new Error('Web3Auth not initialized');
        }

        try {
            setLoading(true);
            setError(null);

            console.log('🔐 Starting Web3Auth login via modal...');
            console.log('   Web3Auth state:', {
                connected: web3auth?.connected ?? 'unknown',
                status: web3auth?.status,
            });

            // ✅ v10: Usar connect() que abre o modal com todas as opções
            console.log('📱 Opening Web3Auth modal...');
            const web3Provider = await web3auth.connect();

            if (!web3Provider) {
                console.error('❌ Login returned no provider');
                throw new Error('Failed to connect - no provider returned');
            }

            console.log('✅ Provider received from login');
            await handleConnectedState(web3auth);

            return {
                address,
                userInfo,
            };
        } catch (err) {
            console.error('❌ Login error:', err);
            console.error('   Error type:', err.name);
            console.error('   Error message:', err.message);

            // ⚠️ Se houver erro, fazer logout e reinitializar
            try {
                console.log('🔧 Attempting to reset Web3Auth after error...');
                if (web3auth?.connected) {
                    await web3auth.logout();
                }
                // Re-inicializar para próxima tentativa
                await reinitialize();
            } catch (recoveryErr) {
                console.warn('⚠️ Error recovery failed:', recoveryErr);
            }

            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [web3auth, address, userInfo, reinitialize]);

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
        loginWithEmail,
        logout,
        reinitialize,
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