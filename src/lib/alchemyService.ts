import { ethers } from 'ethers';
import type { LatestNFTData } from './stores';
import { latestNFTData, isLoadingNFTData } from './stores';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './web3';
import { get } from 'svelte/store';

/**
 * Load user's latest NFT data using Alchemy API
 * @param walletAddress - User's wallet address
 */
export async function loadLatestNFTData(walletAddress: string): Promise<void> {
	if (!walletAddress) {
		console.warn('No wallet address provided');
		return;
	}

	const alchemyUrl = import.meta.env.VITE_ALCHEMY_BASE_SEPOLIA_URL;
	if (!alchemyUrl) {
		console.error('Alchemy URL not configured. Please set VITE_ALCHEMY_BASE_SEPOLIA_URL in .env');
		return;
	}

	isLoadingNFTData.set(true);

	try {
		console.log('🔮 Loading NFT data for:', walletAddress);

		// Create Alchemy provider
		const provider = new ethers.JsonRpcProvider(alchemyUrl);
		const contractAddress = get(CONTRACT_ADDRESS);
		const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

		// Get user's balance
		const balance = await contract.balanceOf(walletAddress);
		console.log('📊 NFT Balance:', balance.toString());

		if (balance === 0n) {
			console.log('No NFTs found');
			latestNFTData.set(null);
			isLoadingNFTData.set(false);
			return;
		}

		// Get total minted count to find latest token ID
		// For now, we'll use Alchemy's NFT API to get user's NFTs
		const alchemyApiUrl = `${alchemyUrl.replace('/v2/', '/nft/v3/')}/getNFTsForOwner`;
		const response = await fetch(
			`${alchemyApiUrl}?owner=${walletAddress}&contractAddresses[]=${contractAddress}&orderBy=transferTime`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch NFTs from Alchemy');
		}

		const data = await response.json();
		console.log('🔮 Alchemy response:', data);

		if (!data.ownedNfts || data.ownedNfts.length === 0) {
			console.log('No NFTs found in Alchemy response');
			latestNFTData.set(null);
			isLoadingNFTData.set(false);
			return;
		}

		// Get the most recent NFT (last in array since we ordered by transferTime)
		const latestNFT = data.ownedNfts[data.ownedNfts.length - 1];
		const tokenId = parseInt(latestNFT.tokenId, 16); // Convert hex to decimal

		console.log('🎯 Latest token ID:', tokenId);

		// Query contract for metadata
		const metadata = await contract.getMetadata(tokenId);
		const isValid = await contract.isValid(tokenId);
		const expiryTime = await contract.expiryTime(tokenId);

		console.log('📋 Metadata:', metadata);
		console.log('✅ Is Valid:', isValid);
		console.log('⏰ Expires At:', new Date(Number(expiryTime) * 1000));

		// Update store
		const nftData: LatestNFTData = {
			tokenId,
			expiresAt: Number(expiryTime),
			mintTime: Number(metadata.mintTime),
			showerThought: metadata.showerThought,
			imageUrl: metadata.imageUrl,
			customTimeout: Number(metadata.customTimeout),
			isValid
		};

		latestNFTData.set(nftData);
		console.log('✅ NFT data loaded successfully');
	} catch (error) {
		console.error('Error loading NFT data:', error);
		latestNFTData.set(null);
	} finally {
		isLoadingNFTData.set(false);
	}
}

/**
 * Refresh NFT validity status (lightweight call)
 * @param tokenId - Token ID to check
 */
export async function refreshNFTValidity(tokenId: number): Promise<boolean> {
	const alchemyUrl = import.meta.env.VITE_ALCHEMY_BASE_SEPOLIA_URL;
	if (!alchemyUrl || !tokenId) {
		return false;
	}

	try {
		const provider = new ethers.JsonRpcProvider(alchemyUrl);
		const contractAddress = get(CONTRACT_ADDRESS);
		const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

		const isValid = await contract.isValid(tokenId);
		return isValid;
	} catch (error) {
		console.error('Error refreshing NFT validity:', error);
		return false;
	}
}
