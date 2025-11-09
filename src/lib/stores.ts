import { writable } from 'svelte/store';
import type { GestureType } from './ml/poseDetector';
import type { User } from 'firebase/auth';

export const view = writable('hero');

export const totalTime = writable(300);
export const showerThought = writable('');

export const tutorialCompleted = writable(false);

// Pose detection - raw poses from MoveNet
export const currentPoses = writable<any[]>([]);

// Current gesture being tested (set by ShowerStep)
export const targetGesture = writable<GestureType | null>(null);

// Gesture analysis result - computed by poseDetector, consumed by ShowerStep
export const gestureAnalysis = writable<{
    isActive: boolean;
    confidence: number;
    gesture: GestureType | null;
}>({ isActive: false, confidence: 0, gesture: null });

// Re-export Web3/Wallet stores from web3.ts to avoid duplication
export { walletAddress } from './web3';
export const mintedTokenId = writable<number | null>(null);
export const mintTxHash = writable<string | null>(null);

// Captured shower selfie (base64, stored locally until mint)
export const capturedImageData = writable<string | null>(null);

// Latest NFT data from blockchain (loaded via Alchemy on login)
export interface LatestNFTData {
	tokenId: number;
	expiresAt: number; // Unix timestamp (seconds)
	mintTime: number; // Unix timestamp (seconds)
	showerThought: string;
	imageUrl: string;
	customTimeout: number; // Timeout in seconds
	isValid: boolean;
}

export const latestNFTData = writable<LatestNFTData | null>(null);
export const isLoadingNFTData = writable(false);

// Polling countdown (for debug display)
export const nextPollIn = writable<number>(10); // Seconds until next poll

// Firebase Auth
export const currentUser = writable<User | null>(null);
export const friendsPhoneNumbers = writable<string[]>([]);
export const hasCompletedOnboarding = writable(false);

export function showView(viewName: string) {
    view.set(viewName);
}
