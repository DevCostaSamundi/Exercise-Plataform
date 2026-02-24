// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Token USDC simulado para testes locais e testnet (Polygon Amoy)
 * @notice NÃO usar em produção. Apenas para desenvolvimento.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6; // USDC usa 6 casas decimais

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        // Minta 1 milhão de USDC para o deployer
        _mint(msg.sender, 1_000_000 * 10**_DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Minta USDC para qualquer endereço (apenas testes)
     * @param to Endereço que receberá os tokens
     * @param amount Valor em USDC (com 6 decimais)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Endereco invalido");
        require(amount > 0, "Valor invalido");
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Mint faucet — qualquer um pode chamar para receber 100 USDC de teste
     * @dev Limita a 100 USDC por chamada para simular faucets reais
     */
    function faucet() external {
        uint256 amount = 100 * 10**_DECIMALS; // 100 USDC
        _mint(msg.sender, amount);
        emit Minted(msg.sender, amount);
    }

    /**
     * @notice Burn tokens para testes de saldo insuficiente
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit Burned(from, amount);
    }
}