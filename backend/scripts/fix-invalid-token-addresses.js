/**
 * Script to fix invalid token addresses in database
 *
 * Problem: Tokens have 66-char transaction hashes stored as 'address'
 * instead of the actual 42-char deployed contract addresses.
 *
 * This script:
 * 1. Finds all tokens where address.length !== 42
 * 2. Treats the stored address AS the tx hash (since that's what was saved)
 * 3. Fetches the transaction receipt and parses the TokenCreated event
 * 4. Updates the token with the correct address
 * 5. If a lookup fails (no receipt / no event), deletes the invalid token
 */

import { PrismaClient } from '@prisma/client';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import 'dotenv/config';

const prisma = new PrismaClient();

const isMainnet = process.env.NODE_ENV === 'production';
const chain = isMainnet ? base : baseSepolia;
const rpcUrl = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const client = createPublicClient({
  chain,
  transport: http(rpcUrl)
});

// TokenFactory ABI — only the TokenCreated event is needed
const TOKEN_FACTORY_ABI = [
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { name: 'tokenAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'initialSupply', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
];

async function findInvalidTokens() {
  const allTokens = await prisma.token.findMany({
    select: {
      id: true,
      address: true,
      name: true,
      symbol: true,
      creatorAddress: true,
      createdAt: true
    }
  });

  return allTokens.filter(t => !t.address || t.address.length !== 42);
}

async function getRealTokenAddressFromTxHash(txHash) {
  if (!txHash || txHash.length !== 66) {
    return null;
  }

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: TOKEN_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'TokenCreated' && decoded.args?.tokenAddress) {
          return decoded.args.tokenAddress;
        }
      } catch {
        // Skip logs that don't match
      }
    }

    return null;
  } catch (err) {
    console.log(`   ⚠  Could not fetch receipt: ${err.message}`);
    return null;
  }
}

async function deleteInvalidToken(token) {
  console.log(`   🗑  Deleting "${token.name}" (no correct address found)...`);

  // Delete related data first
  await prisma.tokenHolder.deleteMany({ where: { tokenAddress: token.address } });
  await prisma.trade.deleteMany({ where: { tokenAddress: token.address } });
  await prisma.token.delete({ where: { id: token.id } });

  console.log(`   ✅ Deleted "${token.name}"`);
}

async function main() {
  console.log('\n=====================================');
  console.log('Token Address Fixer v2');
  console.log(`Chain: ${chain.name} | RPC: ${rpcUrl}`);
  console.log('=====================================\n');

  const invalidTokens = await findInvalidTokens();

  if (invalidTokens.length === 0) {
    console.log('✅ All tokens have valid addresses! Nothing to fix.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`❌ Found ${invalidTokens.length} token(s) with invalid addresses:\n`);
  invalidTokens.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} (${t.symbol})`);
    console.log(`     Stored address (${t.address?.length || 0} chars): ${t.address}`);
  });

  console.log('\n--- Attempting to fix ---\n');

  let fixed = 0;
  let deleted = 0;
  let manual = 0;

  for (const token of invalidTokens) {
    console.log(`\n🔧 Processing: ${token.name} (${token.symbol})`);

    // The stored 'address' is actually the tx hash (it's 66 chars)
    const txHash = token.address;
    const realAddress = await getRealTokenAddressFromTxHash(txHash);

    if (realAddress) {
      // Check for duplicates
      const duplicate = await prisma.token.findUnique({
        where: { address: realAddress.toLowerCase() }
      });

      if (duplicate && duplicate.id !== token.id) {
        console.log(`   ⚠  Real address already exists for another token — deleting this duplicate`);
        await deleteInvalidToken(token);
        deleted++;
        continue;
      }

      // Update with real address
      try {
        await prisma.token.update({
          where: { id: token.id },
          data: { address: realAddress.toLowerCase() }
        });
        // Also update related records
        await prisma.tokenHolder.updateMany({
          where: { tokenAddress: txHash.toLowerCase() },
          data: { tokenAddress: realAddress.toLowerCase() }
        });
        await prisma.trade.updateMany({
          where: { tokenAddress: txHash.toLowerCase() },
          data: { tokenAddress: realAddress.toLowerCase() }
        });

        console.log(`   ✅ Fixed! New address: ${realAddress}`);
        fixed++;
      } catch (err) {
        console.log(`   ❌ DB update failed: ${err.message}`);
        manual++;
      }
    } else {
      // No receipt found — delete the token (it's a test or failed deployment)
      await deleteInvalidToken(token);
      deleted++;
    }
  }

  console.log('\n=====================================');
  console.log('Summary');
  console.log('=====================================');
  console.log(`Fixed:   ${fixed}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Manual:  ${manual}`);
  console.log('=====================================\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
