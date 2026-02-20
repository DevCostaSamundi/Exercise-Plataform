import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { toast } from 'sonner';
import { CONTRACTS } from '../config/constants';
import { CreatorRegistryABI } from '../config/contractABIs';

export function useCreatorProfile(creatorAddress) {
  const { address } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Read creator profile
  const { data: profileData, refetch: refetchProfile } = useReadContract({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: CreatorRegistryABI,
    functionName: 'getCreatorProfile',
    args: creatorAddress ? [creatorAddress] : undefined,
    watch: true
  });

  // Read creator stats
  const { data: statsData, refetch: refetchStats } = useReadContract({
    address: CONTRACTS.CREATOR_REGISTRY,
    abi: CreatorRegistryABI,
    functionName: 'getCreatorStats',
    args: creatorAddress ? [creatorAddress] : undefined,
    watch: true
  });

  const profile = profileData || {
    name: '',
    bio: '',
    socialLinks: [],
    isRegistered: false,
    isVerified: false,
    isBanned: false,
    registeredAt: 0n
  };

  const stats = statsData || {
    tokensCreated: 0n,
    totalVolume: 0n,
    averageRating: 0n,
    totalRatings: 0n,
    flagsReceived: 0n
  };

  const registerCreator = async ({ name, bio, socialLinks }) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    setIsUpdating(true);
    const toastId = toast.loading('Registering creator profile...');

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.CREATOR_REGISTRY,
        abi: CreatorRegistryABI,
        functionName: 'registerCreator',
        args: [name, bio, socialLinks || []]
      });

      await Promise.all([refetchProfile(), refetchStats()]);
      toast.success('Creator profile registered successfully!', { id: toastId });
      return tx;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed', { id: toastId });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateProfile = async ({ name, bio, socialLinks }) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    setIsUpdating(true);
    const toastId = toast.loading('Updating profile...');

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.CREATOR_REGISTRY,
        abi: CreatorRegistryABI,
        functionName: 'updateProfile',
        args: [name, bio, socialLinks || []]
      });

      await refetchProfile();
      toast.success('Profile updated successfully!', { id: toastId });
      return tx;
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Update failed', { id: toastId });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const rateCreator = async (creatorAddr, rating) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    if (rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5');
      throw new Error('Invalid rating');
    }

    setIsRating(true);
    const toastId = toast.loading(`Rating creator ${rating}/5...`);

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.CREATOR_REGISTRY,
        abi: CreatorRegistryABI,
        functionName: 'rateCreator',
        args: [creatorAddr, rating]
      });

      await refetchStats();
      toast.success(`Rated ${rating}/5 successfully!`, { id: toastId });
      return tx;
    } catch (error) {
      console.error('Rating failed:', error);
      toast.error(error.message || 'Rating failed', { id: toastId });
      throw error;
    } finally {
      setIsRating(false);
    }
  };

  const flagCreator = async (creatorAddr, reason) => {
    if (!address) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    if (!reason || reason.trim() === '') {
      toast.error('Please provide a reason');
      throw new Error('Reason required');
    }

    const toastId = toast.loading('Flagging creator...');

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.CREATOR_REGISTRY,
        abi: CreatorRegistryABI,
        functionName: 'flagCreator',
        args: [creatorAddr, reason]
      });

      await refetchStats();
      toast.success('Creator flagged successfully', { id: toastId });
      return tx;
    } catch (error) {
      console.error('Flag failed:', error);
      toast.error(error.message || 'Flag failed', { id: toastId });
      throw error;
    }
  };

  return {
    profile,
    stats,
    registerCreator,
    updateProfile,
    rateCreator,
    flagCreator,
    isUpdating,
    isRating,
    isRegistered: profile.isRegistered,
    isVerified: profile.isVerified,
    isBanned: profile.isBanned,
    averageRating: stats.averageRating ? Number(stats.averageRating) / 100 : 0, // Convert 450 -> 4.5
    refetchProfile,
    refetchStats
  };
}
