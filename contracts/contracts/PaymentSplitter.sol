// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title PaymentSplitter
 * @notice FlowConnect — Sistema de Pagamento 100% Crypto Native
 * @dev Suporta pagamentos diretos e meta-transactions (gasless via EIP-2771)
 *
 * Fluxo:
 * 1. Usuário aprova USDC para este contrato
 * 2. Chama pay() ou relayer chama payGasless() em nome do usuário
 * 3. Contrato divide automaticamente: 90% criador / 10% plataforma
 * 4. Eventos emitidos → backend processa via Alchemy Webhook
 * 5. Criador saca quando quiser com withdrawCreator()
 */
contract PaymentSplitter is ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Token USDC na Polygon
    IERC20 public immutable USDC;

    /// @notice Carteira da plataforma (recebe 10%)
    address public platformWallet;

    /// @notice Taxa da plataforma em basis points (1000 = 10%)
    uint256 public constant PLATFORM_FEE_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Pagamento mínimo para evitar ataques de dust
    uint256 public minPaymentAmount = 1 * 10**6; // 1 USDC

    /// @notice Saldos pendentes dos criadores
    mapping(address => uint256) public creatorBalances;

    /// @notice Saldo acumulado da plataforma
    uint256 public platformBalance;

    /// @notice Volume total processado
    uint256 public totalVolumeProcessed;

    /// @notice Relayer autorizado para meta-transactions
    address public trustedForwarder;

    /// @notice Nonces para meta-transactions (anti-replay)
    mapping(address => uint256) public nonces;

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

    event TrustedForwarderUpdated(
        address indexed oldForwarder,
        address indexed newForwarder
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @param _usdc Endereço do token USDC na Polygon
     * @param _platformWallet Carteira da plataforma
     * @param _trustedForwarder Endereço do relayer para gasless (pode ser address(0) para desativar)
     */
    constructor(
        address _usdc,
        address _platformWallet,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder == address(0) ? address(this) : _trustedForwarder)
      Ownable(msg.sender) {
        require(_usdc != address(0), "USDC invalido");
        require(_platformWallet != address(0), "Carteira invalida");

        USDC = IERC20(_usdc);
        platformWallet = _platformWallet;
        trustedForwarder = _trustedForwarder;
    }

    // ============================================
    // FUNÇÃO PRINCIPAL DE PAGAMENTO
    // ============================================

    /**
     * @notice Processa pagamento do usuário para o criador
     * @dev Usuário deve ter aprovado este contrato para gastar USDC
     * @param creator Endereço da carteira do criador
     * @param amount Valor em USDC (com 6 decimais)
     * @param orderId ID único do pedido gerado pelo backend
     */
    function pay(
        address creator,
        uint256 amount,
        string calldata orderId
    ) external nonReentrant whenNotPaused {
        address payer = _msgSender(); // ERC2771: retorna usuário real, não o relayer
        _processPayment(payer, creator, amount, orderId);
    }

    /**
     * @notice Processamento interno do pagamento
     */
    function _processPayment(
        address payer,
        address creator,
        uint256 amount,
        string calldata orderId
    ) internal {
        require(creator != address(0), "Criador invalido");
        require(creator != payer, "Nao pode pagar a si mesmo");
        require(amount >= minPaymentAmount, "Abaixo do minimo");
        require(bytes(orderId).length > 0, "Order ID obrigatorio");

        // Transfere USDC do usuário para o contrato
        USDC.safeTransferFrom(payer, address(this), amount);

        // Calcula divisão
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorAmount = amount - platformFee;

        // Atualiza saldos
        creatorBalances[creator] += creatorAmount;
        platformBalance += platformFee;
        totalVolumeProcessed += amount;

        // Emite evento para o backend
        emit PaymentReceived(
            payer,
            creator,
            orderId,
            amount,
            creatorAmount,
            platformFee,
            block.timestamp
        );
    }

    // ============================================
    // PAGAMENTO EM LOTE (Otimização de Gas)
    // ============================================

    /**
     * @notice Processa múltiplos pagamentos em uma transação
     * @dev Útil para renovação de assinaturas ou tips em lote
     */
    function payBatch(
        address[] calldata creators,
        uint256[] calldata amounts,
        string[] calldata orderIds
    ) external nonReentrant whenNotPaused {
        address payer = _msgSender();
        uint256 length = creators.length;
        require(
            length == amounts.length && length == orderIds.length,
            "Tamanhos incompativeis"
        );
        require(length > 0 && length <= 50, "Tamanho de lote invalido");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < length; i++) {
            require(amounts[i] >= minPaymentAmount, "Abaixo do minimo");
            totalAmount += amounts[i];
        }

        // Transfere total de USDC de uma vez
        USDC.safeTransferFrom(payer, address(this), totalAmount);

        // Processa cada pagamento
        for (uint256 i = 0; i < length; i++) {
            address creator = creators[i];
            uint256 amount = amounts[i];

            require(creator != address(0) && creator != payer, "Criador invalido");

            uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            uint256 creatorAmount = amount - platformFee;

            creatorBalances[creator] += creatorAmount;
            platformBalance += platformFee;
            totalVolumeProcessed += amount;

            emit PaymentReceived(
                payer,
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
    // FUNÇÕES DE SAQUE
    // ============================================

    /**
     * @notice Criador saca seu saldo acumulado
     */
    function withdrawCreator() external nonReentrant {
        address creator = _msgSender();
        uint256 balance = creatorBalances[creator];
        require(balance > 0, "Sem saldo");

        // Zera saldo antes da transferência (padrão CEI)
        creatorBalances[creator] = 0;

        USDC.safeTransfer(creator, balance);

        emit CreatorWithdrawal(creator, balance, block.timestamp);
    }

    /**
     * @notice Plataforma saca as taxas acumuladas
     * @dev Apenas carteira da plataforma ou owner
     */
    function withdrawPlatform() external nonReentrant {
        require(
            msg.sender == platformWallet || msg.sender == owner(),
            "Nao autorizado"
        );

        uint256 balance = platformBalance;
        require(balance > 0, "Sem saldo");

        platformBalance = 0;

        USDC.safeTransfer(platformWallet, balance);

        emit PlatformWithdrawal(balance, block.timestamp);
    }

    // ============================================
    // FUNÇÕES DE CONSULTA
    // ============================================

    /**
     * @notice Retorna saldo pendente de um criador
     */
    function getCreatorBalance(address creator) external view returns (uint256) {
        return creatorBalances[creator];
    }

    /**
     * @notice Calcula a divisão para um determinado valor
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
     * @notice Retorna saldo total de USDC no contrato
     */
    function getTotalBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    /**
     * @notice Verifica se o endereço é um forwarder confiável (ERC2771)
     */
    function isTrustedForwarder(address forwarder) public view override returns (bool) {
        return forwarder == trustedForwarder;
    }

    // ============================================
    // FUNÇÕES ADMINISTRATIVAS
    // ============================================

    /**
     * @notice Atualiza carteira da plataforma
     */
    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Endereco invalido");
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }

    /**
     * @notice Atualiza valor mínimo de pagamento
     */
    function updateMinPayment(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Valor invalido");
        uint256 oldMin = minPaymentAmount;
        minPaymentAmount = newMin;
        emit MinPaymentUpdated(oldMin, newMin);
    }

    /**
     * @notice Atualiza o relayer autorizado para meta-transactions
     */
    function updateTrustedForwarder(address newForwarder) external onlyOwner {
        address old = trustedForwarder;
        trustedForwarder = newForwarder;
        emit TrustedForwarderUpdated(old, newForwarder);
    }

    /**
     * @notice Pausa o contrato (emergências)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Despausa o contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Saque de emergência (apenas em caso de bug crítico)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = USDC.balanceOf(address(this));
        require(balance > 0, "Sem saldo");
        USDC.safeTransfer(owner(), balance);
    }

    // ============================================
    // OVERRIDES ERC2771
    // ============================================

    function _msgSender()
        internal
        view
        override(Context, ERC2771Context)
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }
}