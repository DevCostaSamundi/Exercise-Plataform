// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IYieldDistributor {
    function depositYield(address token) external payable;
}

/**
 * @title FeeCollector
 * @notice Coleta fees da plataforma e distribui: 60% team, 40% yield pool
 */
contract FeeCollector is Ownable, ReentrancyGuard {
    // ========== State Variables ==========
    
    address public teamWallet;
    address public yieldDistributor;
    
    // Split percentages (base 10000)
    uint256 public teamSplit = 6000;      // 60%
    uint256 public yieldSplit = 4000;     // 40%
    
    // Time lock para team withdrawals (7 dias)
    uint256 public withdrawalLockPeriod = 7 days;
    
    // Balances
    uint256 public teamBalance;
    uint256 public yieldBalance;
    
    // Withdrawal tracking
    uint256 public lastWithdrawalTime;
    
    // Stats
    uint256 public totalFeesCollected;
    uint256 public totalTeamWithdrawn;
    uint256 public totalYieldSent;
    
    // ========== Events ==========
    
    event FeeDeposited(
        address indexed from,
        uint256 amount,
        uint256 teamAmount,
        uint256 yieldAmount
    );
    
    event TeamFeesWithdrawn(
        address indexed to,
        uint256 amount
    );
    
    event YieldSent(
        address indexed token,
        uint256 amount
    );
    
    event TeamWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    
    event YieldDistributorUpdated(
        address indexed oldDistributor,
        address indexed newDistributor
    );

    // ========== Constructor ==========
    
    constructor(
        address _teamWallet,
        address _yieldDistributor
    ) Ownable(msg.sender) {
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_yieldDistributor != address(0), "Invalid yield distributor");
        
        teamWallet = _teamWallet;
        yieldDistributor = _yieldDistributor;
        
        lastWithdrawalTime = block.timestamp;
    }

    // ========== Fee Collection ==========
    
    /**
     * @notice Recebe fee e faz split automático
     */
    receive() external payable {
        _processFee(msg.value);
    }
    
    /**
     * @notice Deposita fee explicitamente
     */
    function depositFee() external payable {
        require(msg.value > 0, "Amount must be > 0");
        _processFee(msg.value);
    }
    
    /**
     * @dev Processa fee e faz split
     */
    function _processFee(uint256 amount) internal {
        uint256 teamAmount = (amount * teamSplit) / 10000;
        uint256 yieldAmount = amount - teamAmount;
        
        teamBalance += teamAmount;
        yieldBalance += yieldAmount;
        totalFeesCollected += amount;
        
        emit FeeDeposited(
            msg.sender,
            amount,
            teamAmount,
            yieldAmount
        );
    }

    // ========== Team Withdrawals ==========
    
    /**
     * @notice Team retira seus fees (com time lock)
     */
    function withdrawTeamFees() external nonReentrant {
        require(msg.sender == teamWallet, "Not team wallet");
        require(block.timestamp >= lastWithdrawalTime + withdrawalLockPeriod, "Withdrawal locked");
        require(teamBalance > 0, "No balance");
        
        uint256 amount = teamBalance;
        teamBalance = 0;
        
        lastWithdrawalTime = block.timestamp;
        totalTeamWithdrawn += amount;
        
        (bool success, ) = teamWallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit TeamFeesWithdrawn(teamWallet, amount);
    }

    // ========== Yield Distribution ==========
    
    /**
     * @notice Envia yield acumulado para YieldDistributor
     * @param token Token para depositar yield
     */
    function sendYieldToDistributor(address token) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(yieldBalance > 0, "No yield to send");
        
        uint256 amount = yieldBalance;
        yieldBalance = 0;
        
        totalYieldSent += amount;
        
        IYieldDistributor(yieldDistributor).depositYield{value: amount}(token);
        
        emit YieldSent(token, amount);
    }

    // ========== View Functions ==========
    
    /**
     * @notice Retorna balances atuais
     */
    function getBalances() external view returns (
        uint256 team,
        uint256 yield
    ) {
        return (teamBalance, yieldBalance);
    }
    
    /**
     * @notice Retorna stats
     */
    function getStats() external view returns (
        uint256 totalCollected,
        uint256 totalWithdrawn,
        uint256 totalSent,
        uint256 lastWithdrawal,
        uint256 nextWithdrawal
    ) {
        return (
            totalFeesCollected,
            totalTeamWithdrawn,
            totalYieldSent,
            lastWithdrawalTime,
            lastWithdrawalTime + withdrawalLockPeriod
        );
    }
    
    /**
     * @notice Info sobre withdrawal
     */
    function getWithdrawalInfo() external view returns (
        bool canWithdraw,
        uint256 timeLeft
    ) {
        uint256 nextWithdrawal = lastWithdrawalTime + withdrawalLockPeriod;
        canWithdraw = block.timestamp >= nextWithdrawal && teamBalance > 0;
        
        if (block.timestamp >= nextWithdrawal) {
            timeLeft = 0;
        } else {
            timeLeft = nextWithdrawal - block.timestamp;
        }
        
        return (canWithdraw, timeLeft);
    }

    // ========== Admin Functions ==========
    
    /**
     * @notice Atualiza team wallet
     */
    function updateTeamWallet(address _teamWallet) external onlyOwner {
        require(_teamWallet != address(0), "Invalid address");
        address oldWallet = teamWallet;
        teamWallet = _teamWallet;
        emit TeamWalletUpdated(oldWallet, _teamWallet);
    }
    
    /**
     * @notice Atualiza yield distributor
     */
    function updateYieldDistributor(address _yieldDistributor) external onlyOwner {
        require(_yieldDistributor != address(0), "Invalid address");
        address oldDistributor = yieldDistributor;
        yieldDistributor = _yieldDistributor;
        emit YieldDistributorUpdated(oldDistributor, _yieldDistributor);
    }
    
    /**
     * @notice Atualiza minimum payment amount
     */
    function updateMinPaymentAmount(uint256 _minAmount) external onlyOwner {
        // Placeholder - não usado no FeeCollector mas mantido para compatibilidade
    }
    
    /**
     * @notice Emergency: reseta time lock
     */
    function resetWithdrawalLock() external onlyOwner {
        lastWithdrawalTime = 0;
    }
    
    /**
     * @notice Emergency: retira todo ETH
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        
        teamBalance = 0;
        yieldBalance = 0;
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        // Pausable não implementado, mas mantido para testes
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        // Pausable não implementado, mas mantido para testes
    }
}
