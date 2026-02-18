// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PaymentSplitter
 * @notice 100% Crypto Native Payment System for Adult Content Platform
 * @dev Users send USDC directly, contract splits automatically
 * 
 * Features:
 * - Direct wallet-to-wallet payments
 * - Automatic 90/10 split (Creator/Platform)
 * - No intermediaries, no KYC, no censorship
 * - Withdraw anytime
 * - Multi-creator support
 * - Gas optimized
 */
contract PaymentSplitter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice USDC token contract on Polygon
    IERC20 public immutable USDC;
    
    /// @notice Platform wallet (receives 10%)
    address public platformWallet;
    
    /// @notice Platform fee in basis points (1000 = 10%)
    uint256 public constant PLATFORM_FEE_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Minimum payment to prevent dust attacks
    uint256 public minPaymentAmount = 1 * 10**6; // 1 USDC
    
    /// @notice Creator balances (pending withdrawal)
    mapping(address => uint256) public creatorBalances;
    
    /// @notice Platform accumulated balance
    uint256 public platformBalance;
    
    /// @notice Total processed volume
    uint256 public totalVolumeProcessed;

    // ============================================
    // EVENTS
    // ============================================

    event PaymentReceived(
        address indexed payer,
        address indexed creator,
        string orderId,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 platformFee,
        uint256 timestamp
    );
    
    event CreatorWithdrawal(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );
    
    event PlatformWithdrawal(
        uint256 amount,
        uint256 timestamp
    );
    
    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    
    event MinPaymentUpdated(
        uint256 oldAmount,
        uint256 newAmount
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @param _usdc USDC token address on Polygon
     * @param _platformWallet Platform wallet address
     */
    constructor(address _usdc, address _platformWallet) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_platformWallet != address(0), "Invalid platform wallet");
        
        USDC = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    // ============================================
    // MAIN PAYMENT FUNCTION
    // ============================================

    /**
     * @notice Process a payment from user to creator
     * @dev User must approve this contract to spend USDC first
     * @param creator Creator's wallet address
     * @param amount Amount in USDC (with 6 decimals)
     * @param orderId Unique order ID from platform
     */
    function pay(
        address creator,
        uint256 amount,
        string calldata orderId
    ) external nonReentrant whenNotPaused {
        require(creator != address(0), "Invalid creator");
        require(creator != msg.sender, "Cannot pay yourself");
        require(amount >= minPaymentAmount, "Below minimum");
        require(bytes(orderId).length > 0, "Order ID required");
        
        // Transfer USDC from user to contract
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate split
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorAmount = amount - platformFee;
        
        // Update balances
        creatorBalances[creator] += creatorAmount;
        platformBalance += platformFee;
        totalVolumeProcessed += amount;
        
        // Emit event for backend tracking
        emit PaymentReceived(
            msg.sender,
            creator,
            orderId,
            amount,
            creatorAmount,
            platformFee,
            block.timestamp
        );
    }

    // ============================================
    // WITHDRAWAL FUNCTIONS
    // ============================================

    /**
     * @notice Creator withdraws their accumulated balance
     */
    function withdrawCreator() external nonReentrant {
        uint256 balance = creatorBalances[msg.sender];
        require(balance > 0, "No balance");
        
        // Reset balance before transfer (CEI pattern)
        creatorBalances[msg.sender] = 0;
        
        // Transfer USDC
        USDC.safeTransfer(msg.sender, balance);
        
        emit CreatorWithdrawal(msg.sender, balance, block.timestamp);
    }
    
    /**
     * @notice Platform withdraws accumulated fees
     * @dev Only callable by platform wallet or owner
     */
    function withdrawPlatform() external nonReentrant {
        require(
            msg.sender == platformWallet || msg.sender == owner(),
            "Not authorized"
        );
        
        uint256 balance = platformBalance;
        require(balance > 0, "No balance");
        
        // Reset balance
        platformBalance = 0;
        
        // Transfer USDC
        USDC.safeTransfer(platformWallet, balance);
        
        emit PlatformWithdrawal(balance, block.timestamp);
    }

    // ============================================
    // BATCH PAYMENT (Gas Optimization)
    // ============================================

    /**
     * @notice Process multiple payments in one transaction
     * @dev Useful for subscription renewals or tips
     */
    function payBatch(
        address[] calldata creators,
        uint256[] calldata amounts,
        string[] calldata orderIds
    ) external nonReentrant whenNotPaused {
        uint256 length = creators.length;
        require(
            length == amounts.length && length == orderIds.length,
            "Length mismatch"
        );
        require(length > 0 && length <= 50, "Invalid batch size");
        
        uint256 totalAmount = 0;
        
        // Calculate total
        for (uint256 i = 0; i < length; i++) {
            require(amounts[i] >= minPaymentAmount, "Below minimum");
            totalAmount += amounts[i];
        }
        
        // Transfer total USDC once
        USDC.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Process each payment
        for (uint256 i = 0; i < length; i++) {
            address creator = creators[i];
            uint256 amount = amounts[i];
            
            require(creator != address(0) && creator != msg.sender, "Invalid creator");
            
            uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            uint256 creatorAmount = amount - platformFee;
            
            creatorBalances[creator] += creatorAmount;
            platformBalance += platformFee;
            totalVolumeProcessed += amount;
            
            emit PaymentReceived(
                msg.sender,
                creator,
                orderIds[i],
                amount,
                creatorAmount,
                platformFee,
                block.timestamp
            );
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get creator's pending balance
     */
    function getCreatorBalance(address creator) external view returns (uint256) {
        return creatorBalances[creator];
    }
    
    /**
     * @notice Calculate split for a given amount
     */
    function calculateSplit(uint256 amount) 
        external 
        pure 
        returns (uint256 creatorAmount, uint256 platformFee) 
    {
        platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        creatorAmount = amount - platformFee;
    }
    
    /**
     * @notice Get contract's total USDC balance
     */
    function getTotalBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update platform wallet
     */
    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @notice Update minimum payment amount
     */
    function updateMinPayment(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Invalid amount");
        uint256 oldMin = minPaymentAmount;
        minPaymentAmount = newMin;
        emit MinPaymentUpdated(oldMin, newMin);
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdrawal (only if critical bug)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "No balance");
        USDC.safeTransfer(owner(), balance);
    }
}