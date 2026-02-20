import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';
import { TokenFactoryABI } from '../config/contractABIs';

export function useTokenFactory() {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();
  
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
    
    try {
      // Call TokenFactory.createToken()
      const tx = await writeContractAsync({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: TokenFactoryABI,
        functionName: 'createToken',
        args: [
          name,
          symbol,
          parseEther(initialSupply.toString())
        ],
        value: launchFee || parseEther('0.01') // Use contract launch fee or default
      });

      await refetchTokens();
      toast.success(`${symbol} token created successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Token creation failed:', error);
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
      const tokens = await useReadContract({
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
      const valid = await useReadContract({
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
