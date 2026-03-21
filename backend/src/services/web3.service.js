import { ethers } from 'ethers';
import web3Config, { getCurrentNetwork, getUSDCConfig } from '../config/web3.config.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Web3 Service
 * Handles all blockchain interactions
 */
class Web3Service {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.initialized = false;
    }

    /**
     * Initialize Web3 provider and contract
     */
    async initialize() {
        try {
            const network = getCurrentNetwork();

            logger.info(`Initializing Web3 service on ${network.chainName}...`);

            // Create provider
            this.provider = new ethers.JsonRpcProvider(network.rpcUrl);

            // Verify connection
            const blockNumber = await this.provider.getBlockNumber();
            logger.info(`Connected to blockchain. Current block: ${blockNumber}`);

            // Load contract ABI
            const contractABI = this.loadContractABI();

            // Create contract instance
            this.contract = new ethers.Contract(
                web3Config.contract.address,
                contractABI,
                this.provider
            );

            logger.info(`Contract loaded at: ${web3Config.contract.address}`);

            this.initialized = true;
            return true;
        } catch (error) {
            logger.error('Failed to initialize Web3 service:', error);
            throw error;
        }
    }

    /**
     * Load contract ABI from artifacts
     */
    loadContractABI() {
        try {
            // Try to load from contracts/artifacts
            const artifactPath = path.join(
                __dirname,
                '../../..',
                'contracts/artifacts/contracts/PaymentSplitter.sol/PaymentSplitter.json'
            );

            if (fs.existsSync(artifactPath)) {
                const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
                return artifact.abi;
            }

            // Fallback: minimal ABI for essential functions
            logger.warn('Contract artifact not found, using minimal ABI');
            return this.getMinimalABI();
        } catch (error) {
            logger.error('Error loading contract ABI:', error);
            return this.getMinimalABI();
        }
    }

    /**
     * Get minimal ABI for essential contract functions
     */
    getMinimalABI() {
        return [
            'event PaymentProcessed(string indexed orderId, address indexed payer, address indexed creator, uint256 totalAmount, uint256 creatorAmount, uint256 platformFee)',
            'function pay(address creator, uint256 amount, string orderId)',
            'function platformWallet() view returns (address)',
            'function platformFeePercent() view returns (uint256)',
            'function usdc() view returns (address)',
        ];
    }

    /**
     * Ensure service is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Web3 service not initialized. Call initialize() first.');
        }
    }

    /**
     * Get transaction by hash
     */
    async getTransaction(txHash) {
        this.ensureInitialized();

        try {
            const tx = await this.provider.getTransaction(txHash);
            return tx;
        } catch (error) {
            logger.error(`Error getting transaction ${txHash}:`, error);
            throw error;
        }
    }

    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(txHash) {
        this.ensureInitialized();

        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            return receipt;
        } catch (error) {
            logger.error(`Error getting transaction receipt ${txHash}:`, error);
            throw error;
        }
    }

    /**
     * Wait for transaction confirmations
     */
    async waitForConfirmations(txHash, confirmations = 2) {
        this.ensureInitialized();

        try {
            logger.info(`Waiting for ${confirmations} confirmations for tx: ${txHash}`);

            const receipt = await this.provider.waitForTransaction(txHash, confirmations);

            if (!receipt) {
                throw new Error('Transaction receipt not found');
            }

            if (receipt.status === 0) {
                throw new Error('Transaction failed on-chain');
            }

            logger.info(`Transaction ${txHash} confirmed with ${confirmations} confirmations`);

            return receipt;
        } catch (error) {
            logger.error(`Error waiting for confirmations ${txHash}:`, error);
            throw error;
        }
    }

    /**
     * Get PaymentReceived event from transaction receipt
     */
    async getPaymentEvent(txHash) {
        this.ensureInitialized();

        try {
            const receipt = await this.getTransactionReceipt(txHash);

            if (!receipt) {
                throw new Error('Transaction receipt not found');
            }

            // Parse logs to find PaymentReceived event
            const logs = receipt.logs;

            for (const log of logs) {
                try {
                    const parsedLog = this.contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });

                    if (parsedLog && parsedLog.name === 'PaymentProcessed') {
                        return {
                            payer: parsedLog.args.payer,
                            creator: parsedLog.args.creator,
                            orderId: parsedLog.args.orderId,
                            totalAmount: parsedLog.args.totalAmount.toString(),
                            creatorAmount: parsedLog.args.creatorAmount.toString(),
                            platformFee: parsedLog.args.platformFee.toString(),
                        };
                    }
                } catch (e) {
                    // Skip logs that don't match our contract
                    continue;
                }
            }

            throw new Error('PaymentReceived event not found in transaction');
        } catch (error) {
            logger.error(`Error getting payment event from ${txHash}:`, error);
            throw error;
        }
    }

    /**
     * Verify payment on-chain
     */
    async verifyPayment(txHash, expectedAmount, creatorAddress) {
        this.ensureInitialized();

        try {
            logger.info(`Verifying payment: ${txHash}`);

            // Get transaction receipt
            const receipt = await this.getTransactionReceipt(txHash);

            if (!receipt) {
                return {
                    valid: false,
                    error: 'Transaction not found',
                };
            }

            if (receipt.status === 0) {
                return {
                    valid: false,
                    error: 'Transaction failed',
                };
            }

            // Get payment event
            const event = await this.getPaymentEvent(txHash);

            // Verify creator address
            if (event.creator.toLowerCase() !== creatorAddress.toLowerCase()) {
                return {
                    valid: false,
                    error: 'Creator address mismatch',
                };
            }

            // Verify amount (convert to USDC decimals - 6)
            const expectedAmountWei = ethers.parseUnits(expectedAmount.toString(), 6);
            const actualAmount = BigInt(event.totalAmount);

            // Allow 1% tolerance for rounding
            const tolerance = expectedAmountWei / 100n;
            const diff = actualAmount > expectedAmountWei
                ? actualAmount - expectedAmountWei
                : expectedAmountWei - actualAmount;

            if (diff > tolerance) {
                return {
                    valid: false,
                    error: 'Amount mismatch',
                    expected: expectedAmountWei.toString(),
                    actual: actualAmount.toString(),
                };
            }

            logger.info(`Payment verified successfully: ${txHash}`);

            return {
                valid: true,
                event,
                receipt,
            };
        } catch (error) {
            logger.error(`Error verifying payment ${txHash}:`, error);
            return {
                valid: false,
                error: error.message,
            };
        }
    }

    /**
     * Get current block number
     */
    async getBlockNumber() {
        this.ensureInitialized();
        return await this.provider.getBlockNumber();
    }

    /**
     * Get USDC balance of an address
     */
    async getUSDCBalance(address) {
        this.ensureInitialized();

        try {
            const usdcConfig = getUSDCConfig();

            // Create USDC contract instance
            const usdcContract = new ethers.Contract(
                usdcConfig.address,
                ['function balanceOf(address) view returns (uint256)'],
                this.provider
            );

            const balance = await usdcContract.balanceOf(address);

            // Convert from wei to USDC (6 decimals)
            return ethers.formatUnits(balance, 6);
        } catch (error) {
            logger.error(`Error getting USDC balance for ${address}:`, error);
            throw error;
        }
    }

    /**
     * Calculate payment split
     */
    async calculateSplit(amount) {
        this.ensureInitialized();

        try {
            // Convert to USDC decimals (6)
            const amountWei = ethers.parseUnits(amount.toString(), 6);

            const [creatorAmount, platformFee] = await this.contract.calculateSplit(amountWei);

            return {
                creatorAmount: ethers.formatUnits(creatorAmount, 6),
                platformFee: ethers.formatUnits(platformFee, 6),
            };
        } catch (error) {
            logger.error('Error calculating split:', error);
            throw error;
        }
    }

    /**
     * Get platform wallet address from contract
     */
    async getPlatformWallet() {
        this.ensureInitialized();

        try {
            return await this.contract.platformWallet();
        } catch (error) {
            logger.error('Error getting platform wallet:', error);
            throw error;
        }
    }

    /**
     * Check if address is valid Ethereum address
     */
    isValidAddress(address) {
        return ethers.isAddress(address);
    }

    /**
     * Format USDC amount to wei (6 decimals)
     */
    formatUSDCToWei(amount) {
        return ethers.parseUnits(amount.toString(), 6);
    }

    /**
     * Format wei to USDC (6 decimals)
     */
    formatWeiToUSDC(wei) {
        return ethers.formatUnits(wei, 6);
    }
}

// Export singleton instance
const web3Service = new Web3Service();
export default web3Service;
