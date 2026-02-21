import { Web3Auth } from '@web3auth/node-sdk';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

/**
 * Web3Auth Service
 * Handles social login → invisible wallet creation
 */
class Web3AuthService {
    constructor() {
        this.clientId = process.env.WEB3AUTH_CLIENT_ID;
        this.network = process.env.WEB3AUTH_NETWORK || 'sapphire_mainnet';

        if (this.clientId && this.clientId !== 'your_web3auth_client_id') {
            this.web3auth = new Web3Auth({
                clientId: this.clientId,
                web3AuthNetwork: this.network,
            });

            logger.info('✅ Web3Auth service initialized');
        } else {
            logger.warn('⚠️ Web3Auth not configured');
        }
    }

    /**
     * Verify JWT token from Web3Auth
     * @param {string} idToken - JWT from frontend
     */
    async verifyToken(idToken) {
        try {
            if (!this.web3auth) {
                throw new Error('Web3Auth not initialized');
            }

            // Verify the JWT
            const userInfo = await this.web3auth.authenticateUser(idToken);

            logger.info('Token verified:', {
                email: userInfo.email,
                name: userInfo.name,
            });

            return {
                valid: true,
                email: userInfo.email,
                name: userInfo.name,
                profileImage: userInfo.profileImage,
                verifier: userInfo.verifier,
                verifierId: userInfo.verifierId,
                typeOfLogin: userInfo.typeOfLogin,
            };
        } catch (error) {
            logger.error('Token verification failed:', error);
            return {
                valid: false,
                error: error.message,
            };
        }
    }

    /**
     * Derive wallet address from Web3Auth user info
     * Note: In practice, this comes from the frontend
     * This is a helper for validation
     */
    deriveWalletAddress(publicKey) {
        try {
            // Public key from Web3Auth is in hex format
            const wallet = new ethers.Wallet(publicKey);
            return wallet.address;
        } catch (error) {
            logger.error('Error deriving wallet:', error);
            return null;
        }
    }

    /**
     * Validate that a wallet address matches the expected format
     */
    isValidAddress(address) {
        return ethers.isAddress(address);
    }

    /**
     * Generate message for wallet ownership verification
     */
    generateVerificationMessage(userId, nonce) {
        return `Launchpad Wallet Verification\n\nUser ID: ${userId}\nNonce: ${nonce}\nTimestamp: ${Date.now()}\n\nSign this message to prove you own this wallet.`;
    }

    /**
     * Verify signature to prove wallet ownership
     */
    async verifyWalletOwnership(message, signature, expectedAddress) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            
            const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

            if (!isValid) {
                logger.warn('Wallet ownership verification failed:', {
                    expected: expectedAddress,
                    recovered: recoveredAddress,
                });
            }

            return isValid;
        } catch (error) {
            logger.error('Signature verification error:', error);
            return false;
        }
    }

    /**
     * Map Web3Auth provider to our system
     */
    mapProvider(typeOfLogin) {
        const providerMap = {
            google: 'GOOGLE',
            facebook: 'FACEBOOK',
            twitter: 'TWITTER',
            discord: 'DISCORD',
            apple: 'APPLE',
            github: 'GITHUB',
            linkedin: 'LINKEDIN',
            email_passwordless: 'EMAIL',
            jwt: 'CUSTOM',
        };

        return providerMap[typeOfLogin] || 'OTHER';
    }
}

export default new Web3AuthService();