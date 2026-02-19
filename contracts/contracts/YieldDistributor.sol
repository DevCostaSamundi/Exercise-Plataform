// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldDistributor
 * @notice Distribui 1% das taxas de trading para holders de tokens
 * @dev Implementação iterativa (simples), Merkle tree será v2
 */
contract YieldDistributor is Ownable, ReentrancyGuard {
    // ========== Structs ==========
    
    struct YieldPool {
        uint256 totalYield;           // Total acumulado
        uint256 distributedYield;     // Total já distribuído
        uint256 lastDistribution;     // Timestamp última distribuição
        bool isActive;                // Pool ativo
    }
    
    struct UserYield {
        uint256 pendingYield;         // Yield não claimado
        uint256 claimedYield;         // Total já claimado
        uint256 lastClaim;            // Timestamp último claim
    }

    // ========== State Variables ==========
    
    // Token => YieldPool
    mapping(address => YieldPool) public yieldPools;
    
    // Token => User => UserYield
    mapping(address => mapping(address => UserYield)) public userYields;
    
    // Minimum para distribuir
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 0.001 ether;
    
    // Minimum para claim
    uint256 public constant MIN_CLAIM_AMOUNT = 0.0001 ether;
    
    // Maximum holders por distribuição (gas limit)
    uint256 public constant MAX_HOLDERS_PER_DISTRIBUTION = 100;
    
    // Stats
    uint256 public totalYieldDistributed;
    uint256 public totalDistributions;
    
    // ========== Events ==========
    
    event YieldDeposited(
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event YieldDistributed(
        address indexed token,
        uint256 amount,
        uint256 holdersCount,
        uint256 timestamp
    );
    
    event YieldClaimed(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event PoolCreated(
        address indexed token,
        uint256 timestamp
    );

    // ========== Constructor ==========
    
    constructor() Ownable(msg.sender) {}

    // ========== Pool Management ==========
    
    /**
     * @notice Cria yield pool para um token
     */
    function createPool(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!yieldPools[token].isActive, "Pool exists");
        
        yieldPools[token] = YieldPool({
            totalYield: 0,
            distributedYield: 0,
            lastDistribution: block.timestamp,
            isActive: true
        });
        
        emit PoolCreated(token, block.timestamp);
    }
    
    /**
     * @notice Deposita yield no pool (chamado pelo BondingCurve)
     */
    function depositYield(address token) external payable {
        require(msg.value > 0, "Amount must be > 0");
        require(yieldPools[token].isActive, "Pool not active");
        
        yieldPools[token].totalYield += msg.value;
        
        emit YieldDeposited(token, msg.value, block.timestamp);
    }

    // ========== Distribution ==========
    
    /**
     * @notice Distribui yield para holders
     * @param token Token para distribuir
     * @param holders Lista de holders
     * @param balances Lista de balances correspondentes
     * @dev Deve ser chamado off-chain com snapshot dos holders
     */
    function distributeYield(
        address token,
        address[] calldata holders,
        uint256[] calldata balances
    ) external onlyOwner nonReentrant {
        require(holders.length == balances.length, "Length mismatch");
        require(holders.length > 0, "Empty holders");
        require(holders.length <= MAX_HOLDERS_PER_DISTRIBUTION, "Too many holders");
        
        YieldPool storage pool = yieldPools[token];
        require(pool.isActive, "Pool not active");
        
        uint256 availableYield = pool.totalYield - pool.distributedYield;
        require(availableYield >= MIN_DISTRIBUTION_AMOUNT, "Insufficient yield");
        
        // Calcular total supply dos holders
        uint256 totalSupply = 0;
        for (uint256 i = 0; i < balances.length; i++) {
            totalSupply += balances[i];
        }
        require(totalSupply > 0, "Zero total supply");
        
        // Distribuir proporcionalmente
        uint256 distributed = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (balances[i] == 0) continue;
            
            // Yield proporcional ao balance
            uint256 userShare = (availableYield * balances[i]) / totalSupply;
            
            if (userShare > 0) {
                userYields[token][holders[i]].pendingYield += userShare;
                distributed += userShare;
            }
        }
        
        pool.distributedYield += distributed;
        pool.lastDistribution = block.timestamp;
        
        totalYieldDistributed += distributed;
        totalDistributions++;
        
        emit YieldDistributed(token, distributed, holders.length, block.timestamp);
    }
    
    /**
     * @notice Distribui para um único holder (manual)
     */
    function distributeSingle(
        address token,
        address holder,
        uint256 amount
    ) external onlyOwner {
        require(holder != address(0), "Invalid holder");
        require(amount > 0, "Amount must be > 0");
        
        YieldPool storage pool = yieldPools[token];
        require(pool.isActive, "Pool not active");
        
        uint256 availableYield = pool.totalYield - pool.distributedYield;
        require(amount <= availableYield, "Insufficient yield");
        
        userYields[token][holder].pendingYield += amount;
        pool.distributedYield += amount;
        
        emit YieldDistributed(token, amount, 1, block.timestamp);
    }

    // ========== Claiming ==========
    
    /**
     * @notice User claima seu yield pendente
     */
    function claimYield(address token) external nonReentrant {
        UserYield storage userYield = userYields[token][msg.sender];
        
        uint256 pending = userYield.pendingYield;
        require(pending >= MIN_CLAIM_AMOUNT, "Amount too low");
        
        userYield.pendingYield = 0;
        userYield.claimedYield += pending;
        userYield.lastClaim = block.timestamp;
        
        // Transfer ETH
        (bool success, ) = msg.sender.call{value: pending}("");
        require(success, "Transfer failed");
        
        emit YieldClaimed(token, msg.sender, pending, block.timestamp);
    }
    
    /**
     * @notice Claim múltiplos tokens de uma vez
     */
    function claimMultiple(address[] calldata tokens) external nonReentrant {
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            UserYield storage userYield = userYields[token][msg.sender];
            
            uint256 pending = userYield.pendingYield;
            if (pending < MIN_CLAIM_AMOUNT) continue;
            
            userYield.pendingYield = 0;
            userYield.claimedYield += pending;
            userYield.lastClaim = block.timestamp;
            
            totalClaim += pending;
            
            emit YieldClaimed(token, msg.sender, pending, block.timestamp);
        }
        
        require(totalClaim > 0, "Nothing to claim");
        
        // Transfer total
        (bool success, ) = msg.sender.call{value: totalClaim}("");
        require(success, "Transfer failed");
    }

    // ========== View Functions ==========
    
    /**
     * @notice Retorna yield pendente de um user
     */
    function getPendingYield(
        address token,
        address user
    ) external view returns (uint256) {
        return userYields[token][user].pendingYield;
    }
    
    /**
     * @notice Retorna info completa do yield de um user
     */
    function getUserYieldInfo(
        address token,
        address user
    ) external view returns (
        uint256 pending,
        uint256 claimed,
        uint256 lastClaim
    ) {
        UserYield memory userYield = userYields[token][user];
        return (
            userYield.pendingYield,
            userYield.claimedYield,
            userYield.lastClaim
        );
    }
    
    /**
     * @notice Retorna info do pool
     */
    function getPoolInfo(address token) external view returns (
        uint256 totalYield,
        uint256 distributedYield,
        uint256 availableYield,
        uint256 lastDistribution,
        bool isActive
    ) {
        YieldPool memory pool = yieldPools[token];
        return (
            pool.totalYield,
            pool.distributedYield,
            pool.totalYield - pool.distributedYield,
            pool.lastDistribution,
            pool.isActive
        );
    }
    
    /**
     * @notice Retorna pending yield de múltiplos tokens
     */
    function getPendingYieldMultiple(
        address[] calldata tokens,
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            pending[i] = userYields[tokens[i]][user].pendingYield;
        }
        
        return pending;
    }
    
    /**
     * @notice Verifica se user pode claimar
     */
    function canClaim(
        address token,
        address user
    ) external view returns (bool) {
        return userYields[token][user].pendingYield >= MIN_CLAIM_AMOUNT;
    }

    // ========== Admin Functions ==========
    
    /**
     * @notice Desativa pool
     */
    function deactivatePool(address token) external onlyOwner {
        require(yieldPools[token].isActive, "Pool not active");
        yieldPools[token].isActive = false;
    }
    
    /**
     * @notice Reativa pool
     */
    function reactivatePool(address token) external onlyOwner {
        require(!yieldPools[token].isActive, "Pool already active");
        yieldPools[token].isActive = true;
    }
    
    /**
     * @notice Emergency withdraw de yield não distribuído
     */
    function emergencyWithdraw(address token) external onlyOwner {
        YieldPool storage pool = yieldPools[token];
        uint256 available = pool.totalYield - pool.distributedYield;
        
        require(available > 0, "Nothing to withdraw");
        
        pool.totalYield = pool.distributedYield;
        
        (bool success, ) = owner().call{value: available}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Retira ETH preso por erro
     */
    function rescueETH() external onlyOwner {
        uint256 balance = address(this).balance;
        
        // Calcular quanto está alocado a pools
        // Simplificado: assume que todo balance é disponível
        // Versão production: calcular sum de todos availableYield
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ========== Receive ETH ==========
    
    receive() external payable {
        // Aceita ETH mas não faz nada
        // Deve usar depositYield() explicitamente
    }
}
