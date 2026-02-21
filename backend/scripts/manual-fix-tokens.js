/**
 * Manual Token Address Correction Script
 * 
 * Use this script to manually update token addresses when automatic
 * correction is not possible (e.g., when txHash is not available)
 * 
 * Usage:
 * 1. Find the token by name/symbol
 * 2. Update with the correct contract address
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update a token's address by token ID or name
 */
async function updateTokenAddress(identifier, newAddress) {
  // Validate address format
  if (!newAddress || !newAddress.startsWith('0x') || newAddress.length !== 42) {
    throw new Error(`Invalid address format: ${newAddress}. Must be 42 characters starting with 0x`);
  }

  const normalizedAddress = newAddress.toLowerCase();

  // Check if this address already exists
  const existing = await prisma.token.findUnique({
    where: { address: normalizedAddress }
  });

  if (existing) {
    console.log(`⚠️  Address ${newAddress} already exists for token: ${existing.name} (${existing.symbol})`);
    throw new Error('Address already in use');
  }

  // Find token by ID or name
  const token = await prisma.token.findFirst({
    where: {
      OR: [
        { id: identifier },
        { name: identifier },
        { symbol: identifier }
      ]
    }
  });

  if (!token) {
    throw new Error(`Token not found: ${identifier}`);
  }

  console.log(`\n📝 Updating token:`);
  console.log(`   Name: ${token.name} (${token.symbol})`);
  console.log(`   Old address: ${token.address}`);
  console.log(`   New address: ${newAddress}`);

  // Update the token
  const updated = await prisma.token.update({
    where: { id: token.id },
    data: { address: normalizedAddress }
  });

  console.log(`\n✅ Successfully updated!`);
  return updated;
}

/**
 * Delete a token and all its related data (use with caution!)
 */
async function deleteToken(identifier) {
  const token = await prisma.token.findFirst({
    where: {
      OR: [
        { id: identifier },
        { name: identifier },
        { symbol: identifier }
      ]
    }
  });

  if (!token) {
    throw new Error(`Token not found: ${identifier}`);
  }

  console.log(`\n⚠️  DELETING token:`);
  console.log(`   Name: ${token.name} (${token.symbol})`);
  console.log(`   Address: ${token.address}`);

  // Delete all related data first (to avoid foreign key constraints)
  console.log(`   🗑️  Deleting related data...`);
  
  // Delete token holders
  const holders = await prisma.tokenHolder.deleteMany({
    where: { tokenAddress: token.address }
  });
  console.log(`      ✓ Deleted ${holders.count} token holders`);
  
  // Delete trades
  const trades = await prisma.trade.deleteMany({
    where: { tokenAddress: token.address }
  });
  console.log(`      ✓ Deleted ${trades.count} trades`);

  // Finally, delete the token
  await prisma.token.delete({
    where: { id: token.id }
  });

  console.log(`\n✅ Token and all related data deleted`);
}

// Example usage - uncomment and modify as needed
async function main() {
  console.log('=====================================');
  console.log('Manual Token Address Correction');
  console.log('=====================================\n');

  try {
    // OPTION 2: Delete invalid tokens (test tokens)
    // WARNING: This will permanently delete the token and all related data
    
    console.log('🗑️  Deleting invalid test tokens...\n');
    
    await deleteToken('QWER');
    await deleteToken('russian');
    await deleteToken('Angola');
    await deleteToken('YERD');

    console.log('\n✅ All invalid tokens deleted successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
