// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShowerNFTv2 - The Groom Protocol 🚿
 * @notice Proof-of-Lather NFTs with custom expiry, shower thoughts, and image URLs
 * @dev Enhanced version with auto-burn, metadata storage, and configurable timeouts
 */
contract ShowerNFTv2 is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Default timeout: 24 hours (in seconds)
    uint256 public constant DEFAULT_TIMEOUT = 86400;
    
    // Maximum shower thought length
    uint256 public constant MAX_THOUGHT_LENGTH = 100;
    
    // NFT metadata per token
    struct NFTMetadata {
        uint256 mintTime;
        uint256 customTimeout;
        string showerThought;
        string imageUrl;
        bool burned;
    }
    
    // tokenId => metadata
    mapping(uint256 => NFTMetadata) public nftMetadata;
    
    // Events
    event NFTMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 mintTime,
        uint256 timeout,
        string showerThought,
        string imageUrl
    );
    
    event NFTBurned(uint256 indexed tokenId, uint256 burnTime);
    
    constructor() ERC721("ShowerNFT", "SHOWER") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @notice Mint a new Proof-of-Lather NFT
     * @param showerThought Your shower thought (max 100 characters)
     * @param imageUrl URL to your shower selfie (stored in Firebase)
     * @param customTimeout Custom expiry timeout in seconds (0 = use default 24hr)
     * @return tokenId The newly minted token ID
     */
    function mint(
        string memory showerThought,
        string memory imageUrl,
        uint256 customTimeout
    ) public returns (uint256) {
        // Validate shower thought length
        require(
            bytes(showerThought).length <= MAX_THOUGHT_LENGTH,
            "ShowerNFT: Thought too long (max 100 chars)"
        );
        
        // Validate timeout (if 0, use default)
        uint256 timeout = customTimeout == 0 ? DEFAULT_TIMEOUT : customTimeout;
        require(timeout >= 60, "ShowerNFT: Timeout must be at least 60 seconds");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint the NFT
        _safeMint(msg.sender, tokenId);
        
        // Store metadata
        nftMetadata[tokenId] = NFTMetadata({
            mintTime: block.timestamp,
            customTimeout: timeout,
            showerThought: showerThought,
            imageUrl: imageUrl,
            burned: false
        });
        
        emit NFTMinted(
            msg.sender,
            tokenId,
            block.timestamp,
            timeout,
            showerThought,
            imageUrl
        );
        
        return tokenId;
    }
    
    /**
     * @notice Check if an NFT is still valid (not expired)
     * @param tokenId The token ID to check
     * @return bool True if valid, false if expired or burned
     */
    function isValid(uint256 tokenId) public view returns (bool) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        if (metadata.burned) {
            return false;
        }
        
        return block.timestamp < (metadata.mintTime + metadata.customTimeout);
    }
    
    /**
     * @notice Get time remaining until NFT expires
     * @param tokenId The token ID to check
     * @return uint256 Seconds remaining (0 if expired)
     */
    function timeRemaining(uint256 tokenId) public view returns (uint256) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        if (metadata.burned) {
            return 0;
        }
        
        uint256 expiryTime = metadata.mintTime + metadata.customTimeout;
        
        if (block.timestamp >= expiryTime) {
            return 0;
        }
        
        return expiryTime - block.timestamp;
    }
    
    /**
     * @notice Get the exact expiry timestamp for an NFT
     * @param tokenId The token ID to check
     * @return uint256 Unix timestamp when NFT expires
     */
    function expiryTime(uint256 tokenId) public view returns (uint256) {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        return metadata.mintTime + metadata.customTimeout;
    }
    
    /**
     * @notice Get all metadata for an NFT
     * @param tokenId The token ID to query
     * @return NFTMetadata struct with all data
     */
    function getMetadata(uint256 tokenId) public view returns (NFTMetadata memory) {
        return nftMetadata[tokenId];
    }
    
    /**
     * @notice Burn an expired NFT (callable by owner or anyone after expiry)
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) public {
        NFTMetadata storage metadata = nftMetadata[tokenId];
        
        require(!metadata.burned, "ShowerNFT: Already burned");
        
        // Allow owner to burn anytime, or anyone to burn if expired
        bool isOwner = ownerOf(tokenId) == msg.sender;
        bool isExpired = !isValid(tokenId);
        
        require(
            isOwner || isExpired,
            "ShowerNFT: Can only burn if owner or expired"
        );
        
        metadata.burned = true;
        _burn(tokenId);
        
        emit NFTBurned(tokenId, block.timestamp);
    }
    
    /**
     * @notice Get total number of NFTs minted
     * @return uint256 Total minted count
     */
    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }
}
