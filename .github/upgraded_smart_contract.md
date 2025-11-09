# ShowerNFT v2 Upgrade - Technical Documentation

**Date**: November 9, 2025  
**Branch**: `feature/smarterContract`  
**Status**: Implementation Complete - Awaiting Contract Deployment

---

## Overview

This document outlines the technical changes made to upgrade ShowerNFT from v1 (basic ERC-721) to v2 (metadata-rich NFTs with custom expiry and image storage). This upgrade adds substantial functionality while maintaining backward compatibility with existing user flows.

---

## 1. Smart Contract Upgrade: ShowerNFTv2.sol

### Previous Contract (v1)
- **Location**: `ShowerNFT.sol`
- **Features**: Basic ERC-721 with fixed 24-hour expiry
- **Metadata**: Timestamp only (no on-chain shower thoughts or images)
- **Deployed Address**: `0x4068028D9161B31c3dde5C5C99C4F12205b6C7b7` (Base Sepolia)

### New Contract (v2)
- **Location**: `ShowerNFTv2.sol`
- **Solidity Version**: 0.8.20
- **Network**: Base Sepolia (Chain ID: 84532)

#### New Features

**1. On-Chain Metadata Storage**
```solidity
struct NFTMetadata {
    uint256 mintTime;
    uint256 customTimeout;
    string showerThought;
    string imageUrl;
    bool burned;
}
```

**2. Custom Timeout**
- Previous: Fixed 24 hours (86400 seconds)
- New: Configurable timeout per NFT
- Minimum: 60 seconds (prevents accidental instant expiry)
- Default: 0 = 24 hours (86400 seconds)
- Use Case: Demo mode with 2-5 minute expiry for testing

**3. Enhanced Mint Function**
```solidity
function mint(
    string memory showerThought,  // Max 100 chars
    string memory imageUrl,        // Firebase Storage URL
    uint256 customTimeout          // Seconds (0 = default 24hr)
) public returns (uint256)
```

**4. Metadata Query Function**
```solidity
function getMetadata(uint256 tokenId) 
    public view returns (NFTMetadata memory)
```

**5. Manual Burn Capability**
```solidity
function burn(uint256 tokenId) public
```
- Only token owner can burn
- Prevents re-use after expiry
- Future: Automatic burn via Vercel cron or Chainlink Automation

**6. Enhanced Events**
```solidity
event NFTMinted(
    address indexed owner,
    uint256 indexed tokenId,
    uint256 mintTime,
    uint256 timeout,
    string showerThought,
    string imageUrl
);
```

#### Deployment Instructions
1. Open Remix IDE: https://remix.ethereum.org
2. Copy `ShowerNFTv2.sol` into Remix
3. Compile with Solidity 0.8.20
4. Deploy to Base Sepolia:
   - Environment: Injected Provider (MetaMask)
   - Ensure MetaMask is on Base Sepolia
   - Click "Deploy"
5. Copy deployed contract address
6. Update `src/lib/web3.ts` line 16:
   ```typescript
   export const CONTRACT_ADDRESS = writable<string>('YOUR_NEW_ADDRESS');
   ```

---

## 2. Firebase Storage Integration

### Architecture Change: Client-Side Upload

**Previous Approach (Failed)**:
- Server-side upload via SvelteKit API route (`/api/upload-image`)
- **Issue**: Server-side context lacks Firebase Authentication token
- **Error**: `storage/unauthorized` (403)

**New Approach (Working)**:
- Client-side upload via `authService.ts`
- Browser has user's Firebase Auth token automatically
- Upload executes with proper authentication context

### Implementation

**Function**: `uploadShowerImage()` in `src/lib/authService.ts`

```typescript
export async function uploadShowerImage(
    imageDataUrl: string, 
    userId: string
): Promise<{ success: boolean; url?: string; error?: string }>
```

**Storage Path**: `shower-selfies/{userId}/{timestamp}.jpg`

**Process**:
1. User captures webcam snapshot (base64 JPEG)
2. Image stored in `capturedImageData` store (local browser memory)
3. On mint button click:
   - Upload to Firebase Storage (client-side)
   - Get public download URL
   - Pass URL to smart contract mint function
   - Store URL in Firestore `latestNFT` object

### Firebase Storage Rules

**Required Configuration**:
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /shower-selfies/{userId}/{filename} {
      allow read: if true;  // Public read for NFT display
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Security Model**:
- Public read: NFTs must be viewable by anyone (OpenSea, galleries, etc.)
- Authenticated write: Only the user can upload to their own folder
- Path isolation: User A cannot write to User B's folder

### Image Capture Flow

**Component**: `src/lib/components/ImageCapture.svelte`

1. **Live Preview**: `WebcamFeed.svelte` provides video stream
2. **Snapshot**: Draws current frame to canvas, converts to base64 JPEG
3. **Quality**: 85% JPEG compression (balance between size and quality)
4. **Retake**: User can retake until satisfied
5. **Local Storage**: Saved to `capturedImageData` store until mint

**Component**: `src/lib/components/Minting.svelte`

1. **Validation**: Ensures image captured before allowing mint
2. **Upload**: Calls `uploadShowerImage()` with base64 data
3. **Error Handling**: Displays user-friendly errors if upload fails
4. **Mint**: Passes Firebase Storage URL to smart contract

---

## 3. Firestore Schema Changes

### Previous Structure (Subcollection)
```
users/{userId}/
  ├── (user data)
  └── nftMints/{mintId}
      ├── tokenId
      ├── txHash
      ├── showerThought
      └── mintTime
```

**Issues**:
- Overcomplicated for "latest NFT only" use case
- Required subcollection queries for simple reads
- No NFT = stinky, so historical data less important

### New Structure (Single Object)
```
users/{userId}/
  ├── email
  ├── displayName
  ├── walletAddress
  ├── tutorialCompleted
  ├── onboardingComplete
  ├── friendsPhones[]
  └── latestNFT:
      ├── tokenId
      ├── txHash
      ├── showerThought
      ├── imageUrl
      ├── mintTime
      ├── expiresAt
      ├── customTimeout
      └── isActive
```

**Benefits**:
- Single read operation for dashboard
- Simpler expiry checking (just check `latestNFT.isActive`)
- Easier to query "who is stinky" (no NFT or `isActive: false`)
- Faster user search implementation (future feature)

**Function**: `recordNFTMint()` in `src/lib/authService.ts`

```typescript
await updateDoc(doc(db, 'users', user.uid), {
    latestNFT: {
        tokenId,
        txHash,
        showerThought,
        imageUrl,
        mintTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + timeoutMs).toISOString(),
        customTimeout,
        isActive: true
    },
    lastMintAt: new Date().toISOString()
});
```

---

## 4. Alchemy API Integration

### Purpose
Query blockchain NFT data without running a full node or relying on slow RPC calls.

### Configuration

**Environment Variable**: `VITE_ALCHEMY_API_KEY`

**Value**: `xcpHy2MYIm1r0-5YhQ6iA` (Base Sepolia API key)

### Implementation

**Service**: `src/lib/alchemyService.ts`

**Function**: `loadLatestNFTData(walletAddress: string)`

**Process**:
1. Query Alchemy NFT API for user's NFTs on Base Sepolia
2. Filter for ShowerNFT contract address
3. Get most recent token (highest tokenId)
4. Call `contract.getMetadata(tokenId)` for full details
5. Populate `latestNFTData` store with:
   - tokenId
   - expiresAt (Unix timestamp)
   - mintTime (Unix timestamp)
   - showerThought
   - imageUrl
   - customTimeout
   - isValid (calculated from current time vs expiryTime)

**Dashboard Integration**:
- Loads on mount if wallet connected
- Real-time countdown from `expiresAt` timestamp
- 30-second polling to check for expiry
- Displays actual NFT image from Firebase Storage

---

## 5. Frontend Component Changes

### Minting.svelte
**Changes**:
- Added `ImageCapture` component integration
- Added timeout selector (minutes input + 24hr default button)
- Shower thought validation (max 100 chars with live counter)
- Upload + mint flow (sequential, not parallel)
- Better error messages with user guidance

**Validation**:
```typescript
$: isValid = !thoughtError && $capturedImageData && $walletAddress;
```

### Dashboard.svelte
**Changes**:
- Added tutorial skip logic for returning users
- Loads NFT data via Alchemy on mount
- Real-time countdown (updates every second)
- 30-second polling for expiry notifications
- Displays NFT image from `latestNFTData`

**Tutorial Skip Logic**:
```typescript
if ($tutorialCompleted) {
    showView("verification");  // Skip tutorial
} else {
    showView("tutorial");  // First time
}
```

### Complete.svelte
**Changes**:
- Removed placeholder "CERTIFICATE OF CLEANLINESS" image
- Loads actual NFT data via Alchemy on mount
- Displays real shower selfie from Firebase Storage
- Shows actual token ID from blockchain
- Shows actual shower thought from contract metadata
- Loading state while NFT data fetches

---

## 6. Web3 Integration Updates

### Contract ABI Expansion
```typescript
export const CONTRACT_ABI = [
    'function mint(string memory showerThought, string memory imageUrl, uint256 customTimeout) public returns (uint256)',
    'function getMetadata(uint256 tokenId) public view returns (tuple(...))',
    'function burn(uint256 tokenId) public',
    'function isValid(uint256 tokenId) public view returns (bool)',
    'function timeRemaining(uint256 tokenId) public view returns (uint256)',
    'function expiryTime(uint256 tokenId) public view returns (uint256)',
    // ... other functions
];
```

### Mint Function Signature Change
```typescript
// v1
mintShowerNFT() -> { success, tokenId, txHash }

// v2
mintShowerNFT(
    showerThought: string,
    imageUrl: string,
    customTimeout: number
) -> { success, tokenId, txHash, error? }
```

### Error Handling Improvements
- `ACTION_REJECTED`: User cancelled MetaMask popup
- `insufficient funds`: Not enough ETH for gas
- `invalid address`: Contract not deployed
- `network`: Wrong network or RPC issues

---

## 7. State Management Changes

### New Stores in `src/lib/stores.ts`

**1. `capturedImageData`**
```typescript
export const capturedImageData = writable<string | null>(null);
```
- Stores base64 JPEG of shower selfie
- Populated by `ImageCapture` component
- Cleared after successful mint
- Prevents re-upload on retake

**2. `latestNFTData`**
```typescript
export interface LatestNFTData {
    tokenId: number;
    expiresAt: number;      // Unix timestamp (seconds)
    mintTime: number;       // Unix timestamp (seconds)
    showerThought: string;
    imageUrl: string;
    customTimeout: number;  // Timeout in seconds
    isValid: boolean;
}

export const latestNFTData = writable<LatestNFTData | null>(null);
export const isLoadingNFTData = writable(false);
```

---

## 8. API Routes (Deprecated)

### `/api/upload-image`
**Status**: Still exists but **not used**

**Reason**: Server-side Firebase Storage upload fails due to missing auth context

**Kept for**: Potential future use with service account authentication

---

## 9. Deployment Notes

### Prerequisites
1. ✅ Firebase Storage rules configured
2. ✅ Alchemy API key in environment
3. ⏳ ShowerNFTv2 contract deployed to Base Sepolia
4. ⏳ Contract address updated in `web3.ts`

### Environment Variables
```bash
VITE_ALCHEMY_API_KEY=xcpHy2MYIm1r0-5YhQ6iA
# Firebase config already in firebase.ts
```

### Post-Deployment Checklist
- [ ] Deploy ShowerNFTv2.sol via Remix
- [ ] Update CONTRACT_ADDRESS in web3.ts
- [ ] Test mint with 2-minute timeout
- [ ] Verify image displays on Complete screen
- [ ] Verify countdown works on Dashboard
- [ ] Test tutorial skip for returning users
- [ ] Verify NFT appears on OpenSea Testnet
- [ ] Test SMS notifications on expiry (30s polling)

---

## 10. Breaking Changes

### For Developers
1. **Contract Address**: Must update to new ShowerNFTv2 address
2. **Mint Function**: Now requires 3 parameters (thought, imageUrl, timeout)
3. **Firebase Rules**: Must configure Storage rules or uploads fail
4. **Stores**: New `capturedImageData` and `latestNFTData` stores

### For Users
**None** - UX flow remains identical, just enhanced features

---

## 11. Future Enhancements

### Phase 1 (Ready to Implement)
- [ ] Auto-burn expired NFTs (Vercel cron or Chainlink Automation)
- [ ] User search/discovery page (query Firestore `latestNFT`)
- [ ] SMS notifications on expiry (already polled, needs Twilio integration)

### Phase 2 (Requires Additional Work)
- [ ] IPFS metadata storage (instead of Firebase)
- [ ] Custom NFT artwork generation (based on shower duration/thought)
- [ ] Leaderboard (longest shower streaks)
- [ ] Friend badges (most hygienic friend group)

---

## 12. Known Issues & Limitations

1. **Contract Not Deployed**: Must deploy ShowerNFTv2 before production use
2. **No Auto-Burn**: Expired NFTs remain on-chain (marked invalid but not burned)
3. **Client-Side Polling**: 30s intervals for expiry checks (could miss exact expiry moment)
4. **No IPFS**: Images stored on Firebase (centralized, not decentralized)
5. **Gas Fees**: Users need Base Sepolia ETH for minting

---

## 13. Testing Strategy

### Local Testing
```bash
npm run dev
```

**Test Flow**:
1. Login with Google
2. Connect MetaMask (Base Sepolia)
3. Complete onboarding (add friend phone)
4. Complete tutorial (first time only)
5. Run verification (audio + pose detection)
6. Play mini-game
7. Capture shower selfie
8. Enter shower thought (< 100 chars)
9. Set custom timeout (2 minutes for demo)
10. Mint NFT
11. Verify MetaMask popup
12. Wait for transaction confirmation
13. Check Complete screen shows real image
14. Return to Dashboard
15. Verify countdown works
16. Click "Freshen Up" again
17. Verify tutorial skipped

### Blockchain Testing
1. Check transaction on BaseScan: `https://sepolia.basescan.org/tx/{txHash}`
2. Verify metadata on contract: Call `getMetadata(tokenId)`
3. Check NFT ownership: Call `balanceOf(walletAddress)`
4. Verify expiry: Call `isValid(tokenId)` and `timeRemaining(tokenId)`
5. Check OpenSea: `https://testnets.opensea.io/assets/base-sepolia/{contractAddress}/{tokenId}`

---

## 14. Architecture Diagram

```
User Flow:
Dashboard → Verification → Mini-Game → Minting → Loading → Complete → Dashboard

Minting Process:
1. Capture webcam snapshot (ImageCapture.svelte)
2. Store base64 in capturedImageData store
3. Click "Mint NFT" button
4. Upload to Firebase Storage (client-side with auth)
5. Get public download URL
6. Call contract.mint(thought, imageUrl, timeout)
7. MetaMask popup for transaction approval
8. Wait for transaction confirmation
9. Record to Firestore latestNFT object
10. Display success with real NFT image

Dashboard Load:
1. Check wallet connected
2. Query Alchemy for user's NFTs
3. Get latest tokenId
4. Call contract.getMetadata(tokenId)
5. Populate latestNFTData store
6. Start countdown from expiresAt
7. Poll every 30s for expiry
8. Display NFT image from Firebase URL
```

---

## 15. File Changes Summary

### New Files
- `ShowerNFTv2.sol` - Upgraded smart contract
- `src/lib/alchemyService.ts` - Alchemy API integration
- `src/lib/components/ImageCapture.svelte` - Webcam snapshot component

### Modified Files
- `src/lib/web3.ts` - New mint function signature, enhanced ABI
- `src/lib/authService.ts` - Added `uploadShowerImage()`, changed `recordNFTMint()`
- `src/lib/stores.ts` - Added `capturedImageData`, `latestNFTData`
- `src/lib/components/Minting.svelte` - Image capture, timeout selector, validation
- `src/lib/components/Dashboard.svelte` - Tutorial skip, Alchemy integration, countdown
- `src/lib/components/Complete.svelte` - Real NFT image display
- `src/routes/api/upload-image/+server.ts` - Kept but unused (deprecated)

### Deleted Files
- `hardhat.config.js` - Using Remix for deployment
- `scripts/deploy.js` - No longer needed
- `.github/ALCHEMY_SETUP.md` - Consolidated into this doc
- `.github/IMPLEMENTATION_COMPLETE.md` - Consolidated into this doc
- `.github/DEPLOYMENT_CHECKLIST.md` - Consolidated into this doc

---

## Contact & Support

For questions or issues with this upgrade:
- Check QUICKSTART.md for setup instructions
- Review .github/copilot-instructions.md for project context
- Check console logs for detailed error messages
- Verify Firebase Storage rules are published
- Ensure contract is deployed and address is updated

---

**Last Updated**: November 9, 2025  
**Next Steps**: Deploy ShowerNFTv2.sol and update CONTRACT_ADDRESS
