# GitHub Copilot Instructions for ShowerNFT Project

## Project Overview

**ShowerNFT - The Groom Protocol** is a humorous hackathon project at UWaterloo that addresses the stereotype of CS students not showering. Users verify their hygiene by minting time-limited "Proof-of-Lather" NFTs valid for 24 hours.

## Core Concept

- **Purpose**: Gamified shower verification app with blockchain NFTs
- **Humor**: CS student hygiene stereotype + crypto culture satire
- **Features**: Audio verification, mini-games, 24-hour NFT expiry, social accountability (push notifications to friends when someone becomes "stinky")

## Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **State Management**: Svelte stores (writable)
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Firestore (user profiles with `latestNFT` object)
- **Storage**: Firebase Storage (shower selfie images)
- **Blockchain**: ethers.js v6, MetaMask, Base Sepolia testnet
- **Smart Contract**: ShowerNFTv2 ERC-721 with metadata & custom expiry
- **Data Source**: Firebase Firestore (primary) - NOT Alchemy (blockchain is permanent)
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Notifications**: Twilio SMS (10-second client-side polling for expiry)

## Project Structure

```
src/
├── lib/
│   ├── stores.ts           # Global state management
│   ├── web3.ts             # Web3 utilities (wallet, minting, network switching)
│   ├── firebase.ts         # Firebase configuration
│   ├── authService.ts      # Firebase auth, Firestore, Storage operations, SMS notifications
│   ├── alchemyService.ts   # Alchemy API (DEPRECATED - not used in production)
│   ├── components/          # UI components for each flow step
│   │   ├── Login.svelte
│   │   ├── Onboarding.svelte
│   │   ├── Dashboard.svelte
│   │   ├── Hero.svelte
│   │   ├── Tutorial.svelte
│   │   ├── ShowerTutorial.svelte
│   │   ├── Verification.svelte
│   │   ├── MiniGame.svelte
│   │   ├── Minting.svelte
│   │   ├── ImageCapture.svelte
│   │   ├── Loading.svelte
│   │   └── Complete.svelte
│   └── ml/
│       └── poseDetector.ts  # TensorFlow.js pose detection
└── routes/
    ├── +page.svelte        # Main app with component routing
    ├── +layout.svelte
    └── api/
        └── check-expired-nfts/
            └── +server.ts  # Legacy API endpoint (NOT USED - client-side polling instead)

.github/
├── copilot-instructions.md
├── google_firebase_design.md
├── sms_design.md           # SMS notification system documentation
├── vercel_design.md
├── shower_tutorial_design.md
└── upgraded_smart_contract.md  # v2 upgrade technical documentation

ShowerNFT.sol               # v1 contract (deprecated)
ShowerNFTv2.sol             # v2 contract (current, awaiting deployment)
vercel.json                 # Vercel deployment config
```

## Current Flow

1. **Login** - Google Sign-In with Firebase Auth
2. **Onboarding** - Connect MetaMask wallet + add friend phone numbers
3. **Dashboard** - Homepage with 24hr countdown timer + "Freshen Up" button
4. **Tutorial** - Instructions for shower verification (skipped if completed before)
5. **ShowerTutorial** - Interactive pose detection tutorial
6. **Verification** - Audio/sensor input + pose detection
7. **MiniGame** - Lather-Rinse-Repeat sequence memory game
8. **Minting** - NFT creation process (enter shower thought)
9. **Loading** - Transaction processing
10. **Complete** - Success confirmation, return to Dashboard

## State Management Pattern

All views are managed through `stores.ts`:

```typescript
export const view = writable("hero");
export function showView(viewName: string) {
  view.set(viewName);
}
```

Components use: `import { showView } from '$lib/stores';`

## Code Style & Conventions

- **TypeScript**: Use TypeScript for all logic
- **Components**: Use `<script lang="ts">` in Svelte files
- **Styling**: TailwindCSS utility classes (no custom CSS unless necessary)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Imports**: Use `$lib/` alias for library imports

## Tone & Content

- **Humor**: Maintain satirical/ironic tone about hygiene verification
- **Branding**: "Groom Protocol", "Proof-of-Lather", blockchain buzzwords
- **UX**: Simple, fast, gamified - this is a hackathon project!

## Development Priorities

1. **Speed > Perfection**: This is a hackathon - ship fast!
2. **Meme Value**: Funny features > technical sophistication
3. **Demo-Ready**: Focus on visual polish and storytelling

## Implementation Status

- [x] Blockchain integration (wallet connection, NFT minting) ✅ **COMPLETE**
- [x] Login with Google, storing user data in Firebase ✅ **COMPLETE**
- [x] Firebase backend with user profiles (single `latestNFT` object) ✅ **COMPLETE**
- [x] Firebase Storage for shower selfie images ✅ **COMPLETE**
- [x] Dashboard with real-time countdown from Firebase data ✅ **COMPLETE**
- [x] ShowerNFTv2 contract with metadata & custom timeout ✅ **COMPLETE**
- [x] Image capture component for shower selfies ✅ **COMPLETE**
- [x] Tutorial skip for returning users ✅ **COMPLETE**
- [x] Client-side image upload (bypasses server-side auth issues) ✅ **COMPLETE**
- [x] Real NFT image display on Complete screen ✅ **COMPLETE**
- [x] 10-second client-side polling for NFT expiry ✅ **COMPLETE**
- [x] Automatic NFT deletion on expiry (Firestore + Storage) ✅ **COMPLETE**
- [x] SMS notifications via Twilio on expiry ✅ **COMPLETE**
- [x] Visual debug countdown timer ✅ **COMPLETE**
- [x] Firebase as single source of truth (NOT blockchain) ✅ **COMPLETE**
- [ ] Deploy ShowerNFTv2 contract to Base Sepolia ⏳ **AWAITING DEPLOYMENT**
- [ ] User search/discovery page to view other users' NFT status
- [ ] Auto-burn expired NFTs (Chainlink Automation or manual trigger)
- [ ] Streak tracking
- [ ] Leaderboard of "cleanest" students

## Blockchain Integration Notes

**Current Implementation (v2.0):**

- ✅ MetaMask wallet connection with auto-network switching
- ✅ Base Sepolia testnet deployment
- ✅ ShowerNFTv2 ERC-721 with on-chain metadata
- ✅ Custom timeout per NFT (demo mode support)
- ✅ Shower thought storage (max 100 chars, on-chain)
- ✅ Image URL storage (Firebase Storage URL, on-chain)
- ✅ Real-time countdown from **Firebase data** (NOT blockchain)
- ✅ Transaction tracking and BaseScan links
- ✅ 5-minute MetaMask confirmation timeout
- ✅ OpenSea testnet integration

**Important**: Firebase is the **single source of truth** for NFT status. Blockchain NFTs are permanent and cannot be deleted, so we use Firebase to track which NFTs are "active" (fresh) vs expired (stinky).

**Data Flow**:
1. User mints NFT → Blockchain transaction + Firebase record
2. Dashboard loads → **Firebase only** (NOT Alchemy API)
3. NFT expires → **Delete from Firebase** (blockchain NFT remains but ignored)
4. New user → No Firebase record → Shows "NO NFT" (even if blockchain has old NFTs)

**Smart Contract:** `ShowerNFTv2.sol` (awaiting deployment)

- Enhanced ERC-721 with metadata struct
- Configurable timeout (0 = 24hr default, or custom seconds)
- Functions: `mint(thought, imageUrl, timeout)`, `getMetadata()`, `burn()`, `isValid()`, `timeRemaining()`
- Stores: mintTime, customTimeout, showerThought, imageUrl, burned status
- Events: `NFTMinted` with full metadata
- **Status**: Ready to deploy (replace CONTRACT_ADDRESS in web3.ts after deployment)

**Previous Contract:** `ShowerNFT.sol` (v1, deprecated)

- Basic ERC-721 with timestamp only
- Deployed to Base Sepolia at: `0x4068028D9161B31c3dde5C5C99C4F12205b6C7b7`
- **Status**: Replaced by v2

## Testing/Running

- Dev server: `npm run dev`
- Build: `npm run build`
- Type checking: `npm run check`

---

**Remember**: This is a meme project! Embrace the absurdity. Make it funny, make it fast, make it demo-able! 🚿✨

## Common Tasks

- **New view**: Create component in `src/lib/components/`, add to routing in `+page.svelte`
- **New state**: Add to `stores.ts` with writable store
- **Styling**: Use TailwindCSS classes, maintain consistent spacing/shadows
- **Navigation**: Use `showView('viewName')` function

## Testing/Running

- Dev server: `npm run dev`
- Build: `npm run build`
- Type checking: `npm run check`

---

**Remember**: This is a meme project! Embrace the absurdity. Make it funny, make it fast, make it demo-able! 🚿✨

## Next Priority Features

### 1. User Discovery Page 🔍

**Goal**: View other users' NFT status at dashboard

**Implementation**:

- Add "Browse Users" page/tab on dashboard
- Search functionality by email address
- Display user cards showing:
  - User name & profile picture
  - Most recent NFT mint status (FRESH ✨ or STINKY 🤢)
  - NFT image from Firebase Storage
  - Pull data from Firestore (user profiles + latestNFT object)

**Acceptance Criteria**:

- [ ] Search bar to find users by email
- [ ] Display all users as cards
- [ ] Show user's current hygiene status
- [ ] Display actual NFT image from latestNFT.imageUrl

### 2. SMS Notifications on Expiry 📱

**Goal**: Notify friends when NFT expires (user becomes "stinky")

**Status**: ✅ **COMPLETE** - Client-side polling with Twilio SMS

**How It Works**:

- Dashboard component checks expiry every **10 seconds** (client-side)
- If NFT expired and `isValid: true`:
  - Sends SMS via Twilio to each friend
  - Deletes NFT from Firebase (Firestore + Storage)
  - Clears local stores to prevent re-notification
- Visual debug timer shows "Next expiry check in: Xs"

**Twilio SMS Message**:

- "🚿 ALERT: [User Name] is now officially STINKY! Their Proof-of-Lather NFT has expired. Shame them into showering! - The Groom Protocol"

**Acceptance Criteria**:

- [x] Client-side polling implemented in Dashboard (10s interval) ✅
- [x] Visual countdown timer ✅
- [x] SMS sent via Twilio to each friend ✅
- [x] NFT deleted from Firebase after notification ✅
- [x] Storage blob deleted to save space ✅
- [x] No duplicate notifications ✅

**Documentation**: See `.github/sms_design.md` for full implementation details

## CI/CD Status

✅ **FULLY OPERATIONAL** - Client-side architecture, no Vercel cron needed

**What's Configured**:

- ✅ Vercel auto-deploy from GitHub
- ✅ Client-side polling from Dashboard (every 10 seconds)
- ✅ Per-user NFT checking (no duplicates)
- ✅ 100% free tier compatible
- ✅ Twilio SMS integration (client-side)

**What's Working**:

- ✅ Dashboard polls every 10 seconds
- ✅ Visual countdown timer
- ✅ SMS sent on expiry
- ✅ NFT deletion (Firestore + Storage)
- ✅ No fallback "fake NFT" behavior

---

**See Also**:

- `.github/upgraded_smart_contract.md` - Full v2 upgrade technical details
- `.github/sms_design.md` - SMS notification system architecture ⭐ **NEW**
- `.github/vercel_design.md` - Vercel deployment config
- `.github/google_firebase_design.md` - Firebase architecture
- `.github/shower_tutorial_design.md` - Pose detection tutorial

**Remember**: This is a meme project! Embrace the absurdity. Make it funny, make it fast, make it demo-able! 🚿✨
