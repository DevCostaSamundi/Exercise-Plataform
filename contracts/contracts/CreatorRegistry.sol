// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorRegistry
 * @notice Sistema de reputação on-chain para criadores de tokens
 */
contract CreatorRegistry is Ownable {
    // ========== Structs ==========
    
    struct CreatorProfile {
        string name;                  // Nome do criador
        string bio;                   // Biografia
        string website;               // Website/social
        string twitter;               // Twitter handle
        string telegram;              // Telegram
        uint256 registeredAt;         // Timestamp de registro
        bool isVerified;              // Verificado pela plataforma
        bool isBanned;                // Banido
    }
    
    struct CreatorStats {
        uint256 tokensCreated;        // Total de tokens criados
        uint256 totalVolume;          // Volume total gerado
        uint256 totalRatings;         // Número de ratings
        uint256 sumRatings;           // Soma dos ratings (para média)
        uint256 flags;                // Número de reports
    }
    
    struct Rating {
        address rater;
        uint8 score;                  // 1-5 stars
        string comment;
        uint256 timestamp;
    }

    // ========== State Variables ==========
    
    mapping(address => CreatorProfile) public profiles;
    mapping(address => CreatorStats) public stats;
    mapping(address => Rating[]) public ratings;
    mapping(address => mapping(address => bool)) public hasRated;
    
    // Lista de criadores registrados
    address[] public creators;
    mapping(address => bool) public isRegistered;
    
    // Verificadores (podem verificar criadores)
    mapping(address => bool) public verifiers;
    
    uint256 public totalCreators;
    
    // ========== Events ==========
    
    event CreatorRegistered(
        address indexed creator,
        string name,
        uint256 timestamp
    );
    
    event ProfileUpdated(
        address indexed creator,
        uint256 timestamp
    );
    
    event CreatorRated(
        address indexed creator,
        address indexed rater,
        uint8 score,
        uint256 timestamp
    );
    
    event CreatorFlagged(
        address indexed creator,
        address indexed flagger,
        string reason,
        uint256 timestamp
    );
    
    event CreatorVerified(
        address indexed creator,
        address indexed verifier,
        uint256 timestamp
    );
    
    event CreatorBanned(
        address indexed creator,
        string reason,
        uint256 timestamp
    );
    
    event StatsUpdated(
        address indexed creator,
        uint256 tokensCreated,
        uint256 totalVolume
    );

    // ========== Constructor ==========
    
    constructor() Ownable(msg.sender) {
        verifiers[msg.sender] = true;
    }

    // ========== Registration ==========
    
    /**
     * @notice Registra perfil de criador
     */
    function registerCreator(
        string calldata name,
        string calldata bio,
        string calldata website,
        string calldata twitter,
        string calldata telegram
    ) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(bio).length <= 500, "Bio too long");
        
        profiles[msg.sender] = CreatorProfile({
            name: name,
            bio: bio,
            website: website,
            twitter: twitter,
            telegram: telegram,
            registeredAt: block.timestamp,
            isVerified: false,
            isBanned: false
        });
        
        creators.push(msg.sender);
        isRegistered[msg.sender] = true;
        totalCreators++;
        
        emit CreatorRegistered(msg.sender, name, block.timestamp);
    }
    
    /**
     * @notice Atualiza perfil
     */
    function updateProfile(
        string calldata name,
        string calldata bio,
        string calldata website,
        string calldata twitter,
        string calldata telegram
    ) external {
        require(isRegistered[msg.sender], "Not registered");
        require(!profiles[msg.sender].isBanned, "Banned");
        require(bytes(name).length > 0, "Name required");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(bio).length <= 500, "Bio too long");
        
        CreatorProfile storage profile = profiles[msg.sender];
        profile.name = name;
        profile.bio = bio;
        profile.website = website;
        profile.twitter = twitter;
        profile.telegram = telegram;
        
        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    // ========== Rating System ==========
    
    /**
     * @notice Avalia um criador
     * @param creator Endereço do criador
     * @param score 1-5 stars
     * @param comment Comentário opcional
     */
    function rateCreator(
        address creator,
        uint8 score,
        string calldata comment
    ) external {
        require(isRegistered[creator], "Creator not registered");
        require(!profiles[creator].isBanned, "Creator banned");
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(!hasRated[creator][msg.sender], "Already rated");
        require(msg.sender != creator, "Cannot rate yourself");
        require(bytes(comment).length <= 500, "Comment too long");
        
        ratings[creator].push(Rating({
            rater: msg.sender,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        }));
        
        hasRated[creator][msg.sender] = true;
        
        CreatorStats storage creatorStats = stats[creator];
        creatorStats.totalRatings++;
        creatorStats.sumRatings += score;
        
        emit CreatorRated(creator, msg.sender, score, block.timestamp);
    }
    
    /**
     * @notice Reporta um criador
     */
    function flagCreator(
        address creator,
        string calldata reason
    ) external {
        require(isRegistered[creator], "Creator not registered");
        require(bytes(reason).length > 0, "Reason required");
        require(bytes(reason).length <= 500, "Reason too long");
        
        stats[creator].flags++;
        
        emit CreatorFlagged(creator, msg.sender, reason, block.timestamp);
    }

    // ========== Stats Updates ==========
    
    /**
     * @notice Atualiza stats de criador (chamado por contratos)
     * @dev Apenas owner/trusted contracts
     */
    function updateStats(
        address creator,
        uint256 volumeToAdd
    ) external onlyOwner {
        require(isRegistered[creator], "Creator not registered");
        
        CreatorStats storage creatorStats = stats[creator];
        creatorStats.tokensCreated++;
        creatorStats.totalVolume += volumeToAdd;
        
        emit StatsUpdated(creator, creatorStats.tokensCreated, creatorStats.totalVolume);
    }
    
    /**
     * @notice Incrementa tokens created (manual)
     */
    function incrementTokensCreated(address creator) external onlyOwner {
        require(isRegistered[creator], "Creator not registered");
        stats[creator].tokensCreated++;
    }

    // ========== View Functions ==========
    
    /**
     * @notice Retorna perfil completo
     */
    function getProfile(address creator) external view returns (
        string memory name,
        string memory bio,
        string memory website,
        string memory twitter,
        string memory telegram,
        uint256 registeredAt,
        bool isVerified,
        bool isBanned
    ) {
        CreatorProfile memory profile = profiles[creator];
        return (
            profile.name,
            profile.bio,
            profile.website,
            profile.twitter,
            profile.telegram,
            profile.registeredAt,
            profile.isVerified,
            profile.isBanned
        );
    }
    
    /**
     * @notice Retorna stats de criador
     */
    function getStats(address creator) external view returns (
        uint256 tokensCreated,
        uint256 totalVolume,
        uint256 averageRating,
        uint256 totalRatings,
        uint256 flags
    ) {
        CreatorStats memory creatorStats = stats[creator];
        
        uint256 avg = 0;
        if (creatorStats.totalRatings > 0) {
            avg = (creatorStats.sumRatings * 100) / creatorStats.totalRatings; // 2 decimals
        }
        
        return (
            creatorStats.tokensCreated,
            creatorStats.totalVolume,
            avg,
            creatorStats.totalRatings,
            creatorStats.flags
        );
    }
    
    /**
     * @notice Retorna rating médio
     */
    function getAverageRating(address creator) public view returns (uint256) {
        CreatorStats memory creatorStats = stats[creator];
        
        if (creatorStats.totalRatings == 0) return 0;
        
        // Retorna com 2 casas decimais (ex: 450 = 4.50 stars)
        return (creatorStats.sumRatings * 100) / creatorStats.totalRatings;
    }
    
    /**
     * @notice Retorna ratings de um criador
     */
    function getRatings(
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (Rating[] memory) {
        Rating[] memory allRatings = ratings[creator];
        
        if (offset >= allRatings.length) {
            return new Rating[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allRatings.length) {
            end = allRatings.length;
        }
        
        uint256 size = end - offset;
        Rating[] memory result = new Rating[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allRatings[offset + i];
        }
        
        return result;
    }
    
    /**
     * @notice Retorna total de ratings de um criador
     */
    function getRatingsCount(address creator) external view returns (uint256) {
        return ratings[creator].length;
    }
    
    /**
     * @notice Lista criadores com filtros
     */
    function getCreators(
        uint256 offset,
        uint256 limit,
        bool onlyVerified
    ) external view returns (address[] memory) {
        if (offset >= creators.length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > creators.length) {
            end = creators.length;
        }
        
        // Conta quantos passam no filtro
        uint256 count = 0;
        for (uint256 i = offset; i < end; i++) {
            if (!onlyVerified || profiles[creators[i]].isVerified) {
                count++;
            }
        }
        
        address[] memory result = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = offset; i < end; i++) {
            if (!onlyVerified || profiles[creators[i]].isVerified) {
                result[index] = creators[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Retorna top criadores por volume
     */
    function getTopCreators(uint256 limit) external view returns (
        address[] memory topCreators,
        uint256[] memory volumes
    ) {
        // Simplificado: retorna primeiros N
        // Versão production: ordenar por volume
        uint256 size = limit > creators.length ? creators.length : limit;
        
        topCreators = new address[](size);
        volumes = new uint256[](size);
        
        for (uint256 i = 0; i < size; i++) {
            topCreators[i] = creators[i];
            volumes[i] = stats[creators[i]].totalVolume;
        }
        
        return (topCreators, volumes);
    }

    // ========== Admin Functions ==========
    
    /**
     * @notice Adiciona verificador
     */
    function addVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = true;
    }
    
    /**
     * @notice Remove verificador
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
    }
    
    /**
     * @notice Verifica criador
     */
    function verifyCreator(address creator) external {
        require(verifiers[msg.sender], "Not a verifier");
        require(isRegistered[creator], "Creator not registered");
        
        profiles[creator].isVerified = true;
        
        emit CreatorVerified(creator, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Remove verificação
     */
    function unverifyCreator(address creator) external onlyOwner {
        require(isRegistered[creator], "Creator not registered");
        profiles[creator].isVerified = false;
    }
    
    /**
     * @notice Bane criador
     */
    function banCreator(address creator, string calldata reason) external onlyOwner {
        require(isRegistered[creator], "Creator not registered");
        require(!profiles[creator].isBanned, "Already banned");
        
        profiles[creator].isBanned = true;
        
        emit CreatorBanned(creator, reason, block.timestamp);
    }
    
    /**
     * @notice Remove ban
     */
    function unbanCreator(address creator) external onlyOwner {
        require(isRegistered[creator], "Creator not registered");
        require(profiles[creator].isBanned, "Not banned");
        
        profiles[creator].isBanned = false;
    }
}
