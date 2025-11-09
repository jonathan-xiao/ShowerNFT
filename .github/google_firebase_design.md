# Firebase Backend Design - ShowerNFT

## Overview

ShowerNFT uses Firebase for authentication, user data storage, and NFT mint history tracking. This document details the implementation architecture.

## Services Used

### 1. Firebase Authentication

- **Provider**: Google Sign-In (OAuth)
- **Purpose**: User authentication and account creation
- **Flow**:
  1. User clicks "Sign in with Google"
  2. Google OAuth popup
  3. Firebase creates/retrieves user account
  4. User UID generated (unique identifier)

### 2. Firestore Database

- **Type**: NoSQL document database
- **Purpose**: Store user profiles, latest NFT status, friend phone numbers
- **Mode**: Production mode with security rules

### 3. Firebase Storage

- **Purpose**: Store shower selfie images (JPEGs)
- **Structure**: `shower-selfies/{userId}/{timestamp}.jpg`
- **Access**: Public read, authenticated write (user can only write to own folder)

## Database Schema

### Collection: `users`

**Document ID**: Firebase Auth UID (auto-generated)

```typescript
{
  // Basic User Info
  email: string;                    // From Google account
  displayName: string;              // From Google profile
  photoURL: string;                 // Google profile picture
  createdAt: string;                // ISO timestamp of account creation

  // Onboarding Status
  onboardingComplete: boolean;      // Has completed wallet + friends setup
  onboardingCompletedAt?: string;   // ISO timestamp

  // Tutorial Progress
  tutorialCompleted: boolean;       // Has completed shower tutorial
  tutorialCompletedAt?: string;     // ISO timestamp

  // Blockchain Integration
  walletAddress?: string;           // MetaMask wallet address (0x...)
  walletConnectedAt?: string;       // ISO timestamp of wallet connection

  // Social Features
  friendsPhones: string[];          // Array of phone numbers (+1234567890)

  // Latest NFT (Single Object)
  latestNFT?: {
    tokenId: number;                // NFT token ID from blockchain
    txHash: string;                 // Transaction hash (0x...)
    showerThought: string;          // User's shower thought
    imageUrl: string;               // Firebase Storage URL
    duration: number;               // Shower duration in seconds
    walletAddress: string;          // Wallet that minted (for verification)
    mintTime: string;               // ISO timestamp of mint
    expiresAt: string;              // ISO timestamp (mintTime + timeout)
    customTimeout: number;          // Timeout in seconds (0 = 24hr default)
    isActive: boolean;              // false if expired & friends notified
  },
  lastMintAt?: string;              // ISO timestamp of most recent mint
}
```

**Note**: Previous versions used `nftMints[]` subcollection. Now simplified to single `latestNFT` object since we only care about current hygiene status (no NFT = stinky!).

## Implementation Files

### 1. `src/lib/firebase.ts`

Firebase initialization and configuration. Exports `auth`, `googleProvider`, and `db` instances.

**Environment Variables** (all in `.env`, prefixed with `VITE_` for client access):

- API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID

### 2. `src/lib/authService.ts`

All Firebase operations (auth, Firestore CRUD).

**Key Functions**:

#### `initAuthListener()`

Monitors authentication state and loads user data.

**Flow**:

1. Listen for auth state changes
2. If user logged in:
   - Fetch user document from Firestore
   - Load data into Svelte stores
   - If new user, create document
3. If user logged out:
   - Clear all stores

**Data Loaded**:

- `currentUser` (Firebase User object)
- `hasCompletedOnboarding`
- `friendsPhoneNumbers`
- `tutorialCompleted`
- `walletAddress` (if exists)

#### `signInWithGoogle()`

Handles Google OAuth login.

**Returns**: `{ success: boolean, user?: User, error?: string }`

#### `signOut()`

Logs user out and clears session.

#### `saveFriendPhoneNumbers(phones: string[])`

Saves friend phone numbers and marks onboarding complete.

**Updates**:

- `friendsPhones` array
- `onboardingComplete: true`
- `onboardingCompletedAt` timestamp

#### `saveWalletAddress(address: string)`

Saves MetaMask wallet address to user profile.

**Updates**:

- `walletAddress`
- `walletConnectedAt` timestamp

**Use Cases**:

- During onboarding (first connection)
- When reconnecting wallet on minting page
- Auto-load on login (from Firestore)

#### `completeTutorial()`

Marks tutorial as completed.

**Updates**:

- `tutorialCompleted: true`
- `tutorialCompletedAt` timestamp

#### `recordNFTMint(mintData)`

Saves NFT mint as user's latest NFT (overwrites previous).

**Parameters**:

```typescript
{
  tokenId: number;
  txHash: string;
  showerThought: string;
  imageUrl: string;
  duration: number;
  walletAddress: string;
  customTimeout: number; // Seconds (0 = 24hr default)
}
```

**Creates NFT Record**:

```typescript
{
  ...mintData,
  mintTime: new Date().toISOString(),
  expiresAt: new Date(Date.now() + timeoutMs).toISOString(),
  isActive: true
}
```

**Updates**:

- Overwrites `latestNFT` object
- Sets `lastMintAt` timestamp

#### `getLatestNFT()`

Retrieves latest NFT for current user (null if stinky).

**Returns**: `{ success: boolean, latestNFT: object | null, error?: string }`

#### `uploadShowerImage(imageDataUrl: string, userId: string)`

**NEW in v2** - Uploads shower selfie to Firebase Storage (client-side with auth).

**Parameters**:

- `imageDataUrl`: base64 JPEG from webcam
- `userId`: Firebase Auth UID

**Process**:

1. Create unique filename: `shower-selfies/{userId}/{timestamp}.jpg`
2. Upload base64 string to Firebase Storage (uses user's auth token)
3. Get public download URL
4. Return URL for storing in Firestore and smart contract

**Returns**: `{ success: boolean, url?: string, error?: string }`

**Why Client-Side?**

- Server-side API routes lack Firebase Auth context
- Client-side upload automatically uses user's auth token
- Avoids `storage/unauthorized` errors

#### `getUserFriendPhones()`

Retrieves friend phone numbers for current user.

**Returns**: `{ success: boolean, phones: array, error?: string }`

#### `deleteExpiredNFT(imageUrl?: string)`

**NEW in v2** - Deletes expired NFT from Firebase (both Firestore and Storage).

**Parameters**:

- `imageUrl`: Firebase Storage URL (optional, extracted from latestNFT)

**Process**:

1. Parse Firebase Storage URL to extract file path using regex: `/o\/(.+?)\?/`
2. Delete image blob from Firebase Storage (uses `deleteObject()`)
3. Remove `latestNFT` field from Firestore user document (uses `deleteField()`)
4. Continue even if Storage deletion fails (Firestore cleanup is critical)

**Returns**: `{ success: boolean, error?: string }`

**Called By**: Dashboard component every 10 seconds when NFT expires

**Why Client-Side?**

- Dashboard already has user auth context
- No need for server-side API route
- Simpler architecture, fewer API calls

#### `sendExpiryNotifications(userName: string, friendPhones: string[])`

**NEW in v2** - Sends SMS notifications via Twilio when NFT expires.

**Parameters**:

- `userName`: User's display name (from `$currentUser.displayName`)
- `friendPhones`: Array of phone numbers (from `$friendsPhoneNumbers` store)

**Process**:

1. Verify Twilio credentials from environment variables
2. Loop through each friend's phone number
3. Send SMS via Twilio REST API (POST request with Basic Auth)
4. Track successes and errors
5. Return results

**Message Template**:

```
🚿 ALERT: {userName} is now officially STINKY! Their Proof-of-Lather NFT has expired. Shame them into showering! - The Groom Protocol
```

**Returns**: `{ success: boolean, sent: number, errors?: string[] }`

**Called By**: Dashboard component when NFT expires (before deletion)

**Error Handling**: Continues on individual SMS failures, logs errors

### 3. `src/lib/stores.ts`

Svelte stores for reactive state management.

**Firebase-Related Stores**:

```typescript
import type { User } from "firebase/auth";

export const currentUser = writable<User | null>(null);
export const friendsPhoneNumbers = writable<string[]>([]);
export const hasCompletedOnboarding = writable(false);
export const tutorialCompleted = writable(false);
export const nextPollIn = writable<number>(10); // NEW: Debug countdown for expiry polling
```

**Note**: `walletAddress` is re-exported from `web3.ts` to avoid duplication.

## NFT Expiry & Cleanup System

### Client-Side Polling (Dashboard Component)

**Every 10 seconds**, the Dashboard checks for expired NFTs:

```typescript
async function checkExpiredNFTs() {
  nextPollIn.set(10); // Reset countdown
  
  if (!$currentUser || !$latestNFTData) return;
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= $latestNFTData.expiresAt;
  
  if (isExpired && $latestNFTData.isValid) {
    // 1. Send SMS to friends
    if ($friendsPhoneNumbers?.length > 0) {
      await sendExpiryNotifications(userName, $friendsPhoneNumbers);
    }
    
    // 2. Delete NFT from Firebase
    await deleteExpiredNFT($latestNFTData.imageUrl);
    
    // 3. Clear local store
    latestNFTData.set(null);
  }
}
```

**Visual Feedback**: Shows countdown timer "🔍 Next expiry check in: Xs"

**Why Client-Side?**

- ✅ **Free** - No Vercel cron costs
- ✅ **Real-Time** - 10-second granularity vs 60-minute cron
- ✅ **Simple** - No server-side complexity
- ✅ **No Duplicates** - User-specific checks only

### Data Flow

1. **User mints NFT** → `recordNFTMint()` creates `latestNFT` in Firestore + uploads image to Storage
2. **Dashboard loads** → `getLatestNFT()` from Firebase (NOT blockchain)
3. **Every 10 seconds** → Check if `now >= expiresAt`
4. **On expiry** → Send SMS → Delete Firestore record → Delete Storage image → Clear local store
5. **User sees** → "NO NFT" status, can mint again

## Security Rules

### Firestore Rules (Current - Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**⚠️ WARNING**: Test mode expires 30 days after Firestore creation. Update before production!

### Firestore Rules (Recommended - Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read other users' public data (for leaderboards, search)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

### Firebase Storage Rules (Current - Production)

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Shower selfie images
    match /shower-selfies/{userId}/{filename} {
      allow read: if true;  // Public read (for NFT display, OpenSea, etc.)
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Why Public Read?**

- NFT images must be viewable by anyone (OpenSea, galleries, social sharing)
- Firebase Storage URLs are obfuscated (hard to guess)
- Authenticated write ensures users only upload to their own folder
  }
  }
  }

```

## Authentication Flow

**First-Time User**: Login → Create Firestore doc → Onboarding (wallet + friends) → Dashboard
**Returning User**: Login → Load Firestore data → Dashboard (skip onboarding)

## Component Integration

- **Login.svelte**: Calls `signInWithGoogle()`, redirects based on `hasCompletedOnboarding`
- **Onboarding.svelte**: Calls `saveWalletAddress()` + `saveFriendPhoneNumbers()`
- **Dashboard.svelte**: 
  - Loads NFT via `getLatestNFT()` on mount
  - Polls every 10 seconds for expiry
  - Sends SMS via `sendExpiryNotifications()`
  - Deletes NFT via `deleteExpiredNFT()`
  - Shows visual countdown timer
- **Minting.svelte**: Calls `uploadShowerImage()` + `recordNFTMint()` after blockchain mint
- **Complete.svelte**: Loads NFT via `getLatestNFT()` to display real image
- **ShowerTutorial.svelte**: Calls `completeTutorial()` on finish

---

**Status**: ✅ Fully implemented and tested
**Key Features**: 
- Client-side NFT deletion (Firestore + Storage)
- 10-second polling for expiry detection
- SMS notifications via Twilio
- Firebase as single source of truth (not blockchain)
- Visual debug countdown timer
```
