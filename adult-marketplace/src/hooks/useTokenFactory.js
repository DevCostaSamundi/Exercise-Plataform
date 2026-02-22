import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';
import { TokenFactoryABI } from '../config/contractABIs';

export function useTokenFactory() {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Read launch fee
  const { data: launchFee } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: TokenFactoryABI,
    functionName: 'launchFee'
  });

  // Read all tokens
  const { data: allTokens, refetch: refetchTokens } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: TokenFactoryABI,
    functionName: 'getAllTokens'
  });

  const createToken = async ({ name, symbol, initialSupply }) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    setIsCreating(true);
    const toastId = toast.loading(`Creating ${symbol} token...`);

    const feeToSend = launchFee ?? parseEther('0.001');
    console.log('[TokenFactory] createToken called:', { name, symbol, initialSupply });
    console.log('[TokenFactory] CONTRACT:', CONTRACTS.TOKEN_FACTORY);
    console.log('[TokenFactory] launchFee:', launchFee?.toString(), '→ sending:', feeToSend?.toString());

    try {
      // Step 1: Send the transaction — returns the tx hash (NOT the token address)
      console.log('[TokenFactory] Step 1: sending tx...');
      const txHash = await writeContractAsync({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: TokenFactoryABI,
        functionName: 'createToken',
        args: [
          name,
          symbol,
          parseEther(initialSupply.toString())
        ],
        value: feeToSend
      });

      console.log('[TokenFactory] Step 2: tx submitted, hash:', txHash);
      toast.loading(`Waiting for block confirmation...`, { id: toastId });

      // Step 2: Wait for receipt with a 60s timeout
      let tokenAddress = null;
      try {
        console.log('[TokenFactory] Step 3: waiting for receipt (up to 3 min)...');
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 180_000,      // 3 minutos — testnets são lentas
          pollingInterval: 3_000 // verifica a cada 3 segundos
        });

        console.log('[TokenFactory] Receipt status:', receipt.status, '| logs:', receipt.logs.length);

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted on-chain. Check contract balance/fee.');
        }

        // Step 3: Parse TokenCreated event to extract the real contract address
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: TokenFactoryABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TokenCreated' && decoded.args?.tokenAddress) {
              tokenAddress = decoded.args.tokenAddress;
              console.log('[TokenFactory] Token address found:', tokenAddress);
              break;
            }
          } catch {
            // Skip logs that don't match
          }
        }

        if (!tokenAddress) {
          console.warn('[TokenFactory] TokenCreated event not found in receipt — using tx hash as fallback');
        }
      } catch (receiptError) {
        // Receipt timeout or network error — transaction was still submitted
        console.warn('[TokenFactory] Could not get receipt:', receiptError.message);
        toast.warning('Transaction submitted but confirmation timed out. Check your portfolio.', { id: toastId });
      }

      await refetchTokens();
      toast.success(`${symbol} token created successfully!`, { id: toastId });

      // Return real address if found, else tx hash (CreateTokenPage handles both)
      return tokenAddress || txHash;
    } catch (error) {
      console.error('[TokenFactory] Token creation failed:', error);
      toast.error(error.message || 'Token creation failed', { id: toastId });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const getRecentTokens = async (limit = 10) => {
    if (!allTokens || allTokens.length === 0) return [];

    // Return last N tokens (most recent)
    return allTokens.slice(-limit).reverse();
  };

  const getUserTokens = async (userAddress) => {
    if (!userAddress) return [];

    try {
      const tokens = await publicClient.readContract({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: TokenFactoryABI,
        functionName: 'getTokensByCreator',
        args: [userAddress]
      });

      return tokens || [];
    } catch (error) {
      console.error('Failed to get user tokens:', error);
      return [];
    }
  };

  const isValidToken = async (tokenAddress) => {
    try {
      const valid = await publicClient.readContract({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: TokenFactoryABI,
        functionName: 'isValidToken',
        args: [tokenAddress]
      });

      return valid;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  };

  return {
    createToken,
    getRecentTokens,
    getUserTokens,
    isValidToken,
    isCreating,
    launchFee,
    allTokens: allTokens || [],
    refetchTokens
  };
}
