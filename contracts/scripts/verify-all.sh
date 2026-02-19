#!/bin/bash

# Script para verificar todos os contratos no BaseScan
# Usage: ./verify-all.sh <deployment-file>

if [ -z "$1" ]; then
  echo "❌ Error: Please provide deployment file"
  echo "Usage: ./verify-all.sh deployments/baseSepolia-xxxxx.json"
  exit 1
fi

DEPLOYMENT_FILE=$1

if [ ! -f "$DEPLOYMENT_FILE" ]; then
  echo "❌ Error: File $DEPLOYMENT_FILE not found"
  exit 1
fi

echo "🔍 Verifying contracts from: $DEPLOYMENT_FILE"
echo ""

# Extract values from JSON
NETWORK=$(jq -r '.network' $DEPLOYMENT_FILE)
TOKEN_FACTORY=$(jq -r '.contracts.TokenFactory' $DEPLOYMENT_FILE)
FEE_COLLECTOR=$(jq -r '.contracts.FeeCollector' $DEPLOYMENT_FILE)
YIELD_DISTRIBUTOR=$(jq -r '.contracts.YieldDistributor' $DEPLOYMENT_FILE)
BONDING_CURVE=$(jq -r '.contracts.BondingCurve' $DEPLOYMENT_FILE)
LIQUIDITY_LOCKER=$(jq -r '.contracts.LiquidityLocker' $DEPLOYMENT_FILE)
CREATOR_REGISTRY=$(jq -r '.contracts.CreatorRegistry' $DEPLOYMENT_FILE)
FEE_RECEIVER=$(jq -r '.config.feeReceiver' $DEPLOYMENT_FILE)
LAUNCH_FEE=$(jq -r '.config.launchFee' $DEPLOYMENT_FILE)

echo "Network: $NETWORK"
echo ""

# Verify TokenFactory
echo "1/6 Verifying TokenFactory..."
npx hardhat verify --network $NETWORK $TOKEN_FACTORY "$FEE_RECEIVER" "$LAUNCH_FEE"
echo ""

# Verify FeeCollector
echo "2/6 Verifying FeeCollector..."
npx hardhat verify --network $NETWORK $FEE_COLLECTOR "$FEE_RECEIVER"
echo ""

# Verify YieldDistributor
echo "3/6 Verifying YieldDistributor..."
npx hardhat verify --network $NETWORK $YIELD_DISTRIBUTOR "$FEE_COLLECTOR"
echo ""

# Verify BondingCurve
echo "4/6 Verifying BondingCurve..."
npx hardhat verify --network $NETWORK $BONDING_CURVE "$TOKEN_FACTORY" "$FEE_COLLECTOR"
echo ""

# Verify LiquidityLocker
echo "5/6 Verifying LiquidityLocker..."
npx hardhat verify --network $NETWORK $LIQUIDITY_LOCKER "$FEE_RECEIVER"
echo ""

# Verify CreatorRegistry
echo "6/6 Verifying CreatorRegistry..."
npx hardhat verify --network $NETWORK $CREATOR_REGISTRY "$TOKEN_FACTORY"
echo ""

echo "✅ Verification complete!"
echo ""
echo "View on BaseScan:"
if [ "$NETWORK" == "baseSepolia" ]; then
  BASE_URL="https://sepolia.basescan.org"
else
  BASE_URL="https://basescan.org"
fi

echo "  TokenFactory:      $BASE_URL/address/$TOKEN_FACTORY"
echo "  FeeCollector:      $BASE_URL/address/$FEE_COLLECTOR"
echo "  YieldDistributor:  $BASE_URL/address/$YIELD_DISTRIBUTOR"
echo "  BondingCurve:      $BASE_URL/address/$BONDING_CURVE"
echo "  LiquidityLocker:   $BASE_URL/address/$LIQUIDITY_LOCKER"
echo "  CreatorRegistry:   $BASE_URL/address/$CREATOR_REGISTRY"
echo ""
