/**
 * Script to list tokens with invalid addresses
 * Quick diagnostic tool to identify problematic tokens
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listInvalidTokens() {
  console.log('\n🔍 Checking for tokens with invalid addresses...\n');
  
  const allTokens = await prisma.token.findMany({
    select: {
      id: true,
      address: true,
      name: true,
      symbol: true,
      txHash: true,
      creatorAddress: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total tokens in database: ${allTokens.length}\n`);

  // Valid Ethereum address is 42 characters: "0x" + 40 hex chars
  const invalidTokens = allTokens.filter(token => {
    return !token.address || token.address.length !== 42;
  });

  if (invalidTokens.length === 0) {
    console.log('✅ All tokens have valid addresses!\n');
    return [];
  }

  console.log(`❌ Found ${invalidTokens.length} tokens with INVALID addresses:\n`);
  console.log('='.repeat(80));
  
  invalidTokens.forEach((token, index) => {
    console.log(`\n${index + 1}. ${token.name} (${token.symbol})`);
    console.log(`   ID: ${token.id}`);
    console.log(`   Current address: ${token.address}`);
    console.log(`   Length: ${token.address?.length || 0} chars (expected: 42)`);
    console.log(`   Type: ${token.address?.length === 66 ? 'Transaction Hash (32 bytes)' : 'Unknown'}`);
    console.log(`   TX Hash: ${token.txHash || 'N/A'}`);
    console.log(`   Creator: ${token.creatorAddress}`);
    console.log(`   Created: ${token.createdAt.toLocaleString()}`);
  });

  console.log('\n' + '='.repeat(80));

  // Check for valid tokens
  const validTokens = allTokens.filter(token => {
    return token.address && token.address.length === 42;
  });

  console.log(`\n✅ ${validTokens.length} tokens have valid addresses\n`);

  return invalidTokens;
}

async function main() {
  try {
    await listInvalidTokens();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
