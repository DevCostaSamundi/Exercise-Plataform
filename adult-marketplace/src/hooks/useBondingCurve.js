import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';

export function useBondingCurve(tokenAddress) {
  const { address } = useAccount();
  const [isTrading, setIsTrading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState('0');
  const { writeContractAsync } = useWriteContract();

  // Read current price from bonding curve
  const { data: priceData } = useReadContract({
    address: CONTRACTS.BONDING_CURVE,
    abi: [
      {
        name: 'calculateBuyPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: 'price', type: 'uint256' }]
      }
    ],
    functionName: 'calculateBuyPrice',
    args: [tokenAddress, parseEther('1')],
    watch: true
  });

  useEffect(() => {
    if (priceData) {
      setCurrentPrice(formatEther(priceData));
    }
  }, [priceData]);

  const buyTokens = async (amount) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }
    
    setIsTrading(true);
    const toastId = toast.loading(`Buying ${amount} tokens...`);
    
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BONDING_CURVE,
        abi: [
          {
            name: 'buy',
            type: 'function',
            stateMutability: 'payable',
            inputs: [
              { name: 'tokenAddress', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: []
          }
        ],
        functionName: 'buy',
        args: [tokenAddress, parseEther(amount)],
        value: parseEther((parseFloat(amount) * parseFloat(currentPrice)).toString())
      });

      toast.success(`Bought ${amount} tokens successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Buy failed:', error);
      toast.error('Purchase failed', { id: toastId });
      throw error;
    } finally {
      setIsTrading(false);
    }
  };

  const sellTokens = async (amount) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }
    
    setIsTrading(true);
    const toastId = toast.loading(`Selling ${amount} tokens...`);
    
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BONDING_CURVE,
        abi: [
          {
            name: 'sell',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'tokenAddress', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: []
          }
        ],
        functionName: 'sell',
        args: [tokenAddress, parseEther(amount)]
      });

      toast.success(`Sold ${amount} tokens successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Sell failed:', error);
      toast.error('Sale failed', { id: toastId });
      throw error;
    } finally {
      setIsTrading(false);
    }
  };

  const calculatePrice = async (amount, isBuy = true) => {
    try {
      const result = await useReadContract({
        address: CONTRACTS.BONDING_CURVE,
        abi: [
          {
            name: isBuy ? 'calculateBuyPrice' : 'calculateSellPrice',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'tokenAddress', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: 'price', type: 'uint256' }]
          }
        ],
        functionName: isBuy ? 'calculateBuyPrice' : 'calculateSellPrice',
        args: [tokenAddress, parseEther(amount)]
      });

      return formatEther(result);
    } catch (error) {
      console.error('Price calculation failed:', error);
      return '0';
    }
  };

  return {
    buyTokens,
    sellTokens,
    calculatePrice,
    currentPrice,
    isTrading
  };
}
