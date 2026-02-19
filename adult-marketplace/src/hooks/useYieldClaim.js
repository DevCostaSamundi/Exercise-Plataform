import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';

export function useYieldClaim(tokenAddress) {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);

  // Read pending yield
  const { data: pendingYieldData, refetch } = useReadContract({
    address: CONTRACTS.YIELD_DISTRIBUTOR,
    abi: [
      {
        name: 'getPendingYield',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'holder', type: 'address' }
        ],
        outputs: [{ name: 'amount', type: 'uint256' }]
      }
    ],
    functionName: 'getPendingYield',
    args: tokenAddress && address ? [tokenAddress, address] : undefined,
    watch: true
  });

  const { writeContractAsync } = useWriteContract();

  const pendingYield = pendingYieldData ? formatEther(pendingYieldData) : '0';

  const claimYield = async () => {
    if (!address || !tokenAddress) {
      toast.error('Invalid parameters');
      throw new Error('Invalid parameters');
    }
    
    setIsClaiming(true);
    const toastId = toast.loading('Claiming yield...');
    
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.YIELD_DISTRIBUTOR,
        abi: [
          {
            name: 'claimYield',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'tokenAddress', type: 'address' }
            ],
            outputs: []
          }
        ],
        functionName: 'claimYield',
        args: [tokenAddress]
      });

      await refetch();
      toast.success(`Yield claimed: ${pendingYield} ETH`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Claim failed:', error);
      toast.error('Claim failed', { id: toastId });
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    pendingYield,
    claimYield,
    isClaiming,
    refetchYield: refetch
  };
}
