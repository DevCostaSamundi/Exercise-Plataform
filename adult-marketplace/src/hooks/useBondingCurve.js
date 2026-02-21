import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';
import { BondingCurveABI } from '../config/contractABIs';

export function useBondingCurve(tokenAddress) {
  const { address } = useAccount();
  const [isTrading, setIsTrading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Read market info
  const { data: marketInfo, refetch: refetchMarket } = useReadContract({
    address: CONTRACTS.BONDING_CURVE,
    abi: BondingCurveABI,
    functionName: 'getMarketInfo',
    args: tokenAddress ? [tokenAddress] : undefined,
    watch: true
  });

  const buyTokens = async (amount, maxSlippage = 5) => {
    if (!address || !tokenAddress) {
      toast.error('Wallet not connected or invalid token');
      throw new Error('Invalid parameters');
    }
    
    setIsTrading(true);
    const toastId = toast.loading(`Buying ${amount} tokens...`);
    
    try {
      // Calculate expected price with slippage protection
      const buyPrice = await calculateBuyPrice(amount);
      const maxPrice = parseEther((parseFloat(buyPrice) * (1 + maxSlippage / 100)).toString());
      
      const tx = await writeContractAsync({
        address: CONTRACTS.BONDING_CURVE,
        abi: BondingCurveABI,
        functionName: 'buy',
        args: [tokenAddress, parseEther(amount.toString()), maxPrice],
        value: parseEther(buyPrice)
      });

      await refetchMarket();
      toast.success(`Bought ${amount} tokens successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Buy failed:', error);
      toast.error(error.message || 'Purchase failed', { id: toastId });
      throw error;
    } finally {
      setIsTrading(false);
    }
  };

  const sellTokens = async (amount, maxSlippage = 5) => {
    if (!address || !tokenAddress) {
      toast.error('Wallet not connected or invalid token');
      throw new Error('Invalid parameters');
    }
    
    setIsTrading(true);
    const toastId = toast.loading(`Selling ${amount} tokens...`);
    
    try {
      // Calculate expected price with slippage protection
      const sellPrice = await calculateSellPrice(amount);
      const minPrice = parseEther((parseFloat(sellPrice) * (1 - maxSlippage / 100)).toString());
      
      const tx = await writeContractAsync({
        address: CONTRACTS.BONDING_CURVE,
        abi: BondingCurveABI,
        functionName: 'sell',
        args: [tokenAddress, parseEther(amount.toString()), minPrice]
      });

      await refetchMarket();
      toast.success(`Sold ${amount} tokens successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Sell failed:', error);
      toast.error(error.message || 'Sale failed', { id: toastId });
      throw error;
    } finally {
      setIsTrading(false);
    }
  };

  const calculateBuyPrice = async (amount) => {
    if (!tokenAddress) return '0';
    
    try {
      const { data: price } = await useReadContract({
        address: CONTRACTS.BONDING_CURVE,
        abi: BondingCurveABI,
        functionName: 'calculateBuyPrice',
        args: [tokenAddress, parseEther(amount.toString())]
      });

      return price ? formatEther(price) : '0';
    } catch (error) {
      console.error('Buy price calculation failed:', error);
      return '0';
    }
  };
  
  const calculateSellPrice = async (amount) => {
    if (!tokenAddress) return '0';
    
    try {
      const { data: price } = await useReadContract({
        address: CONTRACTS.BONDING_CURVE,
        abi: BondingCurveABI,
        functionName: 'calculateSellPrice',
        args: [tokenAddress, parseEther(amount.toString())]
      });

      return price ? formatEther(price) : '0';
    } catch (error) {
      console.error('Sell price calculation failed:', error);
      return '0';
    }
  };
  
  const createMarket = async () => {
    if (!address || !tokenAddress) {
      toast.error('Invalid parameters');
      throw new Error('Invalid parameters');
    }
    
    const toastId = toast.loading('Creating market...');
    
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BONDING_CURVE,
        abi: BondingCurveABI,
        functionName: 'createMarket',
        args: [tokenAddress]
      });

      await refetchMarket();
      toast.success('Market created successfully!', { id: toastId });
      return tx;
    } catch (error) {
      console.error('Market creation failed:', error);
      toast.error(error.message || 'Market creation failed', { id: toastId });
      throw error;
    }
  };

  return {
    buyTokens,
    sellTokens,
    calculateBuyPrice,
    calculateSellPrice,
    createMarket,
    marketInfo: marketInfo ? {
      isActive: marketInfo.isActive || false,
      currentSupply: marketInfo.currentSupply || 0n,
      totalSupply: marketInfo.totalSupply || 0n,
      currentPrice: marketInfo.currentPrice || 0n,
      reserveBalance: marketInfo.reserveBalance || 0n,
      totalVolume: marketInfo.totalVolume || 0n
    } : {
      isActive: false,
      currentSupply: 0n,
      totalSupply: 0n,
      currentPrice: 0n,
      reserveBalance: 0n,
      totalVolume: 0n
    },
    isTrading,
    refetchMarket
  };
}
