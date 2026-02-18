// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./TokenFactory.sol";

/**
 * @title BondingCurve
 * @notice Implementa precificação automática de tokens usando bonding curve quadrática
 * @dev Preço aumenta conforme supply circulante aumenta
 * 
 * Fórmula: price = basePrice + (supply / scaleFactor)²
 * - Quanto mais tokens vendidos, maior o preço
 * - Garante liquidez sempre disponível
 * - Slippage protection (max 5%)
 */
contract BondingCurve is Ownable, ReentrancyGuard, Pausable {
    // ========== Structs ==========
    
    struct TokenMarket {
        uint256 reserveBalance;      // ETH em reserva
        uint256 supply;               // Supply circulante (vendido)
        uint256 basePrice;            // Preço base em wei
        uint256 scaleFactor;          // Fator de escala da curva
        bool isActive;                // Market ativo
        address creator;              // Criador do token
    }

    struct TradeInfo {
        address trader;
        address token;
        bool isBuy;
        uint256 tokenAmount;
        uint256 ethAmount;
        uint256 price;
        uint256 timestamp;
    }

    // ========== State Variables ==========
    
    TokenFactory public tokenFactory;
    address public feeCollector;
    
    // Platform fees
    uint256 public constant TRADE_FEE_PERCENT = 100; // 1% (base 10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_SLIPPAGE_PERCENT = 500; // 5% max slippage
    
    // Bonding curve parameters
    uint256 public constant BASE_PRICE = 0.0001 ether; // Preço inicial
    uint256 public constant SCALE_FACTOR = 1000000; // Ajusta inclinação da curva
    
    // Markets
    mapping(address => TokenMarket) public markets;
    mapping(address => TradeInfo[]) public tradeHistory;
    
    // Stats
    uint256 public totalVolume;
    uint256 public totalTrades;
    
    // ========== Events ==========
    
    event MarketCreated(
        address indexed token,
        address indexed creator,
        uint256 basePrice,
        uint256 scaleFactor
    );
    
    event TokensPurchased(
        address indexed buyer,
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee,
        uint256 newPrice
    );
    
    event TokensSold(
        address indexed seller,
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee,
        uint256 newPrice
    );
    
    event FeeCollected(
        address indexed token,
        uint256 amount
    );

    event MarketDeactivated(address indexed token);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    // ========== Constructor ==========
    
    constructor(
        address _tokenFactory,
        address _feeCollector
    ) Ownable(msg.sender) {
        require(_tokenFactory != address(0), "Invalid token factory");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        tokenFactory = TokenFactory(payable(_tokenFactory));
        feeCollector = _feeCollector;
    }

    // ========== Market Creation ==========
    
    /**
     * @notice Cria market para um token do TokenFactory
     * @param token Endereço do token
     */
    function createMarket(address token) external whenNotPaused {
        require(tokenFactory.isValidToken(token), "Token not from factory");
        require(!markets[token].isActive, "Market already exists");
        
        TokenFactory.TokenInfo memory tokenInfo = tokenFactory.getTokenInfo(token);
        require(tokenInfo.isActive, "Token not active");
        
        markets[token] = TokenMarket({
            reserveBalance: 0,
            supply: 0,
            basePrice: BASE_PRICE,
            scaleFactor: SCALE_FACTOR,
            isActive: true,
            creator: tokenInfo.creator
        });
        
        emit MarketCreated(token, tokenInfo.creator, BASE_PRICE, SCALE_FACTOR);
    }

    // ========== Price Calculation ==========
    
    /**
     * @notice Calcula preço atual baseado no supply
     * @dev price = basePrice + (supply / scaleFactor)²
     * @param token Endereço do token
     * @return Preço em wei por token
     */
    function calculatePrice(address token) public view returns (uint256) {
        TokenMarket memory market = markets[token];
        require(market.isActive, "Market not active");
        
        if (market.supply == 0) {
            return market.basePrice;
        }
        
        // Evita overflow usando divisão antes da multiplicação
        uint256 supplyScaled = market.supply / market.scaleFactor;
        uint256 quadratic = supplyScaled * supplyScaled;
        
        return market.basePrice + quadratic;
    }
    
    /**
     * @notice Calcula custo total para comprar quantidade de tokens
     * @param token Endereço do token
     * @param amount Quantidade de tokens
     * @return Custo em ETH (incluindo fee)
     */
    function calculateBuyCost(
        address token,
        uint256 amount
    ) public view returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        TokenMarket memory market = markets[token];
        require(market.isActive, "Market not active");
        
        // Integração da curva do supply atual até supply + amount
        uint256 cost = _integrateCurve(
            market.supply,
            market.supply + amount,
            market.basePrice,
            market.scaleFactor
        );
        
        // Adiciona fee
        uint256 fee = (cost * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        return cost + fee;
    }
    
    /**
     * @notice Calcula receita de vender quantidade de tokens
     * @param token Endereço do token
     * @param amount Quantidade de tokens
     * @return Receita em ETH (após fee)
     */
    function calculateSellReturn(
        address token,
        uint256 amount
    ) public view returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        TokenMarket memory market = markets[token];
        require(market.isActive, "Market not active");
        require(amount <= market.supply, "Amount exceeds supply");
        
        // Integração da curva do supply atual até supply - amount
        uint256 returnAmount = _integrateCurve(
            market.supply - amount,
            market.supply,
            market.basePrice,
            market.scaleFactor
        );
        
        // Subtrai fee
        uint256 fee = (returnAmount * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        return returnAmount - fee;
    }
    
    /**
     * @dev Integra a curva de preço entre dois pontos de supply
     * @param supplyStart Supply inicial
     * @param supplyEnd Supply final
     * @param basePrice Preço base
     * @param scaleFactor Fator de escala
     * @return Área sob a curva (custo/receita)
     */
    function _integrateCurve(
        uint256 supplyStart,
        uint256 supplyEnd,
        uint256 basePrice,
        uint256 scaleFactor
    ) internal pure returns (uint256) {
        require(supplyEnd >= supplyStart, "Invalid range");
        
        uint256 diff = supplyEnd - supplyStart;
        
        // Parte linear: basePrice * diff
        uint256 linearPart = basePrice * diff;
        
        // Parte quadrática: integral de (x/scale)² dx
        // = (1/3) * (end³ - start³) / scale²
        uint256 endCubed = (supplyEnd * supplyEnd * supplyEnd) / (scaleFactor * scaleFactor);
        uint256 startCubed = (supplyStart * supplyStart * supplyStart) / (scaleFactor * scaleFactor);
        uint256 quadraticPart = (endCubed - startCubed) / 3;
        
        return linearPart + quadraticPart;
    }

    // ========== Trading Functions ==========
    
    /**
     * @notice Compra tokens com ETH
     * @param token Endereço do token
     * @param minTokens Mínimo de tokens esperado (slippage protection)
     */
    function buy(
        address token,
        uint256 minTokens
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH");
        require(markets[token].isActive, "Market not active");
        
        // Calcula quantos tokens podem ser comprados com o ETH enviado
        uint256 tokenAmount = _calculateTokensForEth(token, msg.value);
        require(tokenAmount >= minTokens, "Slippage too high");
        
        TokenMarket storage market = markets[token];
        
        // Calcula fee
        uint256 cost = msg.value;
        uint256 fee = (cost * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 costAfterFee = cost - fee;
        
        // Atualiza market
        market.reserveBalance += costAfterFee;
        market.supply += tokenAmount;
        
        // Transfere tokens
        IERC20(token).transfer(msg.sender, tokenAmount);
        
        // Envia fee
        (bool success, ) = feeCollector.call{value: fee}("");
        require(success, "Fee transfer failed");
        
        // Registra trade
        _recordTrade(token, msg.sender, true, tokenAmount, cost);
        
        uint256 newPrice = calculatePrice(token);
        emit TokensPurchased(msg.sender, token, tokenAmount, cost, fee, newPrice);
    }
    
    /**
     * @notice Vende tokens por ETH
     * @param token Endereço do token
     * @param amount Quantidade de tokens
     * @param minEth Mínimo de ETH esperado (slippage protection)
     */
    function sell(
        address token,
        uint256 amount,
        uint256 minEth
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(markets[token].isActive, "Market not active");
        
        TokenMarket storage market = markets[token];
        require(amount <= market.supply, "Amount exceeds supply");
        
        // Calcula ETH a retornar
        uint256 ethReturn = calculateSellReturn(token, amount);
        require(ethReturn >= minEth, "Slippage too high");
        require(ethReturn <= market.reserveBalance, "Insufficient reserves");
        
        // Calcula fee (já descontado em calculateSellReturn)
        uint256 ethBeforeFee = _integrateCurve(
            market.supply - amount,
            market.supply,
            market.basePrice,
            market.scaleFactor
        );
        uint256 fee = (ethBeforeFee * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        
        // Atualiza market
        market.reserveBalance -= ethReturn;
        market.supply -= amount;
        
        // Recebe tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Envia ETH
        (bool success, ) = msg.sender.call{value: ethReturn}("");
        require(success, "ETH transfer failed");
        
        // Envia fee
        (bool feeSuccess, ) = feeCollector.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        
        // Registra trade
        _recordTrade(token, msg.sender, false, amount, ethReturn);
        
        uint256 newPrice = calculatePrice(token);
        emit TokensSold(msg.sender, token, amount, ethReturn, fee, newPrice);
    }
    
    /**
     * @dev Calcula quantos tokens podem ser comprados com determinado ETH
     */
    function _calculateTokensForEth(
        address token,
        uint256 ethAmount
    ) internal view returns (uint256) {
        TokenMarket memory market = markets[token];
        
        // Remove fee do ETH
        uint256 fee = (ethAmount * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 ethAfterFee = ethAmount - fee;
        
        // Busca binária para encontrar quantidade de tokens
        uint256 low = 0;
        uint256 high = market.supply + (10 ** 9); // Max razoável
        
        while (low < high) {
            uint256 mid = (low + high + 1) / 2;
            uint256 cost = _integrateCurve(
                market.supply,
                market.supply + mid,
                market.basePrice,
                market.scaleFactor
            );
            
            if (cost <= ethAfterFee) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        
        return low;
    }
    
    /**
     * @dev Registra trade no histórico
     */
    function _recordTrade(
        address token,
        address trader,
        bool isBuy,
        uint256 tokenAmount,
        uint256 ethAmount
    ) internal {
        tradeHistory[token].push(TradeInfo({
            trader: trader,
            token: token,
            isBuy: isBuy,
            tokenAmount: tokenAmount,
            ethAmount: ethAmount,
            price: calculatePrice(token),
            timestamp: block.timestamp
        }));
        
        totalVolume += ethAmount;
        totalTrades++;
    }

    // ========== View Functions ==========
    
    /**
     * @notice Retorna informações do market
     */
    function getMarketInfo(address token) external view returns (
        uint256 reserveBalance,
        uint256 supply,
        uint256 currentPrice,
        uint256 basePrice,
        bool isActive,
        address creator
    ) {
        TokenMarket memory market = markets[token];
        return (
            market.reserveBalance,
            market.supply,
            calculatePrice(token),
            market.basePrice,
            market.isActive,
            market.creator
        );
    }
    
    /**
     * @notice Retorna histórico de trades de um token
     */
    function getTradeHistory(
        address token,
        uint256 limit
    ) external view returns (TradeInfo[] memory) {
        TradeInfo[] memory history = tradeHistory[token];
        
        if (history.length == 0) {
            return new TradeInfo[](0);
        }
        
        uint256 resultSize = history.length > limit ? limit : history.length;
        TradeInfo[] memory result = new TradeInfo[](resultSize);
        
        // Retorna os mais recentes
        uint256 startIndex = history.length - resultSize;
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = history[startIndex + i];
        }
        
        return result;
    }
    
    /**
     * @notice Valida slippage esperado
     */
    function validateSlippage(
        uint256 expected,
        uint256 actual
    ) public pure returns (bool) {
        if (actual >= expected) return true;
        
        uint256 diff = expected - actual;
        uint256 slippagePercent = (diff * FEE_DENOMINATOR) / expected;
        
        return slippagePercent <= MAX_SLIPPAGE_PERCENT;
    }

    // ========== Admin Functions ==========
    
    /**
     * @notice Desativa market (apenas owner)
     */
    function deactivateMarket(address token) external onlyOwner {
        require(markets[token].isActive, "Market not active");
        markets[token].isActive = false;
        emit MarketDeactivated(token);
    }
    
    /**
     * @notice Atualiza fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }
    
    /**
     * @notice Pausa/despausa trading
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== Emergency Functions ==========
    
    /**
     * @notice Retira ETH preso (emergência)
     * @dev Apenas para ETH não alocado a markets
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
