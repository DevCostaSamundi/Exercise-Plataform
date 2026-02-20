/**
 * useTokens - Hook for fetching token data
 * Primary: API (database with indexed blockchain data)
 * Fallback: Direct blockchain calls
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '../config/constants';
import { TokenFactoryABI } from '../config/contractABIs';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Fetch wrapper with auth
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get all tokens with pagination and filters
 */
export function useTokenList({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search = '', creator = '' } = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(search && { search }),
    ...(creator && { creator })
  });
  
  return useQuery({
    queryKey: ['tokens', 'list', page, limit, sortBy, sortOrder, search, creator],
    queryFn: () => apiFetch(`/tokens?${queryParams}`),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute auto-refresh
  });
}

/**
 * Get trending tokens
 */
export function useTrendingTokens(limit = 10) {
  return useQuery({
    queryKey: ['tokens', 'trending', limit],
    queryFn: () => apiFetch(`/tokens/trending?limit=${limit}`),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000 // 2 minute auto-refresh
  });
}

/**
 * Get recent tokens
 */
export function useRecentTokens(limit = 10) {
  return useQuery({
    queryKey: ['tokens', 'recent', limit],
    queryFn: () => apiFetch(`/tokens/recent?limit=${limit}`),
    staleTime: 30000,
    refetchInterval: 60000
  });
}

/**
 * Get single token details
 */
export function useToken(address) {
  return useQuery({
    queryKey: ['token', address],
    queryFn: () => apiFetch(`/tokens/${address}`),
    enabled: !!address,
    staleTime: 15000 // 15 seconds
  });
}

/**
 * Get token trades
 */
export function useTokenTrades(address, { page = 1, limit = 50 } = {}) {
  return useQuery({
    queryKey: ['token', address, 'trades', page, limit],
    queryFn: () => apiFetch(`/tokens/${address}/trades?page=${page}&limit=${limit}`),
    enabled: !!address,
    staleTime: 10000 // 10 seconds
  });
}

/**
 * Get token holders
 */
export function useTokenHolders(address, { page = 1, limit = 50 } = {}) {
  return useQuery({
    queryKey: ['token', address, 'holders', page, limit],
    queryFn: () => apiFetch(`/tokens/${address}/holders?page=${page}&limit=${limit}`),
    enabled: !!address,
    staleTime: 30000
  });
}

/**
 * Get token chart data
 */
export function useTokenChart(address, timeframe = '24h') {
  return useQuery({
    queryKey: ['token', address, 'chart', timeframe],
    queryFn: () => apiFetch(`/tokens/${address}/chart?timeframe=${timeframe}`),
    enabled: !!address,
    staleTime: 60000
  });
}

/**
 * Get platform statistics
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => apiFetch('/tokens/stats'),
    staleTime: 60000,
    refetchInterval: 120000
  });
}

/**
 * Get user portfolio (authenticated)
 */
export function usePortfolio({ page = 1, limit = 20 } = {}) {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['portfolio', 'holdings', page, limit],
    queryFn: () => apiFetch(`/portfolio?page=${page}&limit=${limit}`),
    enabled: !!address,
    staleTime: 30000
  });
}

/**
 * Get user trade history (authenticated)
 */
export function useUserTrades({ page = 1, limit = 50 } = {}) {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['portfolio', 'trades', page, limit],
    queryFn: () => apiFetch(`/portfolio/trades?page=${page}&limit=${limit}`),
    enabled: !!address,
    staleTime: 30000
  });
}

/**
 * Get tokens created by user (authenticated)
 */
export function useCreatedTokens({ page = 1, limit = 20 } = {}) {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['portfolio', 'created', page, limit],
    queryFn: () => apiFetch(`/portfolio/created?page=${page}&limit=${limit}`),
    enabled: !!address,
    staleTime: 60000
  });
}

/**
 * Get user portfolio stats (authenticated)
 */
export function usePortfolioStats() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['portfolio', 'stats'],
    queryFn: () => apiFetch('/portfolio/stats'),
    enabled: !!address,
    staleTime: 30000
  });
}

/**
 * Hook for real-time token updates via WebSocket
 * Falls back to polling if WebSocket unavailable
 */
export function useTokenUpdates(tokenAddress) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    if (!tokenAddress) return;
    
    // Try WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    let ws;
    
    try {
      ws = new WebSocket(`${wsUrl}/tokens/${tokenAddress}`);
      
      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected for token:', tokenAddress);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Invalidate relevant queries to trigger refetch
        if (data.type === 'trade') {
          queryClient.invalidateQueries(['token', tokenAddress, 'trades']);
          queryClient.invalidateQueries(['token', tokenAddress]);
        } else if (data.type === 'holder') {
          queryClient.invalidateQueries(['token', tokenAddress, 'holders']);
        }
      };
      
      ws.onclose = () => {
        setConnected(false);
      };
      
      ws.onerror = () => {
        setConnected(false);
      };
    } catch (error) {
      console.log('WebSocket not available, using polling');
    }
    
    return () => {
      if (ws) ws.close();
    };
  }, [tokenAddress, queryClient]);
  
  return { connected };
}

/**
 * Hybrid hook - API with blockchain fallback
 */
export function useTokenWithFallback(address) {
  const { 
    data: apiData, 
    isLoading: apiLoading, 
    error: apiError 
  } = useToken(address);
  
  // Blockchain fallback
  const { data: onchainInfo } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: TokenFactoryABI,
    functionName: 'getTokenInfo',
    args: [address],
    enabled: !!address && !!apiError // Only use if API fails
  });
  
  // Combine data
  const data = apiData || (onchainInfo ? {
    address,
    name: onchainInfo[0],
    symbol: onchainInfo[1],
    totalSupply: onchainInfo[2]?.toString(),
    creatorAddress: onchainInfo[3],
    // Minimal data from blockchain
    isFromBlockchain: true
  } : null);
  
  return {
    data,
    isLoading: apiLoading,
    error: apiError,
    isFromBlockchain: !apiData && !!onchainInfo
  };
}

export default {
  useTokenList,
  useTrendingTokens,
  useRecentTokens,
  useToken,
  useTokenTrades,
  useTokenHolders,
  useTokenChart,
  usePlatformStats,
  usePortfolio,
  useUserTrades,
  useCreatedTokens,
  usePortfolioStats,
  useTokenUpdates,
  useTokenWithFallback
};
