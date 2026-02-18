// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LaunchpadToken
 * @notice Token ERC-20 padrão criado pelo TokenFactory
 * @dev Token simples sem funcionalidades extras (mint/burn controlado não é necessário)
 */
contract LaunchpadToken is ERC20 {
    address public creator;
    uint256 public immutable createdAt;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _creator
    ) ERC20(name, symbol) {
        creator = _creator;
        createdAt = block.timestamp;
        _mint(_creator, initialSupply);
    }
}

/**
 * @title TokenFactory
 * @notice Factory para criar tokens na plataforma Launchpad 2.0
 * @dev Deploy de tokens ERC-20 com fee, tracking e registro on-chain
 * 
 * Features:
 * - Deploy de tokens com nome, símbolo e supply customizáveis
 * - Fee de lançamento (0-100 USD configurável)
 * - Registro on-chain de todos os tokens criados
 * - Tracking de creator por wallet address
 * - Pausável para manutenção
 * - Eventos para indexação off-chain
 */
contract TokenFactory is Ownable, ReentrancyGuard, Pausable {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Fee de lançamento em wei (0 = grátis durante beta)
    uint256 public launchFee;
    
    /// @notice Wallet que recebe as fees
    address public feeReceiver;
    
    /// @notice Supply mínimo para prevenir tokens inúteis
    uint256 public constant MIN_SUPPLY = 1000 * 10**18; // 1,000 tokens mínimo
    
    /// @notice Supply máximo para prevenir overflow
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 bilhão tokens
    
    /// @notice Contador de tokens criados
    uint256 public totalTokensCreated;
    
    /// @notice Mapping de creator → lista de tokens criados
    mapping(address => address[]) public creatorTokens;
    
    /// @notice Lista de todos os tokens criados
    address[] public allTokens;
    
    /// @notice Informações extras do token (metadata)
    struct TokenInfo {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 initialSupply;
        uint256 createdAt;
        bool isActive;
    }
    
    /// @notice Mapping tokenAddress → TokenInfo
    mapping(address => TokenInfo) public tokenInfo;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        uint256 timestamp
    );
    
    event LaunchFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event TokenDeactivated(address indexed tokenAddress, uint256 timestamp);
    event FeeWithdrawn(address indexed receiver, uint256 amount);
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @param _feeReceiver Endereço que recebe as fees de lançamento
     * @param _launchFee Fee inicial (pode ser 0 para beta)
     */
    constructor(address _feeReceiver, uint256 _launchFee) Ownable(msg.sender) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
        launchFee = _launchFee;
    }
    
    // ============================================
    // MAIN FUNCTION - CREATE TOKEN
    // ============================================
    
    /**
     * @notice Cria um novo token ERC-20
     * @param name Nome do token (ex: "My Memecoin")
     * @param symbol Símbolo do token (ex: "MEME")
     * @param initialSupply Supply inicial (em wei, com 18 decimais)
     * @return tokenAddress Endereço do token criado
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external payable nonReentrant whenNotPaused returns (address tokenAddress) {
        // Validações
        require(bytes(name).length > 0 && bytes(name).length <= 50, "Invalid name length");
        require(bytes(symbol).length > 0 && bytes(symbol).length <= 10, "Invalid symbol length");
        require(initialSupply >= MIN_SUPPLY, "Supply too low");
        require(initialSupply <= MAX_SUPPLY, "Supply too high");
        require(msg.value >= launchFee, "Insufficient fee");
        
        // Deploy do token
        LaunchpadToken newToken = new LaunchpadToken(
            name,
            symbol,
            initialSupply,
            msg.sender
        );
        
        tokenAddress = address(newToken);
        
        // Registro on-chain
        tokenInfo[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            initialSupply: initialSupply,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Tracking
        creatorTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        totalTokensCreated++;
        
        // Evento para indexação
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            initialSupply,
            block.timestamp
        );
        
        // Retornar excesso de ETH se houver
        if (msg.value > launchFee) {
            (bool success, ) = msg.sender.call{value: msg.value - launchFee}("");
            require(success, "Refund failed");
        }
        
        return tokenAddress;
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Retorna todos os tokens criados por um creator
     * @param creator Endereço do creator
     * @return Lista de endereços de tokens
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    /**
     * @notice Retorna os últimos N tokens criados
     * @param count Quantidade de tokens para retornar
     * @return Lista de endereços de tokens
     */
    function getRecentTokens(uint256 count) external view returns (address[] memory) {
        uint256 totalCount = allTokens.length;
        if (count > totalCount) {
            count = totalCount;
        }
        
        address[] memory recentTokens = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            recentTokens[i] = allTokens[totalCount - 1 - i];
        }
        
        return recentTokens;
    }
    
    /**
     * @notice Retorna informações completas de um token
     * @param tokenAddress Endereço do token
     * @return TokenInfo struct com todas as informações
     */
    function getTokenInfo(address tokenAddress) external view returns (TokenInfo memory) {
        return tokenInfo[tokenAddress];
    }
    
    /**
     * @notice Verifica se um endereço é um token criado pela factory
     * @param tokenAddress Endereço para verificar
     * @return true se for token válido da plataforma
     */
    function isValidToken(address tokenAddress) external view returns (bool) {
        return tokenInfo[tokenAddress].isActive;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Atualiza a fee de lançamento
     * @param newFee Nova fee em wei
     */
    function setLaunchFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = launchFee;
        launchFee = newFee;
        emit LaunchFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Atualiza o endereço que recebe fees
     * @param newReceiver Novo endereço
     */
    function setFeeReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != address(0), "Invalid receiver");
        address oldReceiver = feeReceiver;
        feeReceiver = newReceiver;
        emit FeeReceiverUpdated(oldReceiver, newReceiver);
    }
    
    /**
     * @notice Desativa um token (em caso de scam/violação de regras)
     * @param tokenAddress Endereço do token a desativar
     */
    function deactivateToken(address tokenAddress) external onlyOwner {
        require(tokenInfo[tokenAddress].isActive, "Token not active");
        tokenInfo[tokenAddress].isActive = false;
        emit TokenDeactivated(tokenAddress, block.timestamp);
    }
    
    /**
     * @notice Saca fees acumuladas
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = feeReceiver.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FeeWithdrawn(feeReceiver, balance);
    }
    
    /**
     * @notice Pausa criação de novos tokens (emergência)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Despausa criação de novos tokens
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============================================
    // FALLBACK
    // ============================================
    
    /**
     * @notice Recebe ETH enviado diretamente (conta como fee)
     */
    receive() external payable {}
}
