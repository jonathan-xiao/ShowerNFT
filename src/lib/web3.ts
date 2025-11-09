import { ethers } from 'ethers';
import { writable, get } from 'svelte/store';

// Base Sepolia Testnet Configuration
export const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in decimal
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Stores
export const walletAddress = writable<string | null>(null);
export const isConnecting = writable(false);
export const connectionError = writable<string | null>(null);
export const provider = writable<ethers.BrowserProvider | null>(null);
export const signer = writable<ethers.Signer | null>(null);

export const CONTRACT_ADDRESS = writable<string>('0x231cBc29528d2E4Cc149Cd288159c10421e51766');

// ShowerNFTv2 ABI with new functions
export const CONTRACT_ABI = [
	'function mint(string memory showerThought, string memory imageUrl, uint256 customTimeout) public returns (uint256)',
	'function balanceOf(address owner) public view returns (uint256)',
	'function tokenURI(uint256 tokenId) public view returns (string memory)',
	'function isValid(uint256 tokenId) public view returns (bool)',
	'function timeRemaining(uint256 tokenId) public view returns (uint256)',
	'function expiryTime(uint256 tokenId) public view returns (uint256)',
	'function getMetadata(uint256 tokenId) public view returns (tuple(uint256 mintTime, uint256 customTimeout, string showerThought, string imageUrl, bool burned))',
	'function burn(uint256 tokenId) public',
	'function totalMinted() public view returns (uint256)',
	'event NFTMinted(address indexed owner, uint256 indexed tokenId, uint256 mintTime, uint256 timeout, string showerThought, string imageUrl)'
];

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<string | null> {
    if (!isMetaMaskInstalled()) {
        connectionError.set('MetaMask is not installed. Please install MetaMask to continue.');
        return null;
    }

    isConnecting.set(true);
    connectionError.set(null);

    try {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        const address = accounts[0];
        
        // Create provider and signer
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();

        // Update stores
        walletAddress.set(address);
        provider.set(ethersProvider);
        signer.set(ethersSigner);

        // Check if we're on Base Sepolia, if not, prompt to switch
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
            await switchToBaseSepolia();
        }

        isConnecting.set(false);
        return address;
    } catch (error: any) {
        console.error('Error connecting wallet:', error);
        connectionError.set(error.message || 'Failed to connect wallet');
        isConnecting.set(false);
        return null;
    }
}

/**
 * Switch to Base Sepolia network
 */
export async function switchToBaseSepolia(): Promise<boolean> {
    if (!window.ethereum) {
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
        });
        return true;
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: BASE_SEPOLIA_CHAIN_ID,
                            chainName: 'Base Sepolia',
                            nativeCurrency: {
                                name: 'Ethereum',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: [BASE_SEPOLIA_RPC],
                            blockExplorerUrls: ['https://sepolia.basescan.org/'],
                        },
                    ],
                });
                return true;
            } catch (addError) {
                console.error('Error adding Base Sepolia network:', addError);
                return false;
            }
        }
        console.error('Error switching to Base Sepolia:', switchError);
        return false;
    }
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
    walletAddress.set(null);
    provider.set(null);
    signer.set(null);
}

/**
 * Mint a Shower NFT v2 with metadata
 * @param showerThought - User's shower thought (max 100 chars)
 * @param imageUrl - Firebase Storage URL for shower selfie
 * @param customTimeout - Timeout in seconds (0 = default 24hr)
 */
export async function mintShowerNFT(
	showerThought: string = '',
	imageUrl: string = '',
	customTimeout: number = 0
): Promise<{ success: boolean; tokenId?: number; txHash?: string; error?: string }> {
	const currentSigner = get(signer);
	const contractAddress = get(CONTRACT_ADDRESS);
	const address = get(walletAddress);

	if (!currentSigner || !address) {
		return { success: false, error: 'Wallet not connected' };
	}

	if (!contractAddress) {
		return { success: false, error: 'Contract address not set. Please deploy the contract first.' };
	}

	try {
		// Create contract instance
		const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, currentSigner);

		// Call mint function with new parameters
		const tx = await contract.mint(showerThought, imageUrl, customTimeout);

		// Wait for transaction to be mined (increased timeout to 5 minutes for user confirmation)
		const receipt = await tx.wait(1, 300000); // 1 confirmation, 5 minute timeout

		// Parse NFTMinted event to get token ID
		let tokenId = 0;
		if (receipt.logs && receipt.logs.length > 0) {
			const iface = new ethers.Interface(CONTRACT_ABI);
			for (const log of receipt.logs) {
				try {
					const parsedLog = iface.parseLog({
						topics: [...log.topics],
						data: log.data
					});
					if (parsedLog && parsedLog.name === 'NFTMinted') {
						tokenId = Number(parsedLog.args.tokenId);
						break;
					}
				} catch (e) {
					// Not the event we're looking for
				}
			}
		}

		return {
			success: true,
			txHash: receipt.hash,
			tokenId
		};
	} catch (error: any) {
		console.error('Minting error:', error);
		
		// Better error messages
		let errorMsg = error.message || 'Failed to mint NFT';
		
		if (error.code === 'ACTION_REJECTED') {
			errorMsg = 'Transaction rejected by user';
		} else if (error.message?.includes('insufficient funds')) {
			errorMsg = 'Insufficient funds for gas fees';
		} else if (error.message?.includes('invalid address')) {
			errorMsg = 'Invalid contract address - please deploy ShowerNFTv2 first!';
		} else if (error.message?.includes('network')) {
			errorMsg = 'Network error - are you connected to Base Sepolia?';
		}
		
		return {
			success: false,
			error: errorMsg
		};
	}
}

/**
 * Format wallet address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Listen for account changes
 */
if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            walletAddress.set(accounts[0]);
        }
    });

    window.ethereum.on('chainChanged', () => {
        // Reload the page when chain changes
        window.location.reload();
    });
}
