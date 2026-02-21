/**
 * Script to fix invalid token addresses in database
 * 
 * Problem: Some tokens have 32-byte transaction hashes in the 'address' field
 * instead of 20-byte contract addresses
 * 
 * This script:
 * 1. Identifies tokens with invalid addresses (length !== 42)
 * 2. Attempts to fetch the correct token address from transaction receipt
 * 3. Updates the database with the correct address
 */

import { PrismaClient } from '@prisma/client';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import 'dotenv/config';

const prisma = new PrismaClient();

// Create viem client for Base Sepolia
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org')
});

async function findInvalidTokens() {
  console.log('🔍 Searching for tokens with invalid addresses...\n');
  
  const allTokens = await prisma.token.findMany({
    select: {
      id: true,
      address: true,
      name: true,
      symbol: true,
      txHash: true,
      createdAt: true
    }
  });

  const invalidTokens = allTokens.filter(token => {
    // Valid Ethereum address is 42 characters: "0x" + 40 hex chars
    return !token.address || token.address.length !== 42;
  });

  console.log(`Found ${invalidTokens.length} tokens with invalid addresses:\n`);
  
  invalidTokens.forEach((token, index) => {
    console.log(`${index + 1}. ${token.name} (${token.symbol})`);
    console.log(`   Current address: ${token.address}`);
    console.log(`   Length: ${token.address?.length || 0} chars (should be 42)`);
    console.log(`   TX Hash: ${token.txHash || 'N/A'}`);
    console.log(`   Created: ${token.createdAt}`);
    console.log('');
  });

  return invalidTokens;
}

async function getTokenAddressFromTx(txHash) {
  if (!txHash || txHash.length !== 66) {
    console.log(`   ⚠️  Invalid transaction hash: ${txHash}`);
    return null;
  }

  try {
    console.log(`   📡 Fetching transaction receipt for ${txHash}...`);
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    
    // The TokenFactory emits a TokenCreated event with the token address
    // Look for the first contract creation in the logs
    const tokenCreatedLog = receipt.logs.find(log => {
      // TokenCreated event signature
      return log.topics[0] === '0x...'; // Add actual event signature if known
    });

    if (tokenCreatedLog) {
      // Extract token address from log
      const tokenAddress = tokenCreatedLog.address;
      console.log(`   ✅ Found token address: ${tokenAddress}`);
      return tokenAddress;
    }

    // Fallback: use contractAddress from receipt if it's a contract creation
    if (receipt.contractAddress) {
      console.log(`   ✅ Found contract address: ${receipt.contractAddress}`);
      return receipt.contractAddress;
    }

    console.log(`   ❌ Could not find token address in transaction`);
    return null;
  } catch (error) {
    console.log(`   ❌ Error fetching transaction: ${error.message}`);
    return null;
  }
}

async function fixInvalidToken(token) {
  console.log(`\n🔧 Attempting to fix: ${token.name} (${token.symbol})`);
  
  if (!token.txHash) {
    console.log(`   ⚠️  No transaction hash available - cannot fix automatically`);
    return false;
  }

  const correctAddress = await getTokenAddressFromTx(token.txHash);
  
  if (!correctAddress) {
    console.log(`   ❌ Could not determine correct address`);
    return false;
  }

  // Check if the correct address already exists
  const existing = await prisma.token.findUnique({
    where: { address: correctAddress.toLowerCase() }
  });

  if (existing && existing.id !== token.id) {
    console.log(`   ⚠️  Correct address already exists for another token - this might be a duplicate`);
    return false;
  }

  // Update the token with the correct address
  try {
    await prisma.token.update({
      where: { id: token.id },
      data: { address: correctAddress.toLowerCase() }
    });
    console.log(`   ✅ Successfully updated address to: ${correctAddress}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed to update: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=====================================');
  console.log('Token Address Fixer');
  console.log('=====================================\n');

  const invalidTokens = await findInvalidTokens();

  if (invalidTokens.length === 0) {
    console.log('✅ All tokens have valid addresses!');
    await prisma.$disconnect();
    return;
  }

  console.log('=====================================');
  console.log('Attempting to fix invalid addresses...');
  console.log('=====================================');

  let fixed = 0;
  let failed = 0;

  for (const token of invalidTokens) {
    const success = await fixInvalidToken(token);
    if (success) {
      fixed++;
    } else {
      failed++;
    }
  }

  console.log('\n=====================================');
  console.log('Summary');
  console.log('=====================================');
  console.log(`Total invalid tokens: ${invalidTokens.length}`);
  console.log(`Successfully fixed: ${fixed}`);
  console.log(`Failed to fix: ${failed}`);
  console.log('=====================================\n');

  await prisma.$disconnect();
}

// Run the script
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
