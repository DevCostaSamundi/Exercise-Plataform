// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentSplitter
 * @notice Receives USDC payments, splits 90% to creator and 10% to platform
 */
contract PaymentSplitter is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    address public platformWallet;
    uint256 public platformFeePercent = 10; // 10%

    event PaymentProcessed(
        string indexed orderId,
        address indexed payer,
        address indexed creator,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 platformFee
    );

    event PlatformWalletUpdated(address oldWallet, address newWallet);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _usdc, address _platformWallet) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    /**
     * @notice Process a payment: payer sends USDC, split between creator and platform
     * @param creator Address of the content creator
     * @param amount Total USDC amount (in smallest unit, 6 decimals)
     * @param orderId Unique order ID from the backend
     */
    function pay(
        address creator,
        uint256 amount,
        string calldata orderId
    ) external nonReentrant {
        require(creator != address(0), "Invalid creator address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID required");

        // Calculate split
        uint256 fee = (amount * platformFeePercent) / 100;
        uint256 creatorAmount = amount - fee;

        // Transfer USDC from payer to creator
        require(
            usdc.transferFrom(msg.sender, creator, creatorAmount),
            "Creator transfer failed"
        );

        // Transfer platform fee
        if (fee > 0) {
            require(
                usdc.transferFrom(msg.sender, platformWallet, fee),
                "Platform fee transfer failed"
            );
        }

        emit PaymentProcessed(
            orderId,
            msg.sender,
            creator,
            amount,
            creatorAmount,
            fee
        );
    }

    // --- Admin functions ---

    function setPlatformWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        emit PlatformWalletUpdated(platformWallet, _wallet);
        platformWallet = _wallet;
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 30, "Fee too high (max 30%)");
        emit PlatformFeeUpdated(platformFeePercent, _feePercent);
        platformFeePercent = _feePercent;
    }
}