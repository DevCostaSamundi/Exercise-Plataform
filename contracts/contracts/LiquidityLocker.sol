// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiquidityLocker
 * @notice Trava liquidez de tokens por período mínimo de 30 dias
 * @dev Garante que criadores não podem fazer rug pull retirando liquidez imediatamente
 */
contract LiquidityLocker is Ownable, ReentrancyGuard {
    // ========== Structs ==========
    
    struct Lock {
        address token;           // Token travado
        address owner;           // Dono do lock
        uint256 amount;          // Quantidade travada
        uint256 lockTime;        // Timestamp do lock
        uint256 unlockTime;      // Timestamp para unlock
        bool withdrawn;          // Se já foi sacado
        string description;      // Descrição opcional
    }

    // ========== State Variables ==========
    
    uint256 public constant MIN_LOCK_DURATION = 30 days;
    uint256 public constant EMERGENCY_PENALTY_PERCENT = 2000; // 20% penalty
    uint256 public constant PENALTY_DENOMINATOR = 10000;
    
    uint256 public lockIdCounter;
    
    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public userLocks;
    mapping(address => uint256) public totalLocked; // Total por token
    
    address public penaltyReceiver;
    
    // ========== Events ==========
    
    event LiquidityLocked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime,
        string description
    );
    
    event LiquidityUnlocked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount
    );
    
    event EmergencyUnlock(
        uint256 indexed lockId,
        address indexed owner,
        uint256 amount,
        uint256 penalty
    );
    
    event PenaltyReceiverUpdated(
        address indexed oldReceiver,
        address indexed newReceiver
    );

    // ========== Constructor ==========
    
    constructor(address _penaltyReceiver) Ownable(msg.sender) {
        require(_penaltyReceiver != address(0), "Invalid penalty receiver");
        penaltyReceiver = _penaltyReceiver;
    }

    // ========== Locking Functions ==========
    
    /**
     * @notice Trava liquidez de um token
     * @param token Endereço do token
     * @param amount Quantidade a travar
     * @param duration Duração do lock em segundos (min 30 dias)
     * @param description Descrição opcional
     * @return lockId ID do lock criado
     */
    function lockLiquidity(
        address token,
        uint256 amount,
        uint256 duration,
        string calldata description
    ) external nonReentrant returns (uint256) {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        require(duration >= MIN_LOCK_DURATION, "Duration too short");
        
        // Transfer tokens para o contrato
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Cria lock
        uint256 lockId = lockIdCounter++;
        uint256 unlockTime = block.timestamp + duration;
        
        locks[lockId] = Lock({
            token: token,
            owner: msg.sender,
            amount: amount,
            lockTime: block.timestamp,
            unlockTime: unlockTime,
            withdrawn: false,
            description: description
        });
        
        userLocks[msg.sender].push(lockId);
        totalLocked[token] += amount;
        
        emit LiquidityLocked(
            lockId,
            token,
            msg.sender,
            amount,
            unlockTime,
            description
        );
        
        return lockId;
    }
    
    /**
     * @notice Destrava liquidez após período
     * @param lockId ID do lock
     */
    function unlock(uint256 lockId) external nonReentrant {
        Lock storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTime, "Still locked");
        
        lock.withdrawn = true;
        totalLocked[lock.token] -= lock.amount;
        
        // Transfer tokens de volta
        IERC20(lock.token).transfer(msg.sender, lock.amount);
        
        emit LiquidityUnlocked(lockId, lock.token, msg.sender, lock.amount);
    }
    
    /**
     * @notice Destrava com penalidade (emergência)
     * @param lockId ID do lock
     * @dev Cobra 20% de penalty que vai para penaltyReceiver
     */
    function emergencyUnlock(uint256 lockId) external nonReentrant {
        Lock storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        
        lock.withdrawn = true;
        totalLocked[lock.token] -= lock.amount;
        
        // Calcula penalty
        uint256 penalty = (lock.amount * EMERGENCY_PENALTY_PERCENT) / PENALTY_DENOMINATOR;
        uint256 amountAfterPenalty = lock.amount - penalty;
        
        // Transfer tokens
        IERC20(lock.token).transfer(msg.sender, amountAfterPenalty);
        IERC20(lock.token).transfer(penaltyReceiver, penalty);
        
        emit EmergencyUnlock(lockId, msg.sender, amountAfterPenalty, penalty);
    }

    // ========== Extension Functions ==========
    
    /**
     * @notice Estende duração do lock
     * @param lockId ID do lock
     * @param additionalDuration Tempo adicional em segundos
     */
    function extendLock(
        uint256 lockId,
        uint256 additionalDuration
    ) external {
        Lock storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(additionalDuration > 0, "Duration must be > 0");
        
        lock.unlockTime += additionalDuration;
        
        emit LiquidityLocked(
            lockId,
            lock.token,
            msg.sender,
            lock.amount,
            lock.unlockTime,
            lock.description
        );
    }
    
    /**
     * @notice Adiciona mais tokens a um lock existente
     * @param lockId ID do lock
     * @param amount Quantidade adicional
     */
    function increaseLock(
        uint256 lockId,
        uint256 amount
    ) external nonReentrant {
        Lock storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens
        IERC20(lock.token).transferFrom(msg.sender, address(this), amount);
        
        lock.amount += amount;
        totalLocked[lock.token] += amount;
        
        emit LiquidityLocked(
            lockId,
            lock.token,
            msg.sender,
            lock.amount,
            lock.unlockTime,
            lock.description
        );
    }

    // ========== View Functions ==========
    
    /**
     * @notice Retorna informações de um lock
     */
    function getLockInfo(uint256 lockId) external view returns (
        address token,
        address owner,
        uint256 amount,
        uint256 lockTime,
        uint256 unlockTime,
        bool withdrawn,
        string memory description,
        uint256 timeRemaining
    ) {
        Lock memory lock = locks[lockId];
        
        uint256 remaining = 0;
        if (block.timestamp < lock.unlockTime) {
            remaining = lock.unlockTime - block.timestamp;
        }
        
        return (
            lock.token,
            lock.owner,
            lock.amount,
            lock.lockTime,
            lock.unlockTime,
            lock.withdrawn,
            lock.description,
            remaining
        );
    }
    
    /**
     * @notice Retorna todos os locks de um usuário
     */
    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }
    
    /**
     * @notice Retorna locks ativos de um usuário
     */
    function getActiveLocks(address user) external view returns (uint256[] memory) {
        uint256[] memory allLocks = userLocks[user];
        
        // Conta locks ativos
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allLocks.length; i++) {
            if (!locks[allLocks[i]].withdrawn) {
                activeCount++;
            }
        }
        
        // Cria array de locks ativos
        uint256[] memory activeLocks = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allLocks.length; i++) {
            if (!locks[allLocks[i]].withdrawn) {
                activeLocks[index] = allLocks[i];
                index++;
            }
        }
        
        return activeLocks;
    }
    
    /**
     * @notice Verifica se lock pode ser desbloqueado
     */
    function canUnlock(uint256 lockId) external view returns (bool) {
        Lock memory lock = locks[lockId];
        return !lock.withdrawn && block.timestamp >= lock.unlockTime;
    }
    
    /**
     * @notice Retorna total travado de um token
     */
    function getTotalLocked(address token) external view returns (uint256) {
        return totalLocked[token];
    }
    
    /**
     * @notice Retorna informações de múltiplos locks
     */
    function getMultipleLocks(
        uint256[] calldata lockIds
    ) external view returns (Lock[] memory) {
        Lock[] memory result = new Lock[](lockIds.length);
        
        for (uint256 i = 0; i < lockIds.length; i++) {
            result[i] = locks[lockIds[i]];
        }
        
        return result;
    }

    // ========== Admin Functions ==========
    
    /**
     * @notice Atualiza penalty receiver
     */
    function setPenaltyReceiver(address _penaltyReceiver) external onlyOwner {
        require(_penaltyReceiver != address(0), "Invalid address");
        address oldReceiver = penaltyReceiver;
        penaltyReceiver = _penaltyReceiver;
        emit PenaltyReceiverUpdated(oldReceiver, _penaltyReceiver);
    }
    
    /**
     * @notice Retira tokens presos por erro (apenas owner)
     * @dev Não pode retirar tokens de locks ativos
     */
    function rescueTokens(
        address token,
        uint256 amount
    ) external onlyOwner {
        uint256 lockedAmount = totalLocked[token];
        uint256 balance = IERC20(token).balanceOf(address(this));
        
        require(balance - lockedAmount >= amount, "Cannot withdraw locked tokens");
        
        IERC20(token).transfer(owner(), amount);
    }
}
