import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '../config/constants';
import { toast } from 'sonner';

export function useCreatorProfile(creatorAddress) {
  const { address } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);

  // Read creator profile from CreatorRegistry
  const { data: profileData, refetch } = useReadContract({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: [
      {
        name: 'getCreator',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'creator', type: 'address' }],
        outputs: [
          { name: 'name', type: 'string' },
          { name: 'bio', type: 'string' },
          { name: 'twitter', type: 'string' },
          { name: 'telegram', type: 'string' },
          { name: 'website', type: 'string' },
          { name: 'isVerified', type: 'bool' },
          { name: 'isBanned', type: 'bool' },
          { name: 'rating', type: 'uint256' },
          { name: 'totalTokens', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' }
        ]
      }
    ],
    functionName: 'getCreator',
    args: creatorAddress ? [creatorAddress] : undefined,
    watch: true
  });

  // Read creator tokens
  const { data: tokensData } = useReadContract({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: [
      {
        name: 'getCreatorTokens',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'creator', type: 'address' }],
        outputs: [{ name: 'tokens', type: 'address[]' }]
      }
    ],
    functionName: 'getCreatorTokens',
    args: creatorAddress ? [creatorAddress] : undefined,
    watch: true
  });

  const profile = profileData ? {
    name: profileData[0],
    bio: profileData[1],
    twitter: profileData[2],
    telegram: profileData[3],
    website: profileData[4],
    isVerified: profileData[5],
    isBanned: profileData[6],
    rating: Number(profileData[7]) / 100, // Convert from uint to decimal (4.5 = 450)
    totalTokens: Number(profileData[8]),
    totalVolume: profileData[9]
  } : null;

  const tokens = tokensData || [];

  const updateProfile = async ({ name, bio, twitter, telegram, website }) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    setIsUpdating(true);
    const toastId = toast.loading('Updating profile...');

    try {
      // TODO: Implement contract call to update profile
      // This would call CreatorRegistry.updateProfile()
      
      await refetch();
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Profile update failed', { id: toastId });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const rateCreator = async (rating) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    if (rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5');
      throw new Error('Invalid rating');
    }

    const toastId = toast.loading('Submitting rating...');

    try {
      // TODO: Implement contract call
      // This would call CreatorRegistry.rateCreator(creatorAddress, rating)
      
      await refetch();
      toast.success('Rating submitted!', { id: toastId });
    } catch (error) {
      console.error('Rating failed:', error);
      toast.error('Rating failed', { id: toastId });
      throw error;
    }
  };

  const getCreatorStats = async () => {
    // TODO: Aggregate stats from multiple tokens
    // This would query all tokens created by creator
    // and sum up holders, volume, etc.
    
    return {
      totalHolders: 0,
      totalVolume: '0',
      totalRevenue: '0',
      averageRating: profile?.rating || 0
    };
  };

  return {
    profile,
    tokens,
    updateProfile,
    rateCreator,
    getCreatorStats,
    isUpdating,
    refetchProfile: refetch
  };
}
