import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

/**
 * Web3Auth Service
 * Verifies identity tokens from Web3Auth v10 using JWKS
 * No extra dependencies — uses native fetch + jsonwebtoken
 */

const JWKS_URL = 'https://api-auth.web3auth.io/jwks';

// Cache JWKS keys for 10 minutes
let jwksCache = null;
let jwksCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Fetch JWKS from Web3Auth
 */
async function fetchJwks() {
    const now = Date.now();
    if (jwksCache && (now - jwksCacheTime) < CACHE_DURATION) {
        return jwksCache;
    }

    const response = await fetch(JWKS_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }

    jwksCache = await response.json();
    jwksCacheTime = now;
    return jwksCache;
}

/**
 * Convert a JWK to PEM format for jsonwebtoken verification
 */
function jwkToPem(jwk) {
    if (jwk.kty === 'EC') {
        // For EC keys, use crypto.createPublicKey
        const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        return keyObject.export({ type: 'spki', format: 'pem' });
    } else if (jwk.kty === 'RSA') {
        const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        return keyObject.export({ type: 'spki', format: 'pem' });
    }
    throw new Error(`Unsupported key type: ${jwk.kty}`);
}

/**
 * Verify a Web3Auth identity token
 */
async function verifyWeb3AuthJwt(token) {
    // Decode header to get kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
        throw new Error('Invalid JWT format');
    }

    const { kid, alg } = decoded.header;

    // Fetch JWKS and find matching key
    const jwks = await fetchJwks();
    const jwk = jwks.keys.find(k => k.kid === kid);

    if (!jwk) {
        // Try refreshing cache
        jwksCache = null;
        const freshJwks = await fetchJwks();
        const freshKey = freshJwks.keys.find(k => k.kid === kid);
        if (!freshKey) {
            throw new Error(`No matching key found for kid: ${kid}`);
        }
        const pem = jwkToPem(freshKey);
        return jwt.verify(token, pem, { algorithms: [alg] });
    }

    const pem = jwkToPem(jwk);
    return jwt.verify(token, pem, { algorithms: [alg] });
}

class Web3AuthService {
    constructor() {
        this.clientId = process.env.WEB3AUTH_CLIENT_ID;
        this.network = process.env.WEB3AUTH_NETWORK || 'sapphire_mainnet';

        if (this.clientId && this.clientId !== 'your_web3auth_client_id') {
            logger.info('✅ Web3Auth service initialized (JWKS verification)');
        } else {
            logger.warn('⚠️ Web3Auth not configured');
        }
    }

    /**
     * Verify JWT token from Web3Auth using JWKS endpoint
     * @param {string} idToken - JWT from frontend getIdentityToken()
     */
    async verifyToken(idToken) {
        try {
            const payload = await verifyWeb3AuthJwt(idToken);

            logger.info('Token verified via JWKS:', {
                email: payload.email,
                name: payload.name,
            });

            return {
                valid: true,
                email: payload.email,
                name: payload.name,
                profileImage: payload.profileImage || payload.picture,
                verifier: payload.verifier,
                verifierId: payload.verifierId || payload.email,
                typeOfLogin: payload.typeOfLogin || payload.authConnection || 'unknown',
            };
        } catch (error) {
            logger.error('Token verification failed:', error.message);
            return {
                valid: false,
                error: error.message,
            };
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
        return `PrideConnect Wallet Verification\n\nUser ID: ${userId}\nNonce: ${nonce}\nTimestamp: ${Date.now()}\n\nSign this message to prove you own this wallet.`;
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