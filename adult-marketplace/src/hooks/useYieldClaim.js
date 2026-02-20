import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';
import { YieldDistributorABI } from '../config/contractABIs';

export function useYieldClaim(tokenAddress) {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);

  // Read pending yield
  const { data: pendingYieldData, refetch } = useReadContract({
    address: CONTRACTS.YIELD_DISTRIBUTOR,
    abi: YieldDistributorABI,
    functionName: 'getPendingYield',
    args: tokenAddress && address ? [tokenAddress, address] : undefined,
    watch: true
  });
  
  // Read pool info
  const { data: poolInfo } = useReadContract({
    address: CONTRACTS.YIELD_DISTRIBUTOR,
    abi: YieldDistributorABI,
    functionName: 'getPoolInfo',
    args: tokenAddress ? [tokenAddress] : undefined,
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
        abi: YieldDistributorABI,
        functionName: 'claimYield',
        args: [tokenAddress]
      });

      await refetch();
      toast.success(`Yield claimed: ${pendingYield} ETH`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Claim failed:', error);
      toast.error(error.message || 'Claim failed', { id: toastId });
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };
  
  const claimMultiple = async (tokenAddresses) => {
    if (!address || !tokenAddresses || tokenAddresses.length === 0) {
      toast.error('Invalid parameters');
      throw new Error('Invalid parameters');
    }
    
    setIsClaiming(true);
    const toastId = toast.loading(`Claiming yield from ${tokenAddresses.length} tokens...`);
    
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.YIELD_DISTRIBUTOR,
        abi: YieldDistributorABI,
        functionName: 'claimMultiple',
        args: [tokenAddresses]
      });

      await refetch();
      toast.success(`Claimed yield from ${tokenAddresses.length} tokens!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Multiple claim failed:', error);
      toast.error(error.message || 'Claim failed', { id: toastId });
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    pendingYield,
    claimYield,
    claimMultiple,
    isClaiming,
    poolInfo: poolInfo || {
      isActive: false,
      totalYield: 0n,
      totalClaimed: 0n,
      lastDistribution: 0n
    },
    refetchYield: refetch
  };
}
