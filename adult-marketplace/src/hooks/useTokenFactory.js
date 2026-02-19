import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';

export function useTokenFactory() {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const createToken = async ({ name, symbol, description, imageUrl, initialSupply }) => {
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
        abi: [
          {
            name: 'createToken',
            type: 'function',
            stateMutability: 'payable',
            inputs: [
              { name: 'name', type: 'string' },
              { name: 'symbol', type: 'string' },
              { name: 'initialSupply', type: 'uint256' },
              { name: 'metadata', type: 'string' }
            ],
            outputs: [{ name: 'tokenAddress', type: 'address' }]
          }
        ],
        functionName: 'createToken',
        args: [
          name,
          symbol,
          parseEther(initialSupply || '1000000'),
          JSON.stringify({ description, imageUrl })
        ],
        value: parseEther('0.001') // Creation fee
      });

      toast.success(`${symbol} token created successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Token creation failed:', error);
      toast.error('Token creation failed', { id: toastId });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const getRecentTokens = async (limit = 10) => {
    // TODO: Integrate with subgraph or contract events
    // For now return mock data
    return [];
  };

  const getUserTokens = async (userAddress) => {
    // TODO: Get tokens created by user
    return [];
  };

  return {
    createToken,
    getRecentTokens,
    getUserTokens,
    isCreating
  };
}
